import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Model, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enum/order.enum.js';
import { OrderModel } from '../../database/Model/order.model.js';
import { PaymentModel } from '../../database/Model/payment.model.js';
import { AddressModel } from '../../database/Model/address.model.js';
import { User } from '../../database/Model/user.model.js';
import { CouponService } from '../coupon/coupon.service.js';
import { NotificationService } from '../notification/notification.service.js';

const HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order.id',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentModel.name)
    private readonly paymentModel: Model<PaymentModel>,
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderModel>,
    @InjectModel(AddressModel.name)
    private readonly addressModel: Model<AddressModel>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly couponService: CouponService,
    private readonly notificationService: NotificationService,
  ) {}

  async createSession(userId: string, orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }
    const order = await this.orderModel
      .findOne({ _id: orderId, user: new Types.ObjectId(userId) })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.paymentMethod !== PaymentMethod.CARD) {
      throw new BadRequestException('Paymob is only available for card orders');
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('Order has already been paid');
    }
    if (order.total <= 0) {
      throw new BadRequestException('Order total must be greater than zero');
    }

    const previousPayment = await this.paymentModel
      .findOne({ order: order._id })
      .select('+paymentToken')
      .exec();
    if (previousPayment?.status === 'paid') {
      throw new ConflictException('Order has already been paid');
    }
    if (
      previousPayment?.status === 'pending' &&
      previousPayment.checkoutUrl
    ) {
      return {
        orderId: order._id.toString(),
        currency: 'EGP',
        amountCents: previousPayment.amountCents,
        checkoutUrl: previousPayment.checkoutUrl,
      };
    }

    const apiKey = process.env.PAYMOB_API_KEY;
    const integrationId = Number(process.env.PAYMOB_INTEGRATION_ID);
    const iframeId = process.env.PAYMOB_IFRAME_ID;
    if (!apiKey || !Number.isInteger(integrationId) || !iframeId) {
      throw new ServiceUnavailableException(
        'Paymob configuration is incomplete',
      );
    }

    const amountCents = Math.round(order.total * 100);
    const baseUrl = (
      process.env.PAYMOB_API_BASE_URL ?? 'https://accept.paymob.com/api'
    ).replace(/\/+$/, '');
    const auth = await this.paymobPost<{ token?: string }>(`${baseUrl}/auth/tokens`, {
      api_key: apiKey,
    });
    if (!auth.token) {
      throw new ServiceUnavailableException('Paymob did not return an auth token');
    }

    const paymobOrder = await this.paymobPost<{ id?: number | string }>(
      `${baseUrl}/ecommerce/orders`,
      {
        auth_token: auth.token,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        items: [],
      },
    );
    if (!paymobOrder.id) {
      throw new ServiceUnavailableException(
        'Paymob did not return a gateway order id',
      );
    }

    const [address, user] = await Promise.all([
      this.addressModel.findOne({ _id: order.shippingAddress, user: order.user }),
      this.userModel.findById(order.user).select({ email: 1, fname: 1, lname: 1 }),
    ]);
    if (!address || !user) {
      throw new BadRequestException('Order billing details are unavailable');
    }
    const recipientNames = address.recipientName.trim().split(/\s+/);
    const paymentKey = await this.paymobPost<{ token?: string }>(
      `${baseUrl}/acceptance/payment_keys`,
      {
        auth_token: auth.token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: paymobOrder.id,
        billing_data: {
          apartment: address.apartment || 'NA',
          email: user.email,
          floor: 'NA',
          first_name: recipientNames[0] || user.fname || 'Customer',
          street: address.street,
          building: address.building,
          phone_number: address.phone,
          shipping_method: 'NA',
          postal_code: address.postalCode || 'NA',
          city: address.city,
          country: 'EG',
          last_name:
            recipientNames.slice(1).join(' ') || user.lname || 'Customer',
          state: address.governorate,
        },
        currency: 'EGP',
        integration_id: integrationId,
        lock_order_when_paid: true,
        items: [],
      },
    );
    if (!paymentKey.token) {
      throw new ServiceUnavailableException(
        'Paymob did not return a payment token',
      );
    }

    const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${encodeURIComponent(iframeId)}?payment_token=${encodeURIComponent(paymentKey.token)}`;
    const paymentValues = {
      order: order._id,
      user: order.user,
      gatewayOrderId: String(paymobOrder.id),
      amountCents,
      currency: 'EGP' as const,
      status: 'pending' as const,
      paymentToken: paymentKey.token,
      checkoutUrl,
    };

    if (previousPayment) {
      await this.paymentModel.updateOne(
        { _id: previousPayment._id, status: 'failed' },
        { $set: paymentValues, $unset: { transactionId: 1 } },
      );
    } else {
      try {
        await this.paymentModel.create(paymentValues);
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) throw error;
        const existing = await this.paymentModel
          .findOne({ order: order._id })
          .exec();
        if (existing?.status === 'pending' && existing.checkoutUrl) {
          return {
            orderId: order._id.toString(),
            currency: 'EGP',
            amountCents: existing.amountCents,
            checkoutUrl: existing.checkoutUrl,
          };
        }
        throw new ConflictException('A payment session is already being created');
      }
    }

    if (order.paymentStatus === PaymentStatus.FAILED) {
      order.paymentStatus = PaymentStatus.PENDING;
      await order.save();
    }
    return {
      orderId: order._id.toString(),
      currency: 'EGP',
      amountCents,
      checkoutUrl,
    };
  }

  async handleCallback(payload: unknown, providedHmac: string) {
    const transaction = this.asRecord(payload);
    const signedTransaction = this.asRecord(transaction.obj ?? transaction);
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET;
    if (!hmacSecret) {
      throw new ServiceUnavailableException('Paymob HMAC secret is not configured');
    }
    if (!providedHmac || !this.verifyHmac(signedTransaction, providedHmac, hmacSecret)) {
      throw new UnauthorizedException('Invalid Paymob callback signature');
    }

    const gatewayOrderId = this.nestedValue(signedTransaction, 'order.id');
    const transactionId = this.value(signedTransaction.id);
    const amountCents = Number(signedTransaction.amount_cents);
    const currency = this.value(signedTransaction.currency);
    if (!gatewayOrderId || !transactionId || !Number.isSafeInteger(amountCents)) {
      throw new BadRequestException('Incomplete Paymob transaction');
    }
    const payment = await this.paymentModel
      .findOne({ gatewayOrderId })
      .exec();
    if (!payment) throw new NotFoundException('Payment session not found');
    if (payment.amountCents !== amountCents || currency !== payment.currency) {
      throw new BadRequestException('Paymob amount or currency does not match');
    }

    const isSuccessful =
      this.toBoolean(signedTransaction.success) &&
      !this.toBoolean(signedTransaction.pending) &&
      !this.toBoolean(signedTransaction.error_occured);
    const isStillPending =
      this.toBoolean(signedTransaction.pending) &&
      !this.toBoolean(signedTransaction.error_occured);

    const order = await this.orderModel.findById(payment.order).exec();
    if (!order) throw new NotFoundException('Order not found');
    if (
      order.paymentMethod !== PaymentMethod.CARD ||
      Math.round(order.total * 100) !== payment.amountCents
    ) {
      throw new BadRequestException(
        'Payment no longer matches the order amount and method',
      );
    }
    if (isSuccessful) {
      const wasAlreadyPaid = order.paymentStatus === PaymentStatus.PAID;
      let transitionedToPaid = false;
      if (order.paymentStatus === PaymentStatus.PAID) {
        if (order.paymentTransactionId !== transactionId) {
          throw new ConflictException('Order was paid by a different transaction');
        }
      } else {
        const paidOrder = await this.orderModel.findOneAndUpdate(
          {
            _id: order._id,
            paymentStatus: PaymentStatus.PENDING,
            total: order.total,
          },
          {
            $set: {
              paymentStatus: PaymentStatus.PAID,
              status: OrderStatus.CONFIRMED,
              paymentTransactionId: transactionId,
              paidAt: new Date(),
            },
          },
          { new: true },
        );
        if (!paidOrder) {
          const latestOrder = await this.orderModel.findById(order._id).exec();
          if (
            latestOrder?.paymentStatus !== PaymentStatus.PAID ||
            latestOrder.paymentTransactionId !== transactionId
          ) {
            throw new ConflictException(
              'Order payment status changed concurrently',
            );
          }
        } else {
          transitionedToPaid = true;
        }
      }
      await this.paymentModel.updateOne(
        { _id: payment._id, status: { $ne: 'paid' } },
        { $set: { status: 'paid', transactionId } },
      );
      if (transitionedToPaid && !wasAlreadyPaid) {
        await this.notificationService.create(order.user, {
          type: 'payment',
          title: 'Payment received',
          message: `Payment for order ${order._id.toString()} was successful.`,
          data: {
            orderId: order._id.toString(),
            paymentStatus: PaymentStatus.PAID,
          },
        });
      }
      return { received: true, status: 'paid', orderId: order._id.toString() };
    }

    if (isStillPending) {
      return {
        received: true,
        status: 'pending',
        orderId: order._id.toString(),
      };
    }
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ConflictException('A paid order cannot be changed to failed');
    }
    const failedOrder = await this.orderModel.findOneAndUpdate(
      { _id: order._id, paymentStatus: PaymentStatus.PENDING },
      { $set: { paymentStatus: PaymentStatus.FAILED } },
      { new: true },
    );
    let transitionedToFailed = Boolean(failedOrder);
    if (!failedOrder && order.paymentStatus === PaymentStatus.PENDING) {
      const latestOrder = await this.orderModel.findById(order._id).exec();
      if (latestOrder?.paymentStatus === PaymentStatus.PAID) {
        throw new ConflictException('A paid order cannot be changed to failed');
      }
      if (latestOrder?.paymentStatus !== PaymentStatus.FAILED) {
        throw new ConflictException('Order payment status changed concurrently');
      }
      transitionedToFailed = false;
    }
    await this.paymentModel.updateOne(
      { _id: payment._id, status: { $ne: 'paid' } },
      { $set: { status: 'failed', transactionId } },
    );
    if (order.couponUsageRecorded && transitionedToFailed) {
      await this.couponService.release(order._id.toString());
      await this.orderModel.updateOne(
        { _id: order._id },
        { $set: { couponUsageRecorded: false } },
      );
    }
    if (transitionedToFailed) {
      await this.notificationService.create(order.user, {
        type: 'payment',
        title: 'Payment failed',
        message: `Payment for order ${order._id.toString()} failed.`,
        data: {
          orderId: order._id.toString(),
          paymentStatus: PaymentStatus.FAILED,
        },
      });
    }
    return { received: true, status: 'failed', orderId: order._id.toString() };
  }

  private async paymobPost<T>(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Paymob request failed with HTTP ${response.status}`,
      );
    }
    return (await response.json()) as T;
  }

  private verifyHmac(
    transaction: Record<string, unknown>,
    provided: string,
    secret: string,
  ) {
    const canonical = HMAC_FIELDS.map((field) =>
      this.nestedValue(transaction, field),
    ).join('');
    const expected = createHmac('sha512', secret).update(canonical).digest();
    let received: Buffer;
    try {
      received = Buffer.from(provided, 'hex');
    } catch {
      return false;
    }
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  private nestedValue(record: Record<string, unknown>, path: string): string {
    const value = path.split('.').reduce<unknown>((current, key) => {
      if (typeof current !== 'object' || current === null) return undefined;
      return (current as Record<string, unknown>)[key];
    }, record);
    return this.value(value);
  }

  private value(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean' || typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'string') return value;
    return '';
  }

  private toBoolean(value: unknown) {
    return value === true || value === 'true';
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new BadRequestException('Invalid Paymob callback payload');
    }
    return value as Record<string, unknown>;
  }

  private isDuplicateKeyError(error: unknown): error is { code: number } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
