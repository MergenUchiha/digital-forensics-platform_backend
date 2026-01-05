// src/modules/notifications/notifications.controller.ts
import { Controller, Get, Put, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req) {
    console.log('Getting notifications for user:', req.user.id);
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Put(':id/read')
  async markAsRead(@Req() req, @Param('id') id: string) {
    await this.notificationsService.markAsRead(req.user.id, id);
    return { message: 'Notification marked as read' };
  }

  @Put('read-all')
  async markAllAsRead(@Req() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Req() req, @Param('id') id: string) {
    await this.notificationsService.deleteNotification(req.user.id, id);
    return { message: 'Notification deleted' };
  }
}