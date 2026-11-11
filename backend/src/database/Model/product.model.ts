// src/database/Model/product.model.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IProduct } from '../../common/interfaces/product.interface.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Product implements IProduct {
  @Prop({
    type: String,
    required: [true, 'Product name is required'],
    minlength: [3, 'Product name must be at least 3 characters'],
    maxlength: [100, 'Product name must be at most 100 characters'],
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    maxlength: [2000, 'Description must be at most 2000 characters'],
    trim: true,
  })
  description?: string;

  @Prop({
    type: [String],
    validate: {
      validator: (value: string[]) => value.length > 0,
      message: 'Product must have at least one image',
    },
  })
  images: string[];

  @Prop({
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price must be a positive number'],
  })
  price: number;

  @Prop({
    type: Number,
    default: 0,
    min: [0, 'Discount must be between 0 and 100'],
    max: [100, 'Discount must be between 0 and 100'],
  })
  discount: number;

  @Prop({
    type: Number,
    required: [true, 'Product stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  })
  stock: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  })
  category: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Brand',
    required: [true, 'Brand is required'],
  })
  brand: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  })
  createdBy: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductModel = SchemaFactory.createForClass(Product);

ProductModel.virtual('finalPrice').get(function (this: Product) {
  return Math.round(this.price * (1 - this.discount / 100) * 100) / 100;
});

ProductModel.index(
  { name: 1, brand: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $type: 'null' } } },
);
ProductModel.index({ category: 1 });
ProductModel.index({ brand: 1 });
