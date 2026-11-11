import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  label: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  recipientName: string;

  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  governorate: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  street: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  building: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  apartment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
