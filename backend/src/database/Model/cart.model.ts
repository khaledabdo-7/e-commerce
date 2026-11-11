import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICart, ICartItem } from '../../common/interfaces/cart.interface.js';

@Schema({ _id: false })
export class CartItem implements ICartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  })
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Cart implements ICart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  createdAt: Date;
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<Cart>;
export const CartModel = SchemaFactory.createForClass(Cart);
