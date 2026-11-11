import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enum/order.enum.js';
import { IOrder, IOrderItem } from '../../common/interfaces/order.interface.js';

@Schema({ _id: false })
export class OrderItem implements IOrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  product: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class OrderModel implements IOrder {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (items: OrderItem[]) => items.length > 0,
      message: 'Order must contain at least one product',
    },
  })
  items: OrderItem[];

  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0, min: 0 })
  shippingFee: number;

  @Prop({ type: Number, default: 0, min: 0 })
  discount: number;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  coupon?: Types.ObjectId;

  @Prop({ type: String, uppercase: true, trim: true })
  couponCode?: string;

  @Prop({ type: Boolean, default: false })
  couponUsageRecorded?: boolean;

  @Prop({ type: Number, required: true, min: 0 })
  total: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'AddressModel',
    required: true,
  })
  shippingAddress: Types.ObjectId;

  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop({ type: String, unique: true, sparse: true })
  paymentTransactionId?: string;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Prop({ type: String, trim: true })
  notes?: string;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<OrderModel>;
export const OrderSchema = SchemaFactory.createForClass(OrderModel);
