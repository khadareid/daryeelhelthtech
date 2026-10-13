// src/service/Dashboard/Dashboard.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/lib/apiBaseQuery';
 ;

/* ==================================================================
   DASHBOARD DATA SHAPE (healthcare)
================================================================== */

export interface DashboardData {
  /* ---------- SUMMARY ---------- */
  summary: {
    totalUsers: number;
    totalPatients: number;
    totalDoctors: number;
    totalNurses: number;
    totalStaff: number;
    activeUsers: number;

    totalAppointments: number;
    totalPrescriptions: number;
    totalLabOrders: number;

    activeConsents: number;
    pendingConsents: number;

    totalRevenue: number;
    totalTransactions: number;
    netWorth: number;
  };

  /* ---------- OPERATIONAL METRICS ---------- */
  operationalMetrics: {
    appointments: {
      today: number;
      thisWeek: number;
      thisMonth: number;
      dailyAverage: number;
      completionRate: number;
    };
    prescriptions: {
      pending: number;
      dispensed: number;
      cancelled: number;
      dispenseRate: number;
    };
    labOrders: {
      ordered: number;
      processing: number;
      completed: number;
      completionRate: number;
    };
    consents: {
      active: number;
      pending: number;
      revoked: number;
      expired: number;
    };
  };

  /* ---------- FINANCIAL TRENDS ---------- */
  financialTrends: {
    monthlyRevenue: Array<{ month: string; total: number }>;
    monthlyTransactions: Array<{ month: string; total: number }>;
    monthlyRefunds: Array<{ month: string; total: number }>;
    pendingTransactions: {
      count: number;
      estimatedValue: number;
    };
  };

  /* ---------- OPERATIONAL INSIGHTS ---------- */
  operationalInsights: {
    topPatients: Array<{
      userId: string;
      fullName: string;
      email: string;
      phone?: string | null;
      appointmentCount: number;
      totalSpent: number;
    }>;
    topDoctors: Array<{
      userId: string;
      fullName: string;
      email: string;
      specialization?: string | null;
      appointmentCount: number;
      rating: number;
    }>;
    topDiagnoses: Array<{
      description: string;
      icdCode?: string | null;
      count: number;
    }>;
    labOrdersByStatus: Array<{
      status: string;
      count: number;
    }>;
  };

  /* ---------- APPOINTMENTS OVERVIEW ---------- */
  appointmentsOverview: {
    byStatus: Record<string, number>;
    upcoming: Array<{
      appointmentid: string;
      appointmentCode: string;
      scheduledAt: string;
      patientName: string;
      doctorName?: string | null;
      status: string;
    }>;
    recent: Array<{
      appointmentid: string;
      appointmentCode: string;
      scheduledAt: string;
      patientName: string;
      status: string;
      completedAt?: string | null;
    }>;
  };

  /* ---------- HEALTH METRICS ---------- */
  healthMetrics: {
    vitalsRecorded: number;
    averageBMI: number;
    topVitalTypes: Array<{
      type: string;
      count: number;
    }>;
    chronicConditionStats: Array<{
      condition: string;
      count: number;
    }>;
    allergyStats: Array<{
      allergen: string;
      count: number;
    }>;
  };

  /* ---------- RECENT ACTIVITY ---------- */
  recentActivity: {
    recentUsers: Array<{
      userid: string;
      fullName: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    recentAppointments: Array<{
      appointmentid: string;
      appointmentCode: string;
      patientName: string;
      scheduledAt: string;
      status: string;
    }>;
    recentPrescriptions: Array<{
      prescriptionid: string;
      prescriptionCode: string;
      patientName: string;
      medication: string;
      status: string;
      issuedAt: string;
    }>;
    recentLabOrders: Array<{
      laborderid: string;
      orderCode: string;
      patientName: string;
      testName: string;
      status: string;
      orderedAt: string;
    }>;
    recentTransactions: Array<{
      transactionid: string;
      amount: number;
      type: string;
      status: string;
      description?: string | null;
      createdAt: string;
    }>;
  };

  /* ---------- KEY PERFORMANCE INDICATORS ---------- */
  keyPerformanceIndicators: {
    appointmentCompletionRate: number;
    prescriptionDispenseRate: number;
    labOrderCompletionRate: number;
    consentApprovalRate: number;
    averageRevenuePerPatient: number;
    patientRetentionRate: number;
  };

  /* ---------- PATIENT MONTHLY ---------- */
  patientMonthly?: {
    registeredThisMonth: number;
    registeredLastMonth: number;
    registrationGrowthPercent: number;
    activeConsents: number;
    appointmentsThisMonth: number;
    labOrdersThisMonth: number;
    prescriptionsThisMonth: number;
    monthlyGrowth: Array<{ month: string; total: number }>;
    recentRegistrations: Array<{
      userid: string;
      fullName: string;
      phone?: string | null;
      email: string;
      role: string;
      isActive: boolean;
      createdAt: string;
      isNew: boolean;
    }>;
  };

  /* ---------- METADATA ---------- */
  timeFrame?: {
    generatedAt: string;
    period: string;
    dataPoints?: {
      users: number;
      appointments: number;
      transactions: number;
    };
  };
}

export interface DashboardResponse {
  isSuccess: boolean;
  data: DashboardData;
  generatedAt?: string;
  period?: string;
}

/* ==================================================================
   API
================================================================== */

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    /* ---------- DEFAULT DASHBOARD ---------- */

    getDashboard: builder.query<DashboardData, void>({
      query: () => ({
        url: '/dashboard/analytics',
        method: 'GET',
      }),
      transformResponse: (response: DashboardResponse) => response.data,
      providesTags: ['Dashboard'],
    }),

    /* ---------- WITH DATE RANGE ---------- */

    getDashboardWithFilters: builder.query<
      DashboardData,
      {
        startDate?: string;
        endDate?: string;
        period?: 'today' | 'week' | 'month' | 'year' | 'all';
        role?: string;
      }
    >({
      query: (params) => ({
        url: '/dashboard/analytics',
        method: 'GET',
        params,
      }),
      transformResponse: (response: DashboardResponse) => response.data,
      providesTags: ['Dashboard'],
    }),

    /* ---------- QUICK STATS (lightweight) ---------- */

    getQuickStats: builder.query<
      {
        totalUsers: number;
        totalPatients: number;
        totalDoctors: number;
        appointmentsToday: number;
        pendingLabOrders: number;
        unreadMessages: number;
      },
      void
    >({
      query: () => ({
        url: '/dashboard/quick-stats',
        method: 'GET',
      }),
      providesTags: ['Dashboard'],
    }),

    /* ---------- APPOINTMENTS CHART ---------- */

    getAppointmentsChart: builder.query<
      Array<{ date: string; total: number; completed: number; cancelled: number }>,
      { period?: 'week' | 'month' | 'year' } | void
    >({
      query: (params) => ({
        url: '/dashboard/appointments-chart',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Dashboard'],
    }),

    /* ---------- REVENUE CHART ---------- */

    getRevenueChart: builder.query<
      Array<{ month: string; revenue: number; refunds: number; net: number }>,
      { year?: number } | void
    >({
      query: (params) => ({
        url: '/dashboard/revenue-chart',
        method: 'GET',
        params: params ?? undefined,
      }),
      providesTags: ['Dashboard'],
    }),
  }),
});

/* ==================================================================
   HOOKS
================================================================== */

export const {
  useGetDashboardQuery,
  useGetDashboardWithFiltersQuery,
  useGetQuickStatsQuery,
  useGetAppointmentsChartQuery,
  useGetRevenueChartQuery,
} = dashboardApi;
