"use strict";
// import { NotificationType, PrismaClient } from "@prisma/client";
// const prisma = new PrismaClient();
// export interface CreateNotificationInput {
//   userId: number;
//   tenantId?: number;
//   title: string;
//   message: string;
//   type?: NotificationType;
// }
// export const createNotification = async (input: CreateNotificationInput) => {
//   return prisma.notification.create({
//     data: {
//       userId: input.userId,
//       tenantId: input.tenantId,
//       title: input.title,
//       message: input.message,
//       type: input.type || NotificationType.SYSTEM,
//     },
//   });
// };
// export const notifyTenantAdmins = async (
//   tenantId: number,
//   title: string,
//   message: string,
//   type: NotificationType = NotificationType.SYSTEM
// ) => {
//   const admins = await prisma.user.findMany({
//     where: {
//       tenantId,
//       isDeleted: false,
//       isActive: true,
//       role: { in: ["ADMIN", "MANAGER", "SUPER_ADMIN"] },
//     },
//     select: { userid: true },
//   });
//   if (!admins.length) return [];
//   return prisma.notification.createMany({
//     data: admins.map((admin) => ({
//       userId: admin.userid,
//       tenantId,
//       title,
//       message,
//       type,
//     })),
//   });
// };
