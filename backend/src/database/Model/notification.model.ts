import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type {
  INotification,
  NotificationType,
} from '../../common/interfaces/notification.interface.js';

@Schema({ timestamps: true })
export class NotificationModel implements INotification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['order', 'payment', 'system'],
  })
  type: NotificationType;

  @Prop({ type: String, required: true, trim: true, maxlength: 120 })
  title: string;

  @Prop({ type: String, required: true, trim: true, maxlength: 1000 })
  message: string;

  @Prop({ type: Map, of: String, default: undefined })
  data?: Record<string, string>;

  @Prop({ type: Date, default: null })
  readAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<NotificationModel>;
export const NotificationSchema = SchemaFactory.createForClass(NotificationModel);
NotificationSchema.index({ user: 1, createdAt: -1 });
