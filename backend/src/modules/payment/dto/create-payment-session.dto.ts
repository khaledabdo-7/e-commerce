import { IsMongoId } from 'class-validator';

export class CreatePaymentSessionDto {
  @IsMongoId()
  orderId: string;
}
