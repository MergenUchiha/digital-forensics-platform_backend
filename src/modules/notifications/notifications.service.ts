// src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

@Injectable()
export class NotificationsService {
  // В реальном приложении это были бы записи в БД
  // Для демонстрации используем in-memory хранилище
  private notifications: Map<string, Notification[]> = new Map();

  async createNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      relatedEntityType?: string;
      relatedEntityId?: string;
    },
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      createdAt: new Date(),
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,
    };

    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.unshift(notification);
    
    // Храним только последние 50 уведомлений
    if (userNotifications.length > 50) {
      userNotifications.pop();
    }
    
    this.notifications.set(userId, userNotifications);

    console.log(`📬 Created notification for user ${userId}:`, notification.title);

    return notification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.get(userId) || [];
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    userNotifications.forEach(n => (n.read = true));
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const userNotifications = this.notifications.get(userId) || [];
    const filtered = userNotifications.filter(n => n.id !== notificationId);
    this.notifications.set(userId, filtered);
  }

  // Вспомогательные методы для создания специфичных уведомлений
  async notifyCaseCreated(userId: string, caseTitle: string, caseId: string) {
    return this.createNotification(userId, {
      title: 'New Case Created',
      message: `Case "${caseTitle}" has been created`,
      type: 'success',
      relatedEntityType: 'case',
      relatedEntityId: caseId,
    });
  }

  async notifyEvidenceUploaded(userId: string, evidenceName: string, caseId: string) {
    return this.createNotification(userId, {
      title: 'Evidence Uploaded',
      message: `New evidence "${evidenceName}" has been uploaded`,
      type: 'info',
      relatedEntityType: 'evidence',
      relatedEntityId: caseId,
    });
  }

  async notifyCriticalEvent(userId: string, eventTitle: string, caseId: string) {
    return this.createNotification(userId, {
      title: 'Critical Alert',
      message: eventTitle,
      type: 'error',
      relatedEntityType: 'event',
      relatedEntityId: caseId,
    });
  }
}