import { IsMongoId, IsNumber } from "class-validator";

export class CreateReviewDto {
    @IsNumber()
  rate: number;

    @IsMongoId()
    Category_id: string;
  
    @IsMongoId()
    Brand_id: string;

    @IsMongoId()
    Product_id:string;
}
