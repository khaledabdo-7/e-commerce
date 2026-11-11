import { IsMongoId } from 'class-validator';

export class AddWishlistProductDto {
  @IsMongoId()
  productId: string;
}
