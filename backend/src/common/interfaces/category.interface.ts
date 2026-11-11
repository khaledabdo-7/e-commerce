import { Types } from 'mongoose';

export interface ICategory {
  name: string;
  image: string;
  createdBy: Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryResponse extends ICategory {
  _id: Types.ObjectId;
  id: string;
}

export type ICreateCategory = Pick<ICategory, 'name' | 'image'>;
export type IUpdateCategory = Partial<ICreateCategory>;
