import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapPaginated, unwrapResult } from "@/Redex/lib/ownedApi"
import type { ApiResponse, Appointment, Paginated } from "@/Redex/types/Types"

export type BookAppointmentBody = {
  doctorId?: string
  scheduledAt: string
  duration?: number
  reason?: string
  notes?: string
  meetingLink?: string
  paymentRequired?: boolean
  consultationFee?: number
  currency?: string
  userId?: string
}

export const appointmentsApi = createApi({
  reducerPath: "appointmentsApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["Appointments"],
  endpoints: (builder) => ({
    createAppointment: builder.mutation<Appointment, BookAppointmentBody>({
      query: (body) => ({
        url: "/appointments",
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<Appointment>) => unwrapResult(res),
      invalidatesTags: ["Appointments"],
    }),

    getMyAppointments: builder.query<
      Appointment[],
      { page?: number; limit?: number; status?: string; as?: string } | void
    >({
      query: (params) => ({
        url: "/appointments",
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<Appointment> | Appointment[]>) =>
        unwrapList(res),
      providesTags: ["Appointments"],
    }),

    getAppointmentsPage: builder.query<
      Paginated<Appointment>,
      { page?: number; limit?: number; status?: string } | void
    >({
      query: (params) => ({
        url: "/appointments",
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<Paginated<Appointment>>) =>
        unwrapPaginated(res),
      providesTags: ["Appointments"],
    }),

    getAppointment: builder.query<Appointment, string>({
      query: (id) => ({ url: `/appointments/${id}`, method: "GET" }),
      transformResponse: (res: ApiResponse<Appointment>) => unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "Appointments", id }],
    }),

    updateAppointment: builder.mutation<
      Appointment,
      {
        id: string
        data: Partial<BookAppointmentBody> & {
          status?: string
          cancellationReason?: string
          paymentStatus?: string
          paymentRequired?: boolean
        }
      }
    >({
      query: ({ id, data }) => ({
        url: `/appointments/${id}`,
        method: "PATCH",
        body: data,
      }),
      transformResponse: (res: ApiResponse<Appointment>) => unwrapResult(res),
      invalidatesTags: ["Appointments"],
    }),

    cancelAppointment: builder.mutation<
      Appointment,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/appointments/${id}`,
        method: "PATCH",
        body: { status: "CANCELLED", cancellationReason: reason },
      }),
      transformResponse: (res: ApiResponse<Appointment>) => unwrapResult(res),
      invalidatesTags: ["Appointments"],
    }),

    deleteAppointment: builder.mutation<{ isSuccess: boolean }, string>({
      query: (id) => ({
        url: `/appointments/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Appointments"],
    }),
  }),
})

export const {
  useCreateAppointmentMutation,
  useGetMyAppointmentsQuery,
  useGetAppointmentsPageQuery,
  useGetAppointmentQuery,
  useUpdateAppointmentMutation,
  useCancelAppointmentMutation,
  useDeleteAppointmentMutation,
} = appointmentsApi
