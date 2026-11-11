import { Types } from 'mongoose';

export interface IAddress {
  user: Types.ObjectId;
  label: string;
  recipientName: string;
  phone: string;
  country: string;
  governorate: string;
  city: string;
  street: string;
  building: string;
  apartment?: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
