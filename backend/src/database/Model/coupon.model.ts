// src/database/Model/coupon.model.ts
import { Schema, HydratedDocument, Model } from 'mongoose';
import {
  ICoupon,
  ICouponMethods,
} from '../../common/interfaces/coupon.interface.js';

type CouponModel = Model<ICoupon, {}, ICouponMethods>;
export type CouponDocument = HydratedDocument<ICoupon, ICouponMethods>;

const usageByUserSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    count: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

export const CouponSchema = new Schema<ICoupon, CouponModel, ICouponMethods>(
  {
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    maxDiscountAmount: { type: Number, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },

    startDate: { type: Date, required: true },
    expiresAt: { type: Date, required: true },

    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0, min: 0 },
    usageLimitPerUser: { type: Number, required: true, min: 1 },
    usedBy: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    usageByUser: { type: [usageByUserSchema], default: [] },

    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

CouponSchema.index({ code: 1 }, { unique: true });

CouponSchema.method('isValid', function isValid() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.expiresAt &&
    (this.usageLimit == null || this.usedCount < this.usageLimit)
  );
});

CouponSchema.method('calcDiscount', function calcDiscount(total: number) {
  let discount =
    this.discountType === 'percentage'
      ? (total * this.discountValue) / 100
      : this.discountValue;
  if (this.maxDiscountAmount !== undefined) {
    discount = Math.min(discount, this.maxDiscountAmount);
  }
  return Math.min(discount, total);
});
