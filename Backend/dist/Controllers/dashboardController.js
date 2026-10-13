"use strict";
// src/Controllers/dashboardController.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdvancedDashboardOverview = exports.prisma = void 0;
const date_fns_1 = require("date-fns");
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient();
const getAdvancedDashboardOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const now = new Date();
        const sixMonthsAgo = (0, date_fns_1.subMonths)((0, date_fns_1.startOfMonth)(now), 5);
        // 1. Users grouped by role (No changes needed)
        const userRoles = yield exports.prisma.user.groupBy({
            by: ['role'],
            _count: true,
            where: { isdeleted: false },
        });
        // 2. Total Students and Recent Registrations (No changes needed)
        const [totalStudents, newStudents] = yield Promise.all([
            exports.prisma.student.count({ where: { isdeleted: false } }),
            exports.prisma.student.count({
                where: {
                    isdeleted: false,
                    createdAt: { gte: (0, date_fns_1.startOfMonth)(now) },
                },
            }),
        ]);
        // 3. Total Donors + Status (No changes needed)
        const [totalDonors, activeDonors, inactiveDonors] = yield Promise.all([
            exports.prisma.donor.count({ where: { isdeleted: false } }),
            exports.prisma.donor.count({ where: { isdeleted: false, isactive: true } }),
            exports.prisma.donor.count({ where: { isdeleted: false, isactive: false } }),
        ]);
        // 4. Donations - status breakdown (This code is now valid with the corrected schema)
        const donationStatus = yield exports.prisma.payment.groupBy({
            by: ['PaymentStatus'],
            _sum: { amount: true },
            where: {
                isdeleted: false,
            }
        });
        // 5. Total Donations Amount (This code is now valid with the corrected schema)
        const totalDonationsAmount = yield exports.prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                isdeleted: false,
            }
        });
        // 6. Payments - method breakdown (No changes needed)
        const paymentMethods = yield exports.prisma.payment.groupBy({
            by: ['method'],
            _sum: { amount: true },
            where: { isdeleted: false },
        });
        const totalPaymentsAmount = yield exports.prisma.payment.aggregate({
            _sum: { amount: true },
            where: { isdeleted: false },
        });
        // 7. Trends (No changes needed, these raw queries are correct)
        const donationsTrend = yield exports.prisma.$queryRaw `
      SELECT
        DATE_TRUNC('month', "paidAt") AS month,
        SUM(amount)::float AS total
      FROM "Payment"
      WHERE "isdeleted" = false AND "donorId" IS NOT NULL AND "paidAt" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;
        const paymentsTrend = yield exports.prisma.$queryRaw `
      SELECT
        DATE_TRUNC('month', "paidAt") AS month,
        SUM(amount)::float AS total
      FROM "Payment"
      WHERE "isdeleted" = false AND "paidAt" >= ${sixMonthsAgo}
      GROUP BY month
      ORDER BY month ASC
    `;
        // 8. Recent Activity (This code is now valid with the corrected schema)
        const [recentPayments, recentDonations] = yield Promise.all([
            exports.prisma.payment.findMany({
                where: { isdeleted: false },
                include: { student: true },
                orderBy: { paidAt: 'desc' },
                take: 5,
            }),
            exports.prisma.payment.findMany({
                where: { isdeleted: false },
                include: { student: true, Donor: true },
                orderBy: { paidAt: 'desc' },
                take: 5,
            })
        ]);
        // Structure Response
        res.status(200).json({
            users: userRoles.map(r => ({ role: r.role, count: r._count })),
            students: {
                total: totalStudents,
                newThisMonth: newStudents,
            },
            donors: {
                total: totalDonors,
                active: activeDonors,
                inactive: inactiveDonors,
            },
            donations: {
                // FIX: Use optional chaining (?.) to safely access _sum
                totalAmount: ((_a = totalDonationsAmount._sum) === null || _a === void 0 ? void 0 : _a.amount) || 0,
                byStatus: donationStatus.map(s => {
                    var _a;
                    return ({
                        status: s.PaymentStatus,
                        // FIX: Use optional chaining (?.) to safely access _sum
                        amount: ((_a = s._sum) === null || _a === void 0 ? void 0 : _a.amount) || 0,
                    });
                }),
            },
            payments: {
                // FIX: Use optional chaining (?.) here as well for consistency
                totalAmount: ((_b = totalPaymentsAmount._sum) === null || _b === void 0 ? void 0 : _b.amount) || 0,
                byMethod: paymentMethods.map(m => {
                    var _a;
                    return ({
                        method: m.method,
                        // FIX: Use optional chaining (?.) here as well for consistency
                        amount: ((_a = m._sum) === null || _a === void 0 ? void 0 : _a.amount) || 0,
                    });
                }),
            },
            trends: {
                donations: donationsTrend,
                payments: paymentsTrend,
            },
            recentActivity: {
                payments: recentPayments,
                donations: recentDonations,
            },
        });
    }
    catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAdvancedDashboardOverview = getAdvancedDashboardOverview;
