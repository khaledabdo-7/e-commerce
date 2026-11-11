import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IBrand } from '../../common/interfaces/brand.interface.js'
@Schema({
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false },
  toObject: { virtuals: true, versionKey: false },
})
export class Brand implements IBrand {
  @Prop({
    type: String,
    required: [true, 'Brand name is required'],
    minlength: [3, 'Brand name must be at least 3 characters'],
    maxlength: [50, 'Brand name must be at most 50 characters'],
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
    required: [true, 'Brand image is required'],
    trim: true,
  })
  image: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Category' }],
    required: [true, 'Brand category is required'],
    validate: {
      validator: (value: Types.ObjectId[]) => value.length > 0,
      message: 'Brand must have at least one category',
    },
  })
  category: Types.ObjectId[];

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

export type BrandDocument = HydratedDocument<Brand>;
export const BrandModel = SchemaFactory.createForClass(Brand);

BrandModel.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $type: 'null' } } },
);
