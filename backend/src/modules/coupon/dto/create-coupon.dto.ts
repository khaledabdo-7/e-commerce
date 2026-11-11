import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  IApplyCoupon,
  ICreateCoupon,
  IUpdateCoupon,
} from '../../../common/interfaces/coupon.interface.js';

export class CreateCouponDto implements ICreateCoupon {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @Matches(/^[A-Z0-9_-]+$/)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;

  @IsIn(['percentage', 'fixed'])
  discountType: 'percentage' | 'fixed';

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount: number;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  expiresAt: Date;

  @Transform(({ value }) => (value === null ? null : Number(value)))
  @ValidateIf((_object, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(1)
  usageLimit: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimitPerUser: number;
}

export class UpdateCouponDto
  extends PartialType(CreateCouponDto)
  implements IUpdateCoupon
{
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ApplyCouponDto implements IApplyCoupon {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  code: string;
}
