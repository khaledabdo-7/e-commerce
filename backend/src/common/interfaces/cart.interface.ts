import { Types } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartResponse extends ICart {
  _id: Types.ObjectId;
  id: string;
}

export type IAddToCart = ICartItem;
export type IUpdateCartItem = ICartItem;
export type IRemoveFromCart = Pick<ICartItem, 'product'>;
