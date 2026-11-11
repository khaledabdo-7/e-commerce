import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IReview } from '../../common/interfaces/review.interface.js';

@Schema({ timestamps: true })
export class Review implements IReview {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  User_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  Product_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  Category_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true })
  Brand_id: Types.ObjectId;

  @Prop({ type: Number, required: true })
  rate: number;

  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<Review>;
export const ReviewSchema = SchemaFactory.createForClass(Review);
export const ReviewModel = ReviewSchema;
