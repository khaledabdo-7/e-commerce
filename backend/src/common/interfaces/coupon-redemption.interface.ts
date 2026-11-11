import { Types } from 'mongoose';

export interface ICouponRedemption {
  coupon: Types.ObjectId;
  user: Types.ObjectId;
  order: Types.ObjectId;
  discountAmount: number;
  redeemedAt: Date;
}
