// src/common/interfaces/coupon.interface.ts
import { Types } from 'mongoose';

export interface ICoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount: number;
  startDate: Date;
  expiresAt: Date;
  usageLimit: number | null;
  usedCount: number;
  usageLimitPerUser: number;
  usedBy: Types.ObjectId[];
  usageByUser: { user: Types.ObjectId; count: number }[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICouponMethods {
  isValid(): boolean;
  calcDiscount(total: number): number;
}

export interface ICouponResponse extends ICoupon {
  _id: Types.ObjectId;
  id: string;
}

export type ICreateCoupon = Pick<
  ICoupon,
  | 'code'
  | 'discountType'
  | 'discountValue'
  | 'maxDiscountAmount'
  | 'minOrderAmount'
  | 'startDate'
  | 'expiresAt'
  | 'usageLimit'
  | 'usageLimitPerUser'
>;
export type IUpdateCoupon = Partial<ICreateCoupon> & { isActive?: boolean };
export type IApplyCoupon = Pick<ICoupon, 'code'>;
