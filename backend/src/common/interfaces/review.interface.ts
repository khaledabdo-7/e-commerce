import { Types } from 'mongoose';

export interface IReview {
  User_id: Types.ObjectId;
  Product_id: Types.ObjectId;
  Category_id: Types.ObjectId;
  Brand_id: Types.ObjectId;
  rate: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReviewResponse extends IReview {
  _id: Types.ObjectId;
}

export type ICreateReview = Pick<IReview, 'Product_id' | 'rate'>;
export type IUpdateReview = Partial<Pick<IReview, 'rate'>>;
