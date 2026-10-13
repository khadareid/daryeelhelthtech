"use strict";
// import { PrismaClient, SubscriptionStatus } from "@prisma/client";
// import { createAuditLog } from "./audit.service";
// const prisma = new PrismaClient();
// export const runAutoRenewalsForAllTenants = async () => {
//   const now = new Date();
//   const renewalWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
//   const tenants = await prisma.tenant.findMany({
//     where: { isActive: true, isDeleted: false },
//     select: { Tenantid: true },
//   });
//   let renewed = 0;
//   let expired = 0;
//   for (const tenant of tenants) {
//     const tenantId = tenant.Tenantid;
//     const dueForRenewal = await prisma.memberSubscription.findMany({
//       where: {
//         tenantId,
//         isDeleted: false,
//         autoRenew: true,
//         status: SubscriptionStatus.ACTIVE,
//         endDate: { lte: renewalWindow },
//       },
//       include: { membershipPlan: true },
//     });
//     for (const sub of dueForRenewal) {
//       try {
//         const renewalPrice = sub.membershipPlan.price;
//         const newEndDate = new Date(
//           sub.endDate.getTime() + sub.membershipPlan.durationDays * 24 * 60 * 60 * 1000
//         );
//         await prisma.memberSubscription.update({
//           where: { memberSubscriptionid: sub.memberSubscriptionid },
//           data: {
//             endDate: newEndDate,
//             price: renewalPrice,
//             status: SubscriptionStatus.ACTIVE,
//             isActive: true,
//           },
//         });
//         await prisma.invoice.create({
//           data: {
//             invoiceNumber: `INV-CRON-${Date.now()}-${sub.memberId}`,
//             memberId: sub.memberId,
//             subscriptionId: sub.memberSubscriptionid,
//             issueDate: now,
//             dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
//             totalAmount: renewalPrice,
//             paidAmount: 0,
//             balance: renewalPrice,
//             status: "UNPAID",
//             isDeleted: false,
//             tenantId,
//           },
//         });
//         await createAuditLog({
//           action: "AUTO_RENEW",
//           entityType: "MemberSubscription",
//           entityId: sub.memberSubscriptionid,
//           tenantId,
//           newValue: { endDate: newEndDate, price: renewalPrice },
//         });
//         renewed++;
//       } catch (error) {
//         console.error(`Auto-renew failed for subscription ${sub.memberSubscriptionid}:`, error);
//       }
//     }
//     const expiredResult = await prisma.memberSubscription.updateMany({
//       where: {
//         tenantId,
//         isDeleted: false,
//         status: SubscriptionStatus.ACTIVE,
//         endDate: { lt: now },
//         autoRenew: false,
//       },
//       data: {
//         status: SubscriptionStatus.EXPIRED,
//         isActive: false,
//       },
//     });
//     expired += expiredResult.count;
//   }
//   if (renewed > 0 || expired > 0) {
//     console.log(`[Cron] Auto-renewals: ${renewed} renewed, ${expired} marked expired`);
//   }
// };
// export const startCronJobs = () => {
//   const SIX_HOURS = 6 * 60 * 60 * 1000;
//   setInterval(() => {
//     runAutoRenewalsForAllTenants().catch((err) =>
//       console.error("[Cron] Auto-renewal job failed:", err)
//     );
//   }, SIX_HOURS);
//   runAutoRenewalsForAllTenants().catch((err) =>
//     console.error("[Cron] Initial auto-renewal run failed:", err)
//   );
//   console.log("Cron jobs started (auto-renewal every 6 hours)");
// };
