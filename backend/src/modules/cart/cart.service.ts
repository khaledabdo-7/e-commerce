import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Cart } from '../../database/Model/cart.model.js';
import { Product } from '../../database/Model/product.model.js';
import { AddToCartDto } from './dto/create-cart.dto.js';
import { publicImageUrl } from '../../common/utils/multer/multer.js';

const round = (n: number) => Math.round(n * 100) / 100;

const buildResponse = (cart: any) => {
  const items = (cart?.items ?? [])
    .filter((i: any) => i.product && !i.product.deletedAt)
    .map((i: any) => {
      const p = i.product;
      const unitPrice = round(p.price * (1 - (p.discount ?? 0) / 100));
      return {
        product: {
          _id: p._id,
          name: p.name,
          image: publicImageUrl(p.images?.[0]),
          stock: p.stock,
        },
        quantity: i.quantity,
        unitPrice,
        subtotal: round(unitPrice * i.quantity),
      };
    });

  return {
    message: 'Done',
    cart: {
      items,
      totalItems: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
      total: round(items.reduce((sum: number, i: any) => sum + i.subtotal, 0)),
    },
  };
};

@Injectable()
export class CartService {
  constructor(
    @InjectModel('Cart') private readonly cartModel: Model<Cart>,
    @InjectModel('Product') private readonly productModel: Model<Product>,
  ) {}

  private async loadProduct(productId: string) {
    if (!isValidObjectId(productId)) {
      throw new BadRequestException('Invalid product id');
    }
    const product = await this.productModel.findOne({
      _id: productId,
      deletedAt: null,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private async populated(userId: Types.ObjectId) {
    return this.cartModel
      .findOne({ user: userId })
      .populate('items.product', 'name price discount stock images deletedAt');
  }

  async getCart(userId: Types.ObjectId) {
    const cart = await this.populated(userId);
    return buildResponse(cart);
  }

  async addItem(userId: Types.ObjectId, dto: AddToCartDto) {
    const quantity = dto.quantity ?? 1;
    const product = await this.loadProduct(dto.productId);

    const cart =
      (await this.cartModel.findOne({ user: userId })) ??
      new this.cartModel({ user: userId, items: [] });

    const existing = cart.items.find(
      (i) => i.product.toString() === dto.productId,
    );
    const newQuantity = (existing?.quantity ?? 0) + quantity;

    if (newQuantity > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) available in stock`,
      );
    }

    if (existing) {
      existing.quantity = newQuantity;
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.productId),
        quantity,
      });
    }

    await cart.save();
    return buildResponse(await this.populated(userId));
  }

  async updateItem(
    userId: Types.ObjectId,
    productId: string,
    quantity: number,
  ) {
    const product = await this.loadProduct(productId);

    if (quantity > product.stock) {
      throw new BadRequestException(
        `Only ${product.stock} item(s) available in stock`,
      );
    }

    const cart = await this.cartModel.findOne({ user: userId });
    const item = cart?.items.find((i) => i.product.toString() === productId);
    if (!cart || !item) throw new NotFoundException('Item not found in cart');

    item.quantity = quantity;
    await cart.save();
    return buildResponse(await this.populated(userId));
  }

  async removeItem(userId: Types.ObjectId, productId: string) {
    if (!isValidObjectId(productId)) {
      throw new BadRequestException('Invalid product id');
    }

    const cart = await this.cartModel.findOneAndUpdate(
      { user: userId, 'items.product': productId },
      { $pull: { items: { product: productId } } },
      { new: true },
    );
    if (!cart) throw new NotFoundException('Item not found in cart');

    return buildResponse(await this.populated(userId));
  }

  async clear(userId: Types.ObjectId) {
    await this.cartModel.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
    );
    return { message: 'Done' };
  }
}
