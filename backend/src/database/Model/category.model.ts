import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICategory } from '../../common/interfaces/category.interface.js';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Category implements ICategory {
  @Prop({
    type: String,
    required: [true, 'Category name is required'],
    minlength: [3, 'Category name must be at least 3 characters'],
    maxlength: [50, 'Category name must be at most 50 characters'],
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: [true, 'Category image is required'],
    trim: true,
  })
  image: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  })
  createdBy: Types.ObjectId;

  @Prop({ type: Date })
  deletedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategoryModel = SchemaFactory.createForClass(Category);

CategoryModel.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } },
);
