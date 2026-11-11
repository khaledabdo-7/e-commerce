import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { OrderUserGuard } from '../../common/guards/order-user.guard.js';
import { ListNotificationsDto } from './dto/list-notifications.dto.js';
import { NotificationService } from './notification.service.js';

type AuthenticatedRequest = Request & {
  user: { _id: { toString(): string } };
};

@Controller('notifications')
@UseGuards(AuthGuard, OrderUserGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(
    @Req() request: AuthenticatedRequest,
    @Query() query: ListNotificationsDto,
  ) {
    return this.notificationService.list(
      request.user._id.toString(),
      query,
    );
  }

  @Patch(':id/read')
  markRead(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.notificationService.markRead(
      request.user._id.toString(),
      id,
    );
  }

  @Patch('read-all')
  markAllRead(@Req() request: AuthenticatedRequest) {
    return this.notificationService.markAllRead(
      request.user._id.toString(),
    );
  }
}
