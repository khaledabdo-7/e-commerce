import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ICoupon,
  ICouponMethods,
} from '../../common/interfaces/coupon.interface.js';
import { OrderModel } from '../../database/Model/order.model.js';
import { CouponRedemptionModel } from '../../database/Model/coupon-redemption.model.js';
import { CreateCouponDto, UpdateCouponDto } from './dto/create-coupon.dto.js';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel('Coupon')
    private readonly couponModel: Model<ICoupon, {}, ICouponMethods>,
    @InjectModel(OrderModel.name)
    private readonly orderModel: Model<OrderModel>,
    @InjectModel(CouponRedemptionModel.name)
    private readonly redemptionModel: Model<CouponRedemptionModel>,
  ) {}

  async create(createCouponDto: CreateCouponDto, createdBy: string) {
    const couponValues = {
      code: createCouponDto.code.trim().toUpperCase(),
      discountType: createCouponDto.discountType,
      discountValue: createCouponDto.discountValue,
      maxDiscountAmount: createCouponDto.maxDiscountAmount,
      minOrderAmount: createCouponDto.minOrderAmount,
      startDate: createCouponDto.startDate,
      expiresAt: createCouponDto.expiresAt,
      usageLimit: createCouponDto.usageLimit,
      usageLimitPerUser: createCouponDto.usageLimitPerUser,
    };
    this.validateCoupon(couponValues);
    if (!Types.ObjectId.isValid(createdBy)) {
      throw new BadRequestException('Invalid authenticated user id');
    }

    try {
      return await this.couponModel.create({
        ...couponValues,
        createdBy: new Types.ObjectId(createdBy),
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('A coupon with this code already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon id');
    }
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const current = await this.findOne(id);
    const updateValues = {
      ...(updateCouponDto.code !== undefined
        ? { code: updateCouponDto.code.trim().toUpperCase() }
        : {}),
      ...(updateCouponDto.discountType !== undefined
        ? { discountType: updateCouponDto.discountType }
        : {}),
      ...(updateCouponDto.discountValue !== undefined
        ? { discountValue: updateCouponDto.discountValue }
        : {}),
      ...(updateCouponDto.maxDiscountAmount !== undefined
        ? { maxDiscountAmount: updateCouponDto.maxDiscountAmount }
        : {}),
      ...(updateCouponDto.minOrderAmount !== undefined
        ? { minOrderAmount: updateCouponDto.minOrderAmount }
        : {}),
      ...(updateCouponDto.startDate !== undefined
        ? { startDate: updateCouponDto.startDate }
        : {}),
      ...(updateCouponDto.expiresAt !== undefined
        ? { expiresAt: updateCouponDto.expiresAt }
        : {}),
      ...(updateCouponDto.usageLimit !== undefined
        ? { usageLimit: updateCouponDto.usageLimit }
        : {}),
      ...(updateCouponDto.usageLimitPerUser !== undefined
        ? { usageLimitPerUser: updateCouponDto.usageLimitPerUser }
        : {}),
      ...(updateCouponDto.isActive !== undefined
        ? { isActive: updateCouponDto.isActive }
        : {}),
    };
    this.validateCoupon({
      ...current.toObject(),
      ...updateValues,
      code: updateValues.code ?? current.code,
    });

    try {
      const coupon = await this.couponModel
        .findByIdAndUpdate(
          id,
          updateValues,
          { new: true, runValidators: true },
        )
        .exec();
      if (!coupon) throw new NotFoundException('Coupon not found');
      return coupon;
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('A coupon with this code already exists');
      }
      throw error;
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid coupon id');
    }
    const coupon = await this.couponModel.findByIdAndDelete(id).exec();
    if (!coupon) throw new NotFoundException('Coupon not found');
    return { deleted: true, id: coupon._id.toString() };
  }

  async preview(code: string, orderId: string, userId: string) {
    if (!Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException('Invalid order id');
    }
    const order = await this.orderModel
      .findOne({ _id: orderId, user: userId })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    const coupon = await this.getEligibleCoupon(code, userId, order.total);
    const discount = coupon.calcDiscount(order.total);
    return {
      code: coupon.code,
      discount,
      total: Math.max(0, order.total - discount),
      currency: 'EGP',
    };
  }

  async redeem(
    code: string,
    userId: string,
    orderId: string,
    total: number,
  ) {
    if (![userId, orderId].every((value) => Types.ObjectId.isValid(value))) {
      throw new BadRequestException('Invalid user or order id');
    }
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await this.couponModel
      .findOne({ code: normalizedCode })
      .exec();
    if (!coupon) throw new BadRequestException('Invalid coupon code');

    this.validateEligibility(coupon, userId, total);
    const userObjectId = new Types.ObjectId(userId);
    const orderObjectId = new Types.ObjectId(orderId);
    const now = new Date();

    const redeemed = await this.couponModel.findOneAndUpdate(
      {
        _id: coupon._id,
        code: normalizedCode,
        isActive: true,
        startDate: { $lte: now },
        expiresAt: { $gte: now },
        minOrderAmount: { $lte: total },
        $expr: {
          $and: [
            {
              $or: [
                { $eq: [{ $ifNull: ['$usageLimit', null] }, null] },
                {
                  $lt: [
                    { $ifNull: ['$usedCount', 0] },
                    '$usageLimit',
                  ],
                },
              ],
            },
            {
              $lt: [
                {
                  $let: {
                    vars: {
                      usage: {
                        $filter: {
                          input: { $ifNull: ['$usageByUser', []] },
                          as: 'usage',
                          cond: { $eq: ['$$usage.user', userObjectId] },
                        },
                      },
                    },
                    in: {
                      $ifNull: [
                        { $first: '$$usage.count' },
                        {
                          $size: {
                            $filter: {
                              input: { $ifNull: ['$usedBy', []] },
                              as: 'legacyUser',
                              cond: { $eq: ['$$legacyUser', userObjectId] },
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                '$usageLimitPerUser',
              ],
            },
          ],
        },
      },
      [
        {
          $set: {
            usedCount: { $add: [{ $ifNull: ['$usedCount', 0] }, 1] },
            usedBy: {
              $cond: [
                { $in: [userObjectId, { $ifNull: ['$usedBy', []] }] },
                { $ifNull: ['$usedBy', []] },
                {
                  $concatArrays: [
                    { $ifNull: ['$usedBy', []] },
                    [userObjectId],
                  ],
                },
              ],
            },
            usageByUser: {
              $let: {
                vars: {
                  usage: {
                    $filter: {
                      input: { $ifNull: ['$usageByUser', []] },
                      as: 'usage',
                      cond: { $eq: ['$$usage.user', userObjectId] },
                    },
                  },
                  legacyCount: {
                    $size: {
                      $filter: {
                        input: { $ifNull: ['$usedBy', []] },
                        as: 'legacyUser',
                        cond: { $eq: ['$$legacyUser', userObjectId] },
                      },
                    },
                  },
                },
                in: {
                  $cond: [
                    { $gt: [{ $size: '$$usage' }, 0] },
                    {
                      $map: {
                        input: { $ifNull: ['$usageByUser', []] },
                        as: 'usage',
                        in: {
                          $cond: [
                            { $eq: ['$$usage.user', userObjectId] },
                            {
                              $mergeObjects: [
                                '$$usage',
                                { count: { $add: ['$$usage.count', 1] } },
                              ],
                            },
                            '$$usage',
                          ],
                        },
                      },
                    },
                    {
                      $concatArrays: [
                        { $ifNull: ['$usageByUser', []] },
                        [
                          {
                            user: userObjectId,
                            count: { $add: ['$$legacyCount', 1] },
                          },
                        ],
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      ],
      { new: true, runValidators: true },
    ).exec();

    if (!redeemed) {
      throw new BadRequestException('Coupon is no longer available');
    }

    try {
      await this.redemptionModel.create({
        coupon: redeemed._id,
        user: userObjectId,
        order: orderObjectId,
        discountAmount: coupon.calcDiscount(total),
        redeemedAt: now,
      });
    } catch (error) {
      await this.rollbackUsage(redeemed._id, userObjectId);
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('Coupon has already been used for this order');
      }
      throw error;
    }

    return {
      coupon,
      discount: coupon.calcDiscount(total),
    };
  }

  async release(orderId: string) {
    if (!Types.ObjectId.isValid(orderId)) return;
    const orderObjectId = new Types.ObjectId(orderId);
    const redemption = await this.redemptionModel
      .findOneAndDelete({ order: orderObjectId })
      .exec();
    if (!redemption) return;
    await this.rollbackUsage(redemption.coupon, redemption.user);
  }

  private async getEligibleCoupon(code: string, userId: string, total: number) {
    const coupon = await this.couponModel
      .findOne({ code: code.trim().toUpperCase() })
      .exec();
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    this.validateEligibility(coupon, userId, total);
    return coupon;
  }

  private validateEligibility(coupon: ICoupon, userId: string, total: number) {
    const now = new Date();
    if (!coupon.isActive || now < coupon.startDate || now > coupon.expiresAt) {
      throw new BadRequestException('Coupon is not active');
    }
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }
    if (!Number.isFinite(total) || total < coupon.minOrderAmount) {
      throw new BadRequestException('Order does not meet the coupon minimum');
    }
    const usage = coupon.usageByUser?.find((entry) =>
      entry.user.equals(userId),
    );
    const userUsage =
      usage?.count ??
      coupon.usedBy.filter((usedUser) => usedUser.equals(userId)).length;
    if (userUsage >= coupon.usageLimitPerUser) {
      throw new BadRequestException('Coupon usage limit per user has been reached');
    }
  }

  private async rollbackUsage(couponId: Types.ObjectId, userId: Types.ObjectId) {
    await this.couponModel.updateOne(
      {
        _id: couponId,
        usedCount: { $gt: 0 },
        'usageByUser.user': userId,
      },
      {
        $inc: { usedCount: -1, 'usageByUser.$[usage].count': -1 },
      },
      { arrayFilters: [{ 'usage.user': userId, 'usage.count': { $gt: 0 } }] },
    );
    const coupon = await this.couponModel
      .findOne({ _id: couponId, 'usageByUser.user': userId })
      .select({ usageByUser: 1 })
      .exec();
    const usage = coupon?.usageByUser?.find((entry) => entry.user.equals(userId));
    if (usage?.count === 0) {
      await this.couponModel.updateOne(
        { _id: couponId },
        { $pull: { usageByUser: { user: userId }, usedBy: userId } },
      );
    }
  }

  private validateCoupon(coupon: Partial<ICoupon>) {
    if (
      !coupon.code ||
      !coupon.discountType ||
      coupon.discountValue === undefined ||
      coupon.minOrderAmount === undefined ||
      !coupon.startDate ||
      !coupon.expiresAt ||
      coupon.usageLimitPerUser === undefined
    ) {
      throw new BadRequestException('Coupon fields are incomplete');
    }
    if (
      !Number.isFinite(coupon.discountValue) ||
      coupon.discountValue <= 0 ||
      (coupon.discountType === 'percentage' && coupon.discountValue > 100)
    ) {
      throw new BadRequestException('Invalid coupon discount value');
    }
    if (
      coupon.discountType === 'fixed' &&
      coupon.maxDiscountAmount !== undefined
    ) {
      throw new BadRequestException(
        'Maximum discount amount is only valid for percentage coupons',
      );
    }
    if (
      coupon.maxDiscountAmount !== undefined &&
      (!Number.isFinite(coupon.maxDiscountAmount) ||
        coupon.maxDiscountAmount <= 0)
    ) {
      throw new BadRequestException('Maximum discount amount must be positive');
    }
    if (
      !Number.isFinite(coupon.minOrderAmount) ||
      coupon.minOrderAmount < 0 ||
      !Number.isInteger(coupon.usageLimitPerUser) ||
      coupon.usageLimitPerUser < 1 ||
      (coupon.usageLimit !== null &&
        coupon.usageLimit !== undefined &&
        (!Number.isInteger(coupon.usageLimit) || coupon.usageLimit < 1))
    ) {
      throw new BadRequestException('Invalid coupon amount or usage limit');
    }
    if (
      Number.isNaN(new Date(coupon.startDate).getTime()) ||
      Number.isNaN(new Date(coupon.expiresAt).getTime()) ||
      new Date(coupon.startDate) >= new Date(coupon.expiresAt)
    ) {
      throw new BadRequestException('Coupon start date must precede expiration');
    }
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
