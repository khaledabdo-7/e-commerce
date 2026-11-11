import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IAddress } from '../../common/interfaces/address.interface.js';

@Schema({ timestamps: true })
export class AddressModel implements IAddress {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 50 })
  label: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  recipientName: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 30 })
  phone: string;

  @Prop({ type: String, required: true, trim: true, default: 'Egypt' })
  country: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  governorate: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 100 })
  city: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 200 })
  street: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 30 })
  building: string;

  @Prop({ type: String, trim: true, maxlength: 30 })
  apartment?: string;

  @Prop({ type: String, trim: true, maxlength: 20 })
  postalCode?: string;

  @Prop({ type: Boolean, default: false, required: true })
  isDefault: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type AddressDocument = HydratedDocument<AddressModel>;
export const AddressSchema = SchemaFactory.createForClass(AddressModel);
AddressSchema.index(
  { user: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);
