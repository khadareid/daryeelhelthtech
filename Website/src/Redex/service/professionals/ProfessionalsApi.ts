import { createApi } from '@reduxjs/toolkit/query/react'
import { apiBaseQuery } from '@/lib/apiBaseQuery'

export type PublicProfessional = {
  id: string
  professionalProfileId: string
  slug: string
  userId: string
  name: string
  professionalType: string
  specialty: string
  specialization: string
  subSpecialty?: string | null
  experienceYears: number
  yearsOfExperience: number
  fee: number
  currency: string
  rating: number
  reviews: number
  totalPatients?: number
  bio: string
  image?: string | null
  languages?: string[]
  workplace?: string | null
  facilityName?: string | null
  city: string
  country?: string
  verified: boolean
  isVerified: boolean
  availableToday?: boolean
  healthId?: string | null
  availability?: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    isAvailable: boolean
  }>
}

type ListResponse = {
  isSuccess: boolean
  result?: PublicProfessional[]
}

type OneResponse = {
  isSuccess: boolean
  result?: PublicProfessional
}

export type ProfessionalFilters = {
  q?: string
  type?: string
  specialty?: string
  city?: string
  verified?: boolean
  limit?: number
}

export const professionalsApi = createApi({
  reducerPath: 'professionalsApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Professionals', 'Connections'],
  endpoints: (builder) => ({
    /** Local DB doctors/professionals — NOT SaaS hospital care-team */
    getProfessionals: builder.query<PublicProfessional[], ProfessionalFilters | void>({
      query: (params) => ({
        url: '/professionals',
        method: 'GET',
        params: {
          q: params?.q || undefined,
          type: params?.type || undefined,
          specialty: params?.specialty || undefined,
          city: params?.city || undefined,
          verified: params?.verified ? 'true' : undefined,
          limit: params?.limit || 40,
        },
      }),
      transformResponse: (res: ListResponse) =>
        Array.isArray(res.result) ? res.result : [],
      providesTags: ['Professionals'],
    }),

    getProfessional: builder.query<PublicProfessional, string>({
      query: (idOrSlug) => ({
        // Prefer /user/doctors/:id (same handler) — more stable with deployed APIs
        url: `/user/doctors/${idOrSlug}`,
        method: 'GET',
      }),
      transformResponse: (res: OneResponse) => res.result as PublicProfessional,
      providesTags: (_r, _e, id) => [{ type: 'Professionals', id }],
    }),

    /** Alias kept for callers that still hit /user/doctors */
    getDoctors: builder.query<PublicProfessional[], ProfessionalFilters | void>({
      query: (params) => ({
        url: '/user/doctors',
        method: 'GET',
        params: {
          q: params?.q || undefined,
          type: params?.type || 'DOCTOR',
          specialty: params?.specialty || undefined,
          city: params?.city || undefined,
          verified: params?.verified ? 'true' : undefined,
          limit: params?.limit || 40,
        },
      }),
      transformResponse: (res: ListResponse) =>
        Array.isArray(res.result) ? res.result : [],
      providesTags: ['Professionals'],
    }),

    requestConnection: builder.mutation<
      unknown,
      { professionalUserId: string; reason?: string }
    >({
      query: (body) => ({
        url: '/connections',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Connections'],
    }),

    getConnections: builder.query<unknown[], { status?: string } | void>({
      query: (params) => ({
        url: '/connections',
        method: 'GET',
        params: params?.status ? { status: params.status } : undefined,
      }),
      transformResponse: (res: { result?: unknown[] }) =>
        Array.isArray(res.result) ? res.result : [],
      providesTags: ['Connections'],
    }),

    acceptConnection: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/connections/${id}/accept`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Connections'],
    }),

    rejectConnection: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/connections/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Connections'],
    }),

    endConnection: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/connections/${id}/end`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Connections'],
    }),

    getMyProfessionalProfile: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: '/professional/profile', method: 'GET' }),
      transformResponse: (res: { result?: Record<string, unknown> }) =>
        (res.result || {}) as Record<string, unknown>,
      providesTags: [{ type: 'Professionals', id: 'ME' }],
    }),

    updateMyProfessionalProfile: builder.mutation<
      Record<string, unknown>,
      {
        specialization?: string
        subSpecialty?: string
        publicBio?: string
        workplace?: string
        facilityName?: string
        yearsOfExperience?: number
        languages?: string[] | string
        publicPhone?: string
        publicEmail?: string
        website?: string
        isPubliclyVisible?: boolean
        consultationFee?: number
        publicPhotoUrl?: string
      }
    >({
      query: (body) => ({
        url: '/professional/profile',
        method: 'PATCH',
        body,
      }),
      transformResponse: (res: { result?: Record<string, unknown> }) =>
        (res.result || {}) as Record<string, unknown>,
      invalidatesTags: ['Professionals', { type: 'Professionals', id: 'ME' }],
    }),
  }),
})

export const {
  useGetProfessionalsQuery,
  useGetProfessionalQuery,
  useGetDoctorsQuery,
  useRequestConnectionMutation,
  useGetConnectionsQuery,
  useAcceptConnectionMutation,
  useRejectConnectionMutation,
  useEndConnectionMutation,
  useGetMyProfessionalProfileQuery,
  useUpdateMyProfessionalProfileMutation,
} = professionalsApi

export function professionalPhoto(p: PublicProfessional) {
  return (
    p.image ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=146AFB&color=fff`
  )
}
