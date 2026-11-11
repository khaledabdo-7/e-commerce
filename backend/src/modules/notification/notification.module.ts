import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { TokenModule } from '../../common/services/token.module.js';
import { NotificationSchema } from '../../database/Model/notification.model.js';
import { UserModel } from '../../database/Model/user.model.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([
      { name: 'NotificationModel', schema: NotificationSchema },
      { name: 'User', schema: UserModel },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, AuthGuard, OrderUserGuard],
  exports: [NotificationService],
})
export class NotificationModule {}
