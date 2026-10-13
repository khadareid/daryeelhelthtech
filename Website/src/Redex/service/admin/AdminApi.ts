import { createApi } from '@reduxjs/toolkit/query/react'
import { apiBaseQuery } from '@/lib/apiBaseQuery'

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: apiBaseQuery,
  tagTypes: [
    'AdminStats',
    'AdminUsers',
    'FeatureFlags',
    'ProfApps',
    'NewsReports',
    'AuditLogs',
    'AdminAppointments',
    'Plans',
    'Subscriptions',
    'Cms',
  ],
  endpoints: (builder) => ({
    getAdminStats: builder.query<any, void>({
      query: () => ({ url: '/admin/stats' }),
      transformResponse: (r: any) => r.result ?? r,
      providesTags: ['AdminStats'],
    }),
    getAdminUsers: builder.query<
      { data: any[]; pagination: any },
      | {
          page?: number
          limit?: number
          search?: string
          role?: string
          status?: string
        }
      | void
    >({
      query: (params) => ({
        url: '/admin/users',
        params: params ?? undefined,
      }),
      providesTags: ['AdminUsers'],
    }),
    getAdminUser: builder.query<any, string>({
      query: (id) => ({ url: `/admin/users/${id}` }),
      transformResponse: (r: any) => r.result ?? r,
      providesTags: (_r, _e, id) => [{ type: 'AdminUsers', id }],
    }),
    updateAdminUser: builder.mutation<any, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['AdminUsers', 'AdminStats'],
    }),
    adminPasswordReset: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/users/${id}/password-reset`,
        method: 'POST',
        body: {},
      }),
    }),
    getFeatureFlags: builder.query<any[], void>({
      query: () => ({ url: '/admin/features' }),
      transformResponse: (r: any) => r.result ?? [],
      providesTags: ['FeatureFlags'],
    }),
    updateFeatureFlag: builder.mutation<any, { key: string; body: Record<string, unknown> }>({
      query: ({ key, body }) => ({
        url: `/admin/features/${key}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FeatureFlags'],
    }),
    getProfessionalApplications: builder.query<any[], string | void>({
      query: (status) => ({
        url: '/admin/professional-applications',
        params: status ? { status } : undefined,
      }),
      transformResponse: (r: any) => r.result ?? [],
      providesTags: ['ProfApps'],
    }),
    reviewProfessionalApplication: builder.mutation<
      any,
      { id: string; decision: string; reviewNotes?: string; rejectionReason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/professional-applications/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['ProfApps', 'AdminStats', 'AdminUsers'],
    }),
    getNewsReports: builder.query<any[], void>({
      query: () => ({ url: '/admin/news/reports' }),
      transformResponse: (r: any) => r.result ?? [],
      providesTags: ['NewsReports'],
    }),
    reviewNewsReport: builder.mutation<
      any,
      { id: string; status?: string; reviewNotes?: string; hideContent?: boolean }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/news/reports/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['NewsReports'],
    }),
    getAuditLogs: builder.query<
      { data: any[]; pagination: any },
      { page?: number; limit?: number; search?: string; action?: string } | void
    >({
      query: (params) => ({
        url: '/admin/audit-logs',
        params: params ?? undefined,
      }),
      providesTags: ['AuditLogs'],
    }),
    getAdminAppointments: builder.query<
      { data: any[]; pagination: any },
      { page?: number; limit?: number; search?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/admin/appointments',
        params: params ?? undefined,
      }),
      providesTags: ['AdminAppointments'],
    }),

    /* ---------- Plans / Subscriptions / CMS (SUPER_ADMIN) ---------- */
    getPlans: builder.query<any[], void>({
      query: () => ({ url: '/admin/plans' }),
      transformResponse: (r: any) => r.result ?? [],
      providesTags: ['Plans'],
    }),
    getPublicPlans: builder.query<any[], void>({
      query: () => ({ url: '/admin/public/plans' }),
      transformResponse: (r: any) => r.result ?? [],
    }),
    createPlan: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/plans', method: 'POST', body }),
      invalidatesTags: ['Plans', 'AdminStats'],
    }),
    updatePlan: builder.mutation<any, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({
        url: `/admin/plans/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Plans', 'AdminStats'],
    }),
    deactivatePlan: builder.mutation<any, string>({
      query: (id) => ({ url: `/admin/plans/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Plans', 'AdminStats'],
    }),
    getSubscriptions: builder.query<
      { data: any[]; pagination: any },
      { page?: number; limit?: number; search?: string; status?: string } | void
    >({
      query: (params) => ({
        url: '/admin/subscriptions',
        params: params ?? undefined,
      }),
      providesTags: ['Subscriptions'],
    }),
    createSubscription: builder.mutation<any, Record<string, unknown>>({
      query: (body) => ({
        url: '/admin/subscriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscriptions', 'AdminStats'],
    }),
    updateSubscription: builder.mutation<
      any,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/subscriptions/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Subscriptions', 'AdminStats'],
    }),
    getCms: builder.query<any, string>({
      query: (key) => ({ url: `/admin/cms/${encodeURIComponent(key)}` }),
      transformResponse: (r: any) => r.result ?? r,
      providesTags: (_r, _e, key) => [{ type: 'Cms', id: key }],
    }),
    getPublicCms: builder.query<any, string>({
      query: (key) => ({
        url: `/admin/public/cms/${encodeURIComponent(key)}`,
      }),
      transformResponse: (r: any) => r.result ?? r,
    }),
    upsertCms: builder.mutation<
      any,
      { key: string; body: { title?: string; data: unknown; published?: boolean } }
    >({
      query: ({ key, body }) => ({
        url: `/admin/cms/${encodeURIComponent(key)}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_r, _e, arg) => [{ type: 'Cms', id: arg.key }],
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useUpdateAdminUserMutation,
  useAdminPasswordResetMutation,
  useGetFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
  useGetProfessionalApplicationsQuery,
  useReviewProfessionalApplicationMutation,
  useGetNewsReportsQuery,
  useReviewNewsReportMutation,
  useGetAuditLogsQuery,
  useGetAdminAppointmentsQuery,
  useGetPlansQuery,
  useGetPublicPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useDeactivatePlanMutation,
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useGetCmsQuery,
  useGetPublicCmsQuery,
  useUpsertCmsMutation,
} = adminApi
