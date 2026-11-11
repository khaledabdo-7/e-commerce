import { Types } from 'mongoose';

export interface IBrand {
  name: string;
  image: string;
  category: Types.ObjectId[];
  createdBy: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBrandResponse extends IBrand {
  _id: Types.ObjectId;
  id: string;
}

export type ICreateBrand = Pick<IBrand, 'name' | 'image' | 'category'>;
export type IUpdateBrand = Partial<ICreateBrand>;
