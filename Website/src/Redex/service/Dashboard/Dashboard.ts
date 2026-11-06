import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapResult } from "@/Redex/lib/ownedApi"
import type { AdminDashboardStats, ApiResponse } from "@/Redex/types/Types"

/** Lightweight dashboard shape used by CareHome / Dashboard UI */
export interface DashboardData {
  summary?: {
    totalAppointments?: number
    totalPrescriptions?: number
    totalLabOrders?: number
  }
  appointmentsOverview?: {
    upcoming?: Array<{
      id?: string
      appointmentid?: string
      appointmentCode?: string
      scheduledAt: string
      patientName?: string
      doctorName?: string | null
      status: string
    }>
    byStatus?: Record<string, number>
  }
  admin?: AdminDashboardStats
}

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["Dashboard"],
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardData, void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const [appointments, prescriptions, labs] = await Promise.all([
          baseQuery({ url: "/appointments", params: { limit: 10 } }),
          baseQuery({ url: "/prescriptions", params: { limit: 5 } }),
          baseQuery({ url: "/lab-results", params: { limit: 5 } }),
        ])

        const apptRaw = appointments.data
          ? unwrapResult(appointments.data as ApiResponse<{ items?: unknown[] } | unknown[]>)
          : null
        const apptItems = Array.isArray(apptRaw)
          ? apptRaw
          : ((apptRaw as { items?: unknown[] })?.items ?? [])

        const rxRaw = prescriptions.data
          ? unwrapResult(prescriptions.data as ApiResponse<{ items?: unknown[] } | unknown[]>)
          : null
        const rxItems = Array.isArray(rxRaw)
          ? rxRaw
          : ((rxRaw as { items?: unknown[] })?.items ?? [])

        const labRaw = labs.data
          ? unwrapResult(labs.data as ApiResponse<{ items?: unknown[] } | unknown[]>)
          : null
        const labItems = Array.isArray(labRaw)
          ? labRaw
          : ((labRaw as { items?: unknown[] })?.items ?? [])

        const upcoming = (apptItems as Array<Record<string, unknown>>)
          .filter((a) => {
            const status = String(a.status || "")
            return !["CANCELLED", "COMPLETED", "NO_SHOW", "REJECTED"].includes(status)
          })
          .slice(0, 5)
          .map((a) => ({
            id: String(a.id ?? ""),
            appointmentid: String(a.id ?? ""),
            appointmentCode: String(a.appointmentCode ?? ""),
            scheduledAt: String(a.scheduledAt ?? ""),
            doctorName:
              (a.doctor as { fullName?: string } | undefined)?.fullName ?? null,
            patientName: (a.user as { fullName?: string } | undefined)?.fullName,
            status: String(a.status ?? ""),
          }))

        return {
          data: {
            summary: {
              totalAppointments: apptItems.length,
              totalPrescriptions: rxItems.length,
              totalLabOrders: labItems.length,
            },
            appointmentsOverview: { upcoming },
          } satisfies DashboardData,
        }
      },
      providesTags: ["Dashboard"],
    }),

    getAdminDashboard: builder.query<AdminDashboardStats, void>({
      query: () => ({ url: "/admin/dashboard" }),
      transformResponse: (res: ApiResponse<AdminDashboardStats>) => unwrapResult(res),
      providesTags: ["Dashboard"],
    }),
  }),
})

export const { useGetDashboardQuery, useGetAdminDashboardQuery } = dashboardApi
