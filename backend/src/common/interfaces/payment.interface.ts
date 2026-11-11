import { Types } from 'mongoose';

export type PaymentRecordStatus = 'pending' | 'paid' | 'failed';

export interface IPayment {
  order: Types.ObjectId;
  user: Types.ObjectId;
  gatewayOrderId: string;
  transactionId?: string;
  amountCents: number;
  currency: 'EGP';
  status: PaymentRecordStatus;
  paymentToken: string;
  checkoutUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
