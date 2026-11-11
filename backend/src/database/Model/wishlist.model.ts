import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IWishlist } from '../../common/interfaces/wishlist.interface.js';

@Schema({ timestamps: true })
export class WishlistModel implements IWishlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
  products: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export type WishlistDocument = HydratedDocument<WishlistModel>;

export const WishlistSchema = SchemaFactory.createForClass(WishlistModel);

WishlistSchema.index({ user: 1 }, { unique: true });
