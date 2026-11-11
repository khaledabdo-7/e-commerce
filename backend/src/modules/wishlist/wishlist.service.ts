import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from '../../database/Model/product.model.js';
import { WishlistModel } from '../../database/Model/wishlist.model.js';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(WishlistModel.name)
    private readonly wishlistModel: Model<WishlistModel>,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async addProduct(userId: string, productId: string) {
    const product = await this.productModel
      .findOne({ _id: productId, deletedAt: null })
      .select({ _id: 1 })
      .exec();
    if (!product) throw new NotFoundException('Product not found');

    return this.wishlistModel
      .findOneAndUpdate(
        { user: new Types.ObjectId(userId) },
        { $addToSet: { products: product._id } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .populate('products')
      .exec();
  }

  async list(userId: string) {
    const wishlist = await this.wishlistModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('products')
      .exec();
    return wishlist ?? { user: userId, products: [] };
  }

  async removeProduct(userId: string, productId: string) {
    const wishlist = await this.wishlistModel
      .findOneAndUpdate(
        { user: new Types.ObjectId(userId) },
        { $pull: { products: new Types.ObjectId(productId) } },
        { new: true },
      )
      .populate('products')
      .exec();
    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }
}
