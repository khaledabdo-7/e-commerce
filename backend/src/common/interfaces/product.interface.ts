// src/common/interfaces/product.interface.ts
import { Types } from 'mongoose';

export interface IProduct {
  name: string;
  description?: string;
  images: string[];
  price: number;
  discount: number;
  stock: number;
  category: Types.ObjectId;
  brand: Types.ObjectId;
  createdBy: Types.ObjectId;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductResponse extends IProduct {
  _id: Types.ObjectId;
  id: string;
  finalPrice: number;
}

export type ICreateProduct = Pick<
  IProduct,
  | 'name'
  | 'description'
  | 'images'
  | 'price'
  | 'discount'
  | 'stock'
  | 'category'
  | 'brand'
>;
export type IUpdateProduct = Partial<ICreateProduct>;
