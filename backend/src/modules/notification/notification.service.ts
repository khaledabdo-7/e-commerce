import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { INotification } from '../../common/interfaces/notification.interface.js';
import { NotificationModel } from '../../database/Model/notification.model.js';
import { ListNotificationsDto } from './dto/list-notifications.dto.js';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(NotificationModel.name)
    private readonly notificationModel: Model<NotificationModel>,
  ) {}

  create(
    userId: Types.ObjectId | string,
    notification: Pick<INotification, 'type' | 'title' | 'message' | 'data'>,
  ) {
    return this.notificationModel.create({
      ...notification,
      user: new Types.ObjectId(userId),
    });
  }

  async list(userId: string, query: ListNotificationsDto) {
    const filter: Record<string, unknown> = {
      user: new Types.ObjectId(userId),
    };
    if (query.unread === true) filter.readAt = null;
    if (query.unread === false) filter.readAt = { $ne: null };

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async markRead(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Notification not found');
    }
    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
        { $set: { readAt: new Date() } },
        { new: true },
      )
      .exec();
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async markAllRead(userId: string) {
    const result = await this.notificationModel.updateMany(
      { user: new Types.ObjectId(userId), readAt: null },
      { $set: { readAt: new Date() } },
    );
    return { modifiedCount: result.modifiedCount };
  }
}
