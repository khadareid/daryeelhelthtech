import { createApi } from '@reduxjs/toolkit/query/react'
import { apiBaseQuery } from '@/lib/apiBaseQuery'

export type HealthcareAppointment = {
  appointmentid: string
  appointmentCode?: string
  scheduledAt: string
  status: string
  doctorName?: string | null
  doctorId?: string | null
  facilityName?: string | null
  facilityId?: string | null
  specialty?: string | null
  department?: string | null
  reason?: string | null
  notes?: string | null
  saasAppointmentId?: string | null
  saasTicketNumber?: string | null
  saasTicketId?: string | null
  paymentStatus?: string | null
  proposedScheduledAt?: string | null
  proposedMessage?: string | null
  rejectionReason?: string | null
  consultationFee?: string | number | null
  currency?: string | null
  doctorReview?: { rating: number; comment?: string | null } | null
}

export type BookHealthcareBody = {
  tenantId: string
  hospitalId?: string
  doctorId: string
  facilityId?: string
  department?: string
  specialty?: string
  doctorName?: string
  facilityName?: string
  scheduledAt: string
  duration?: number
  reason?: string
  notes?: string
  type?: string
  consentGranted: boolean
  consultationFee?: number | string
  currency?: string
  idempotencyKey?: string
}

export type HealthcareActivity = {
  eventid: string
  type: string
  title: string
  body?: string | null
  occurredAt: string
  appointmentId?: string | null
}

export const healthcareApi = createApi({
  reducerPath: 'healthcareApi',
  baseQuery: apiBaseQuery,
  tagTypes: [
    'HealthcareAppointments',
    'OpdTickets',
    'HealthcareActivity',
    'Consents',
    'Availability',
  ],
  endpoints: (builder) => ({
    getHealthcareHospitals: builder.query<
      { data: any[]; pagination?: any },
      { search?: string; page?: number; limit?: number } | void
    >({
      query: (params) => {
        const q = new URLSearchParams()
        if (params?.page) q.set('page', String(params.page))
        if (params?.limit) q.set('limit', String(params.limit))
        if (params?.search) q.set('search', params.search)
        const qs = q.toString()
        return `/healthcare/hospitals${qs ? `?${qs}` : ''}`
      },
      transformResponse: (res: any) => ({
        data: res.data ?? res.result ?? [],
        pagination: res.pagination,
      }),
    }),
    getHealthcareHospital: builder.query<any, string>({
      query: (id) => `/healthcare/hospitals/${encodeURIComponent(id)}`,
      transformResponse: (res: any) => res.data ?? res.result,
    }),
    getHealthcareDoctor: builder.query<any, string>({
      query: (id) => `/healthcare/doctors/${encodeURIComponent(id)}`,
      transformResponse: (res: any) => res.data ?? res.result,
    }),
    getDoctorAvailability: builder.query<
      { windows: any[]; slots: string[] },
      { doctorId: string; date?: string }
    >({
      query: ({ doctorId, date }) => {
        const q = date ? `?date=${encodeURIComponent(date)}` : ''
        return `/healthcare/doctors/${encodeURIComponent(doctorId)}/availability${q}`
      },
      transformResponse: (res: any) => {
        const data = res.data ?? res.result ?? {}
        return {
          windows: data.windows ?? [],
          slots: data.slots ?? [],
        }
      },
      providesTags: ['Availability'],
    }),
    createHealthcareAppointment: builder.mutation<
      HealthcareAppointment,
      BookHealthcareBody
    >({
      query: (body) => ({
        url: '/healthcare/appointments',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res.result ?? res.data,
      invalidatesTags: ['HealthcareAppointments', 'HealthcareActivity', 'OpdTickets'],
    }),
    getHealthcareAppointments: builder.query<HealthcareAppointment[], void>({
      query: () => '/healthcare/appointments',
      transformResponse: (res: any) => {
        const list = res.result ?? res.data ?? []
        return Array.isArray(list) ? list : []
      },
      providesTags: ['HealthcareAppointments'],
    }),
    getHealthcareAppointment: builder.query<HealthcareAppointment, string>({
      query: (id) => `/healthcare/appointments/${encodeURIComponent(id)}`,
      transformResponse: (res: any) => res.result ?? res.data,
      providesTags: ['HealthcareAppointments'],
    }),
    cancelHealthcareAppointment: builder.mutation<
      HealthcareAppointment,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/healthcare/appointments/${encodeURIComponent(id)}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (res: any) => res.result ?? res.data,
      invalidatesTags: ['HealthcareAppointments', 'HealthcareActivity'],
    }),
    respondHealthcareReschedule: builder.mutation<
      HealthcareAppointment,
      { id: string; accept: boolean }
    >({
      query: ({ id, accept }) => ({
        url: `/healthcare/appointments/${encodeURIComponent(id)}/reschedule/respond`,
        method: 'POST',
        body: { accept },
      }),
      transformResponse: (res: any) => res.result ?? res.data,
      invalidatesTags: ['HealthcareAppointments', 'HealthcareActivity', 'OpdTickets'],
    }),
    submitHealthcareReview: builder.mutation<
      any,
      {
        id: string
        rating: number
        comment?: string
        professionalism?: number
        communication?: number
        waitingTime?: number
        careQuality?: number
        overallExperience?: number
      }
    >({
      query: ({ id, ...body }) => ({
        url: `/healthcare/appointments/${encodeURIComponent(id)}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['HealthcareAppointments', 'HealthcareActivity'],
    }),
    getOpdTickets: builder.query<HealthcareAppointment[], void>({
      query: () => '/healthcare/opd-tickets',
      transformResponse: (res: any) => {
        const list = res.result ?? res.data ?? []
        return Array.isArray(list) ? list : []
      },
      providesTags: ['OpdTickets'],
    }),
    getHealthcareActivity: builder.query<HealthcareActivity[], void>({
      query: () => '/healthcare/activity',
      transformResponse: (res: any) => {
        const list = res.result ?? res.data ?? []
        return Array.isArray(list) ? list : []
      },
      providesTags: ['HealthcareActivity'],
    }),
    getConsents: builder.query<any[], void>({
      query: () => '/healthcare/consents',
      transformResponse: (res: any) => {
        const list = res.result ?? res.data ?? []
        return Array.isArray(list) ? list : []
      },
      providesTags: ['Consents'],
    }),
    revokeConsent: builder.mutation<any, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/healthcare/consents/${encodeURIComponent(id)}/revoke`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Consents'],
    }),
  }),
})

export const {
  useGetHealthcareHospitalsQuery,
  useGetHealthcareHospitalQuery,
  useGetHealthcareDoctorQuery,
  useGetDoctorAvailabilityQuery,
  useCreateHealthcareAppointmentMutation,
  useGetHealthcareAppointmentsQuery,
  useGetHealthcareAppointmentQuery,
  useCancelHealthcareAppointmentMutation,
  useRespondHealthcareRescheduleMutation,
  useSubmitHealthcareReviewMutation,
  useGetOpdTicketsQuery,
  useGetHealthcareActivityQuery,
  useGetConsentsQuery,
  useRevokeConsentMutation,
} = healthcareApi
