import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICouponRedemption } from '../../common/interfaces/coupon-redemption.interface.js';

@Schema({ versionKey: false })
export class CouponRedemptionModel implements ICouponRedemption {
  @Prop({ type: Types.ObjectId, ref: 'Coupon', required: true, index: true })
  coupon: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'OrderModel', required: true })
  order: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  discountAmount: number;

  @Prop({ type: Date, required: true, default: Date.now })
  redeemedAt: Date;
}

export type CouponRedemptionDocument = HydratedDocument<CouponRedemptionModel>;
export const CouponRedemptionSchema =
  SchemaFactory.createForClass(CouponRedemptionModel);
CouponRedemptionSchema.index({ order: 1 }, { unique: true });
CouponRedemptionSchema.index({ coupon: 1, user: 1, redeemedAt: -1 });
