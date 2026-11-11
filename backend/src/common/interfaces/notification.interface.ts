import { Types } from 'mongoose';

export type NotificationType = 'order' | 'payment' | 'system';

export interface INotification {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, string>;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
