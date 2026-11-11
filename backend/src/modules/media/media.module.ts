import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderGuard } from '../../common/guards/order-admin.guard.js';
import { TokenModule } from '../../common/services/token.module.js';
import { UserModel } from '../../database/Model/user.model.js';
import { MediaController } from './media.controller.js';
import { MediaService } from './media.service.js';

@Module({
  imports: [
    TokenModule,
    MongooseModule.forFeature([{ name: 'User', schema: UserModel }]),
  ],
  controllers: [MediaController],
  providers: [MediaService, AuthGuard, OrderGuard],
})
export class MediaModule {}
