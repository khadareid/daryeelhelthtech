import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapPaginated, unwrapResult } from "@/Redex/lib/ownedApi"
import type {
  AdminDashboardStats,
  ApiResponse,
  AuditLog,
  Doctor,
  Paginated,
  User,
  UserInput,
  UserUpdateInput,
} from "@/Redex/types/Types"

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: apiBaseQuery,
  tagTypes: [
    "AdminStats",
    "AdminUsers",
    "AuditLogs",
    "PendingDoctors",
    "AdminDoctors",
    "AdminAppointments",
    "AdminPayments",
  ],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminDashboardStats, void>({
      query: () => ({ url: "/admin/dashboard" }),
      transformResponse: (r: ApiResponse<AdminDashboardStats>) => unwrapResult(r),
      providesTags: ["AdminStats"],
    }),

    getAuditLogs: builder.query<
      Paginated<AuditLog>,
      { page?: number; limit?: number; search?: string; action?: string; userId?: string } | void
    >({
      query: (params) => ({
        url: "/admin/audit-logs",
        params: params ?? undefined,
      }),
      transformResponse: (r: ApiResponse<Paginated<AuditLog>>) => unwrapPaginated(r),
      providesTags: ["AuditLogs"],
    }),

    getAdminUsers: builder.query<
      Paginated<User>,
      { page?: number; limit?: number; search?: string; role?: string; status?: string } | void
    >({
      query: (params) => ({
        url: "/admin/users",
        params: params ?? undefined,
      }),
      transformResponse: (r: ApiResponse<Paginated<User>>) => unwrapPaginated(r),
      providesTags: ["AdminUsers"],
    }),

    getAdminUser: builder.query<User, string>({
      query: (id) => ({ url: `/admin/users/${id}` }),
      transformResponse: (r: ApiResponse<User>) => unwrapResult(r),
      providesTags: (_r, _e, id) => [{ type: "AdminUsers", id }],
    }),

    createAdminUser: builder.mutation<User, UserInput & { role?: string }>({
      query: (body) => ({
        url: "/admin/users",
        method: "POST",
        body,
      }),
      transformResponse: (r: ApiResponse<User>) => unwrapResult(r),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    updateAdminUser: builder.mutation<
      User,
      { id: string; body: UserUpdateInput & { role?: string; isActive?: boolean; isSuspended?: boolean } }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<User>) => unwrapResult(r),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    deleteAdminUser: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),

    resetAdminUserPassword: builder.mutation<
      { changed: boolean; userid: string; email: string; fullName: string },
      { id: string; newPassword: string }
    >({
      query: ({ id, newPassword }) => ({
        url: `/admin/users/${id}/reset-password`,
        method: "POST",
        body: { newPassword },
      }),
      transformResponse: (
        r: ApiResponse<{
          changed: boolean
          userid: string
          email: string
          fullName: string
        }>
      ) => unwrapResult(r),
      invalidatesTags: ["AdminUsers"],
    }),

    getPendingDoctors: builder.query<
      Paginated<Doctor> | Doctor[],
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "/admin/doctors/pending",
        params: params ?? undefined,
      }),
      transformResponse: (r: ApiResponse<Paginated<Doctor> | Doctor[]>) => unwrapResult(r),
      providesTags: ["PendingDoctors"],
    }),

    getAdminDoctors: builder.query<
      Paginated<Doctor>,
      { page?: number; limit?: number; q?: string; status?: string } | void
    >({
      query: (params) => ({
        url: "/admin/doctors",
        params: params ?? undefined,
      }),
      transformResponse: (r: ApiResponse<Paginated<Doctor>>) => unwrapPaginated(r),
      providesTags: ["AdminDoctors"],
    }),

    createAdminDoctor: builder.mutation<
      Doctor,
      {
        email: string
        password: string
        fullName: string
        specialty: string
        phone?: string
        licenseNumber?: string
        clinicName?: string
        city?: string
        consultationFee?: number
        qualification?: string
        bio?: string
        videoConsultationEnabled?: boolean
        chatConsultationEnabled?: boolean
        isAvailable?: boolean
      }
    >({
      query: (body) => ({
        url: "/admin/doctors",
        method: "POST",
        body,
      }),
      transformResponse: (r: ApiResponse<Doctor>) => unwrapResult(r),
      invalidatesTags: ["AdminDoctors", "PendingDoctors", "AdminStats"],
    }),

    getAdminDoctor: builder.query<Doctor, string>({
      query: (id) => ({ url: `/admin/doctors/${id}` }),
      transformResponse: (r: ApiResponse<Doctor>) => unwrapResult(r),
      providesTags: (_r, _e, id) => [{ type: "AdminDoctors", id }],
    }),

    updateAdminDoctor: builder.mutation<
      Doctor,
      {
        id: string
        body: Partial<{
          fullName: string
          specialty: string
          subSpecialty: string | null
          qualification: string | null
          licenseNumber: string | null
          clinicName: string | null
          city: string | null
          country: string | null
          consultationFee: number | null
          videoConsultationFee: number | null
          chatConsultationFee: number | null
          currency: string
          bio: string | null
          phone: string | null
          yearsExperience: number | null
          consultationEnabled: boolean
          videoConsultationEnabled: boolean
          chatConsultationEnabled: boolean
          isAvailable: boolean
          isOnline: boolean
          isActive: boolean
          verificationStatus: string
          rejectionReason: string | null
        }>
      }
    >({
      query: ({ id, body }) => ({
        url: `/admin/doctors/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<Doctor>) => unwrapResult(r),
      invalidatesTags: ["AdminDoctors", "PendingDoctors", "AdminStats"],
    }),

    deleteAdminDoctor: builder.mutation<Doctor, string>({
      query: (id) => ({
        url: `/admin/doctors/${id}`,
        method: "DELETE",
      }),
      transformResponse: (r: ApiResponse<Doctor>) => unwrapResult(r),
      invalidatesTags: ["AdminDoctors", "PendingDoctors", "AdminStats"],
    }),

    verifyDoctor: builder.mutation<
      Doctor,
      { id: string; verificationStatus: string; rejectionReason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/admin/doctors/${id}/verify`,
        method: "PATCH",
        body: {
          status: body.verificationStatus,
          verificationStatus: body.verificationStatus,
          rejectionReason: body.rejectionReason,
        },
      }),
      transformResponse: (r: ApiResponse<Doctor>) => unwrapResult(r),
      invalidatesTags: ["PendingDoctors", "AdminDoctors", "AdminStats"],
    }),

    getAdminAppointments: builder.query<
      Paginated<import("@/Redex/types/Types").Appointment>,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: "/admin/appointments",
        params: params ?? undefined,
      }),
      transformResponse: (
        r: ApiResponse<Paginated<import("@/Redex/types/Types").Appointment>>
      ) => unwrapPaginated(r),
      providesTags: ["AdminAppointments"],
    }),

    updateAdminAppointment: builder.mutation<
      import("@/Redex/types/Types").Appointment,
      {
        id: string
        status?: string
        cancellationReason?: string
        paymentStatus?: string
        paymentRequired?: boolean
        consultationFee?: number
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/appointments/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (
        r: ApiResponse<import("@/Redex/types/Types").Appointment>
      ) => unwrapResult(r),
      invalidatesTags: ["AdminAppointments", "AdminStats", "AdminPayments"],
    }),

    getAdminPayments: builder.query<
      Paginated<import("@/Redex/types/Types").Payment>,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: "/payments",
        params: params ?? undefined,
      }),
      transformResponse: (
        r: ApiResponse<Paginated<import("@/Redex/types/Types").Payment>>
      ) => unwrapPaginated(r),
      providesTags: ["AdminPayments"],
    }),

    updateAdminPayment: builder.mutation<
      import("@/Redex/types/Types").Payment,
      { id: string; status?: string; method?: string; refundReason?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/payments/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (
        r: ApiResponse<import("@/Redex/types/Types").Payment>
      ) => unwrapResult(r),
      invalidatesTags: ["AdminPayments", "AdminStats", "AdminAppointments"],
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useGetAuditLogsQuery,
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useResetAdminUserPasswordMutation,
  useGetPendingDoctorsQuery,
  useGetAdminDoctorsQuery,
  useGetAdminDoctorQuery,
  useCreateAdminDoctorMutation,
  useUpdateAdminDoctorMutation,
  useDeleteAdminDoctorMutation,
  useVerifyDoctorMutation,
  useGetAdminAppointmentsQuery,
  useUpdateAdminAppointmentMutation,
  useGetAdminPaymentsQuery,
  useUpdateAdminPaymentMutation,
} = adminApi
