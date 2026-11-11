import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type {
  IPayment,
  PaymentRecordStatus,
} from '../../common/interfaces/payment.interface.js';

@Schema({ timestamps: true })
export class PaymentModel implements IPayment {
  @Prop({ type: Types.ObjectId, ref: 'OrderModel', required: true })
  order: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  gatewayOrderId: string;

  @Prop({ type: String, unique: true, sparse: true })
  transactionId?: string;

  @Prop({ type: Number, required: true, min: 1 })
  amountCents: number;

  @Prop({ type: String, required: true, enum: ['EGP'] })
  currency: 'EGP';

  @Prop({
    type: String,
    required: true,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
  })
  status: PaymentRecordStatus;

  @Prop({ type: String, required: true, select: false })
  paymentToken: string;

  @Prop({ type: String, required: true })
  checkoutUrl: string;

  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<PaymentModel>;
export const PaymentSchema = SchemaFactory.createForClass(PaymentModel);
PaymentSchema.index({ order: 1 }, { unique: true });
