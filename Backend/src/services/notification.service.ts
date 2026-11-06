import {
  NotificationChannel,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type?: NotificationType;
  channel?: NotificationChannel;
  data?: Prisma.InputJsonValue;
}

export const createNotification = async (input: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      body: input.body,
      type: input.type || NotificationType.SYSTEM,
      channel: input.channel || NotificationChannel.IN_APP,
      data: input.data,
    },
  });
};
