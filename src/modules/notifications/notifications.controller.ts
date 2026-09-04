// src/modules/notifications/notifications.controller.ts
import { Controller, Get, Put, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  getNotifications(@CurrentUser() user: RequestUser) {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Put(':id/read')
  markAsRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    this.notificationsService.markAsRead(user.id, id);
    return { message: 'ok' };
  }

  @Put('read-all')
  markAllAsRead(@CurrentUser() user: RequestUser) {
    this.notificationsService.markAllAsRead(user.id);
    return { message: 'ok' };
  }

  @Delete(':id')
  deleteNotification(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    this.notificationsService.deleteNotification(user.id, id);
    return { message: 'ok' };
  }
}
