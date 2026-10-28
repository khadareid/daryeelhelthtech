import { createApi } from '@reduxjs/toolkit/query/react'
import { apiBaseQuery } from '@/lib/apiBaseQuery'

export type AppointmentRecord = {
  appointmentid: string
  appointmentCode?: string
  scheduledAt: string
  status: string
  doctorName?: string | null
  doctorId?: string | null
  professionalUserId?: string | null
  specialty?: string | null
  facilityName?: string | null
  facilityId?: string | null
  reason?: string | null
  notes?: string | null
  meetingLink?: string | null
  duration?: number
  patientName?: string | null
  patientUserId?: string | null
  patientHealthId?: string | null
  patientPhone?: string | null
  patientEmail?: string | null
  professionalName?: string | null
  isMineAsPatient?: boolean
  isMineAsProfessional?: boolean
}

export type BookAppointmentBody = {
  doctorId?: string
  professionalUserId?: string
  doctorName: string
  specialty?: string
  facilityName?: string
  facilityId?: string
  scheduledAt: string
  duration?: number
  reason?: string
  notes?: string
  visitType?: string
}

type OneResponse = {
  isSuccess: boolean
  message?: string
  result?: AppointmentRecord
  data?: AppointmentRecord
}

type ListResponse = {
  isSuccess: boolean
  result?: AppointmentRecord[]
  data?: AppointmentRecord[]
}

export const appointmentsApi = createApi({
  reducerPath: 'appointmentsApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Appointments'],
  endpoints: (builder) => ({
    createAppointment: builder.mutation<AppointmentRecord, BookAppointmentBody>({
      query: (body) => ({
        url: '/appointments',
        method: 'POST',
        body,
      }),
      transformResponse: (res: OneResponse) =>
        (res.result ?? res.data) as AppointmentRecord,
      invalidatesTags: ['Appointments'],
    }),
    getMyAppointments: builder.query<AppointmentRecord[], void>({
      query: () => ({ url: '/appointments', method: 'GET' }),
      transformResponse: (res: ListResponse) => {
        const list = res.result ?? res.data ?? []
        return Array.isArray(list) ? list : []
      },
      providesTags: ['Appointments'],
    }),
    cancelAppointment: builder.mutation<AppointmentRecord, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/appointments/${id}/cancel`,
        method: 'PATCH',
        body: { reason },
      }),
      transformResponse: (res: OneResponse) =>
        (res.result ?? res.data) as AppointmentRecord,
      invalidatesTags: ['Appointments'],
    }),
  }),
})

export const {
  useCreateAppointmentMutation,
  useGetMyAppointmentsQuery,
  useCancelAppointmentMutation,
} = appointmentsApi
