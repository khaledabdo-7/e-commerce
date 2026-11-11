import { Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../enum/order.enum.js';

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder {
  user: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  coupon?: Types.ObjectId;
  couponCode?: string;
  couponUsageRecorded?: boolean;
  paymentTransactionId?: string;
  paidAt?: Date;
  total: number;
  shippingAddress: Types.ObjectId;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  notes?: string;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderResponse extends IOrder {
  _id: Types.ObjectId;
}

export type ICreateOrder = Pick<
  IOrder,
  'shippingAddress' | 'paymentMethod' | 'notes'
> & { couponCode?: string };

export type IUpdateOrderStatus = Pick<IOrder, 'status'>;
export type IUpdatePaymentStatus = Pick<IOrder, 'paymentStatus'>;
