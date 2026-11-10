import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type { ApiResponse } from "@/Redex/types/Types"

/** SaaS hospital / tenant surfaced via Healthtech proxy */
export type HealthcareHospital = {
  tenantId?: string
  hospitalId?: string
  id?: string
  companyName?: string
  name?: string
  username?: string
  phone?: string | null
  email?: string | null
  city?: string | null
  country?: string | null
  address?: string | null
  logoUrl?: string | null
  publicLogoUrl?: string | null
  description?: string | null
  publicDescription?: string | null
  industry?: string | null
  averageRating?: number | null
  rating?: number | null
  totalReviews?: number | null
  doctors?: HealthcareDoctor[]
  facilities?: HealthcareFacility[]
  _count?: {
    professionalProfiles?: number
    doctors?: number
  }
  doctorsCount?: number
  [key: string]: unknown
}

export type HealthcareFacility = {
  facilityId?: string
  name?: string
  phone?: string | null
  address?: string | null
  city?: string | null
  isMain?: boolean
}

export type HealthcareDepartment = {
  departmentId?: string
  id?: string
  name?: string
  type?: string
  hospitalId?: string
  city?: string | null
  isMain?: boolean
  [key: string]: unknown
}

export type HealthcareDoctor = {
  doctorId?: string
  professionalProfileId?: string
  id?: string
  userId?: string
  name?: string
  specialization?: string | null
  specialty?: string | null
  yearsOfExperience?: number | null
  languages?: string[] | null
  publicBio?: string | null
  publicPhotoUrl?: string | null
  consultationFee?: number | string | null
  currency?: string | null
  averageRating?: number | null
  totalReviews?: number | null
  facilityId?: string | null
  facilityName?: string | null
  hospitalId?: string | null
  hospitalName?: string | null
  city?: string | null
  department?: { name?: string } | string | null
  user?: {
    name?: string
    picture?: string | null
    userId?: string
  } | null
  tenant?: {
    tenantId?: string
    companyName?: string
    city?: string | null
    logoUrl?: string | null
  } | null
  isVerified?: boolean
  [key: string]: unknown
}

export type HealthcareAvailabilitySlot = {
  start?: string
  end?: string
  time?: string
  label?: string
  scheduledAt?: string
  available?: boolean
  [key: string]: unknown
}

export type HealthcareAvailability = {
  available?: boolean
  slotAvailable?: boolean
  date?: string
  slots?: Array<string | HealthcareAvailabilitySlot>
  windows?: unknown[]
  usingDefault?: boolean
  [key: string]: unknown
}

export type HealthcareAppointment = {
  id: string
  appointmentCode?: string
  userId?: string
  doctorId?: string | null
  scheduledAt: string
  duration?: number
  reason?: string | null
  notes?: string | null
  status: string
  source?: string
  department?: string | null
  specialty?: string | null
  doctorName?: string | null
  facilityName?: string | null
  externalHospitalId?: string | null
  externalDoctorId?: string | null
  externalTicketId?: string | null
  externalTicketNumber?: string | null
  externalAppointmentId?: string | null
  proposedScheduledAt?: string | null
  proposedMessage?: string | null
  rejectionReason?: string | null
  cancellationReason?: string | null
  cancelledAt?: string | null
  confirmedAt?: string | null
  consultationFee?: number | string | null
  currency?: string | null
  hospitalPaymentStatus?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export type HealthcareOpdTicket = {
  ticketId?: string | null
  ticketNumber?: string | null
  appointmentId?: string
  externalAppointmentId?: string | null
  hospital?: string | null
  doctor?: string | null
  department?: string | null
  scheduledAt?: string
  status?: string
}

export type CreateHealthcareAppointmentBody = {
  hospitalId: string
  tenantId?: string
  doctorId: string
  facilityId?: string | null
  departmentId?: string | null
  department?: string | null
  scheduledAt: string
  duration?: number
  reason?: string | null
  notes?: string | null
  type?: string | null
  consentId?: string | null
  consentGranted?: boolean
  consultationFee?: number | null
  currency?: string | null
  doctorName?: string | null
  facilityName?: string | null
  specialty?: string | null
  idempotencyKey?: string | null
  externalRequestId?: string | null
}

export type CancelHealthcareAppointmentBody = {
  id: string
  reason?: string
}

export type RequestRescheduleBody = {
  id: string
  proposedScheduledAt: string
  message?: string
}

export type RespondRescheduleBody = {
  id: string
  accept: boolean
}

export function hospitalIdOf(h: HealthcareHospital | null | undefined): string {
  return String(h?.tenantId || h?.hospitalId || h?.id || "")
}

export function hospitalNameOf(h: HealthcareHospital | null | undefined): string {
  return String(h?.companyName || h?.name || "Hospital")
}

export function hospitalLogoOf(h: HealthcareHospital | null | undefined): string | null {
  return (h?.publicLogoUrl || h?.logoUrl || null) as string | null
}

export function hospitalDoctorsCount(h: HealthcareHospital | null | undefined): number {
  if (typeof h?.doctorsCount === "number") return h.doctorsCount
  if (typeof h?._count?.professionalProfiles === "number") {
    return h._count.professionalProfiles
  }
  if (typeof h?._count?.doctors === "number") return h._count.doctors
  if (Array.isArray(h?.doctors)) return h.doctors.length
  return 0
}

export function hospitalRatingOf(h: HealthcareHospital | null | undefined): number | null {
  const r = h?.rating ?? h?.averageRating
  return typeof r === "number" ? r : r != null ? Number(r) : null
}

export function doctorIdOf(d: HealthcareDoctor | null | undefined): string {
  return String(d?.doctorId || d?.user?.userId || d?.userId || d?.id || "")
}

export function doctorNameOf(d: HealthcareDoctor | null | undefined): string {
  return String(d?.user?.name || d?.name || "Doctor")
}

export function doctorPhotoOf(d: HealthcareDoctor | null | undefined): string | null {
  return (d?.publicPhotoUrl || d?.user?.picture || null) as string | null
}

export function doctorSpecialtyOf(d: HealthcareDoctor | null | undefined): string {
  if (typeof d?.department === "string" && d.department) return d.department
  if (d?.department && typeof d.department === "object" && d.department.name) {
    return String(d.specialization || d.specialty || d.department.name)
  }
  return String(d?.specialization || d?.specialty || "General")
}

export function doctorHospitalNameOf(d: HealthcareDoctor | null | undefined): string {
  return String(d?.hospitalName || d?.tenant?.companyName || d?.facilityName || "")
}

export function departmentIdOf(dep: HealthcareDepartment): string {
  return String(dep.departmentId || dep.id || dep.name || "")
}

export function normalizeAvailabilitySlots(
  avail: HealthcareAvailability | HealthcareAvailabilitySlot[] | string[] | null | undefined
): string[] {
  if (!avail) return []
  const raw = Array.isArray(avail)
    ? avail
    : Array.isArray(avail.slots)
      ? avail.slots
      : []
  const labels: string[] = []
  for (const slot of raw) {
    if (typeof slot === "string") {
      labels.push(slot)
      continue
    }
    const start =
      slot?.start || slot?.scheduledAt || slot?.time || slot?.label || ""
    if (!start) continue
    if (slot.available === false) continue
    labels.push(String(start))
  }
  return labels
}

const BASE = "/healthcare"

export const healthcareApi = createApi({
  reducerPath: "healthcareApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["HealthcareHospitals", "HealthcareDoctors", "HealthcareAppointments", "HealthcareOpd"],
  endpoints: (builder) => ({
    getHospitals: builder.query<
      HealthcareHospital[],
      {
        search?: string
        city?: string
        department?: string
        availableToday?: string | boolean
        availableThisWeek?: string | boolean
        page?: number
        limit?: number
      } | void
    >({
      query: (params) => ({
        url: `${BASE}/hospitals`,
        method: "GET",
        params: params
          ? {
              ...params,
              availableToday:
                params.availableToday === true
                  ? "true"
                  : params.availableToday === false
                    ? undefined
                    : params.availableToday,
              availableThisWeek:
                params.availableThisWeek === true
                  ? "true"
                  : params.availableThisWeek === false
                    ? undefined
                    : params.availableThisWeek,
            }
          : undefined,
      }),
      transformResponse: (res: ApiResponse<HealthcareHospital[]>) =>
        unwrapList(res),
      providesTags: ["HealthcareHospitals"],
    }),

    getHospital: builder.query<HealthcareHospital, string>({
      query: (hospitalId) => ({
        url: `${BASE}/hospitals/${hospitalId}`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<HealthcareHospital>) =>
        unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "HealthcareHospitals", id }],
    }),

    getDepartments: builder.query<HealthcareDepartment[], string>({
      query: (hospitalId) => ({
        url: `${BASE}/hospitals/${hospitalId}/departments`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<HealthcareDepartment[]>) =>
        unwrapList(res),
      providesTags: (_r, _e, id) => [{ type: "HealthcareHospitals", id }],
    }),

    getDoctors: builder.query<
      HealthcareDoctor[],
      {
        search?: string
        specialization?: string
        specialty?: string
        department?: string
        city?: string
        hospitalId?: string
        page?: number
        limit?: number
      } | void
    >({
      query: (params) => ({
        url: `${BASE}/doctors`,
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<HealthcareDoctor[]>) =>
        unwrapList(res),
      providesTags: ["HealthcareDoctors"],
    }),

    getHospitalDoctors: builder.query<
      HealthcareDoctor[],
      {
        hospitalId: string
        search?: string
        specialization?: string
        specialty?: string
        department?: string
        page?: number
        limit?: number
      }
    >({
      query: ({ hospitalId, ...params }) => ({
        url: `${BASE}/hospitals/${hospitalId}/doctors`,
        method: "GET",
        params,
      }),
      transformResponse: (res: ApiResponse<HealthcareDoctor[]>) =>
        unwrapList(res),
      providesTags: (_r, _e, arg) => [
        { type: "HealthcareDoctors", id: arg.hospitalId },
      ],
    }),

    getDoctor: builder.query<HealthcareDoctor, string>({
      query: (doctorId) => ({
        url: `${BASE}/doctors/${doctorId}`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<HealthcareDoctor>) =>
        unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "HealthcareDoctors", id }],
    }),

    getDoctorAvailability: builder.query<
      HealthcareAvailability,
      { doctorId: string; date?: string }
    >({
      query: ({ doctorId, date }) => ({
        url: `${BASE}/doctors/${doctorId}/availability`,
        method: "GET",
        params: date ? { date } : undefined,
      }),
      transformResponse: (res: ApiResponse<HealthcareAvailability>) =>
        unwrapResult(res),
    }),

    getAppointments: builder.query<
      HealthcareAppointment[],
      { status?: string } | void
    >({
      query: (params) => ({
        url: `${BASE}/appointments`,
        method: "GET",
        params: params ?? undefined,
      }),
      transformResponse: (res: ApiResponse<HealthcareAppointment[]>) =>
        unwrapList(res),
      providesTags: ["HealthcareAppointments"],
    }),

    getAppointment: builder.query<HealthcareAppointment, string>({
      query: (id) => ({
        url: `${BASE}/appointments/${id}`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<HealthcareAppointment>) =>
        unwrapResult(res),
      providesTags: (_r, _e, id) => [{ type: "HealthcareAppointments", id }],
    }),

    createAppointment: builder.mutation<
      HealthcareAppointment,
      CreateHealthcareAppointmentBody
    >({
      query: (body) => ({
        url: `${BASE}/appointments`,
        method: "POST",
        body,
      }),
      transformResponse: (res: ApiResponse<HealthcareAppointment>) =>
        unwrapResult(res),
      invalidatesTags: ["HealthcareAppointments", "HealthcareOpd"],
    }),

    cancelAppointment: builder.mutation<
      HealthcareAppointment,
      CancelHealthcareAppointmentBody
    >({
      query: ({ id, reason }) => ({
        url: `${BASE}/appointments/${id}/cancel`,
        method: "POST",
        body: reason ? { reason } : {},
      }),
      transformResponse: (res: ApiResponse<HealthcareAppointment>) =>
        unwrapResult(res),
      invalidatesTags: ["HealthcareAppointments", "HealthcareOpd"],
    }),

    requestReschedule: builder.mutation<
      HealthcareAppointment,
      RequestRescheduleBody
    >({
      query: ({ id, proposedScheduledAt, message }) => ({
        url: `${BASE}/appointments/${id}/reschedule`,
        method: "POST",
        body: { proposedScheduledAt, message },
      }),
      transformResponse: (res: ApiResponse<HealthcareAppointment>) =>
        unwrapResult(res),
      invalidatesTags: ["HealthcareAppointments"],
    }),

    respondReschedule: builder.mutation<
      HealthcareAppointment,
      RespondRescheduleBody
    >({
      query: ({ id, accept }) => ({
        url: `${BASE}/appointments/${id}/reschedule/respond`,
        method: "POST",
        body: { accept },
      }),
      transformResponse: (res: ApiResponse<HealthcareAppointment>) =>
        unwrapResult(res),
      invalidatesTags: ["HealthcareAppointments"],
    }),

    getOpdTickets: builder.query<HealthcareOpdTicket[], void>({
      query: () => ({
        url: `${BASE}/opd-tickets`,
        method: "GET",
      }),
      transformResponse: (res: ApiResponse<HealthcareOpdTicket[]>) =>
        unwrapList(res),
      providesTags: ["HealthcareOpd"],
    }),
  }),
})

export const {
  useGetHospitalsQuery,
  useGetHospitalQuery,
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
  useGetHospitalDoctorsQuery,
  useGetDoctorQuery,
  useGetDoctorAvailabilityQuery,
  useGetAppointmentsQuery,
  useGetAppointmentQuery,
  useCreateAppointmentMutation,
  useCancelAppointmentMutation,
  useRequestRescheduleMutation,
  useRespondRescheduleMutation,
  useGetOpdTicketsQuery,
} = healthcareApi
