import { createApi } from '@reduxjs/toolkit/query/react'
import { saasBaseQuery } from '@/lib/saasBaseQuery'

export type PublicHospitalDoctor = {
  professionalProfileId: string
  specialization?: string | null
  subSpecialty?: string | null
  publicBio?: string | null
  publicPhotoUrl?: string | null
  yearsOfExperience?: number | null
  languages?: string[] | null
  publicPhone?: string | null
  website?: string | null
  consultationFee?: string | null
  currency?: string | null
  isVerified?: boolean
  department?: { name?: string | null } | null
  user?: { name?: string | null; picture?: string | null } | null
}

export type PublicHospital = {
  tenantId: string
  companyName: string
  username?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
  address?: string | null
  website?: string | null
  logoUrl?: string | null
  publicLogoUrl?: string | null
  publicCoverUrl?: string | null
  publicDescription?: string | null
  description?: string | null
  industry?: string | null
  rating?: number | null
  totalReviews?: number | null
  isHealthFacility?: boolean
  createdAt?: string
  _count?: { professionalProfiles?: number }
  doctors?: PublicHospitalDoctor[]
}

export type HospitalsPagination = {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function hospitalCover(h: PublicHospital) {
  return (
    h.publicCoverUrl ||
    h.publicLogoUrl ||
    h.logoUrl ||
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=900&q=80'
  )
}

export function hospitalAbout(h: PublicHospital) {
  return (
    h.publicDescription ||
    h.description ||
    'Healthcare facility on the Daryeel network.'
  )
}

export type CareTeamDoctor = PublicHospitalDoctor & {
  hospitalId: string
  hospitalName: string
  city?: string | null
  country?: string | null
}

const DOCTOR_PHOTO_FALLBACK =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80'

export function doctorPhoto(doctor: PublicHospitalDoctor) {
  return (
    doctor.publicPhotoUrl ||
    doctor.user?.picture ||
    DOCTOR_PHOTO_FALLBACK
  )
}

export function doctorName(doctor: PublicHospitalDoctor) {
  return doctor.user?.name || 'Doctor'
}

type HospitalsListApi = {
  isSuccess?: boolean
  data?: PublicHospital[]
  result?: PublicHospital[]
  pagination?: HospitalsPagination
}

type HospitalDetailApi = {
  isSuccess?: boolean
  data?: PublicHospital
  result?: PublicHospital
}

export const hospitalsApi = createApi({
  reducerPath: 'hospitalsApi',
  baseQuery: saasBaseQuery,
  tagTypes: ['Hospitals', 'Hospital', 'CareTeam'],
  endpoints: (builder) => ({
    getPublicHospitals: builder.query<
      { data: PublicHospital[]; pagination: HospitalsPagination },
      { search?: string; page?: number; limit?: number } | void
    >({
      query: (params) => {
        const page = Math.max(1, params?.page ?? 1)
        const limit = Math.min(50, Math.max(1, params?.limit ?? 9))
        const search = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })
        if (params?.search?.trim()) search.set('search', params.search.trim())
        return `/company/public-hospitals?${search.toString()}`
      },
      transformResponse: (response: HospitalsListApi) => {
        const data = response.data ?? response.result ?? []
        return {
          data: Array.isArray(data) ? data : [],
          pagination: response.pagination ?? {
            total: Array.isArray(data) ? data.length : 0,
            page: 1,
            limit: 9,
            totalPages: 1,
          },
        }
      },
      keepUnusedDataFor: 120,
      providesTags: ['Hospitals'],
    }),
    getPublicHospital: builder.query<PublicHospital, string>({
      query: (tenantId) =>
        `/company/public-hospitals/${encodeURIComponent(tenantId)}`,
      transformResponse: (response: HospitalDetailApi) => {
        const hospital = response.data ?? response.result
        if (!hospital) throw new Error('Hospital not found')
        return hospital
      },
      providesTags: (_r, _e, id) => [{ type: 'Hospital', id }],
    }),
    /** Flatten doctors from a few hospital details (cached; one shared key). */
    getPublicCareTeam: builder.query<CareTeamDoctor[], { limit?: number } | void>(
      {
        // Same cache for every page — avoids 15× duplicate SaaS calls
        serializeQueryArgs: () => 'careTeam',
        async queryFn(arg, _api, _extra, baseQuery) {
          const limit = arg?.limit ?? 24
          const listRes = await baseQuery({
            url: '/company/public-hospitals?page=1&limit=9',
          })
          if (listRes.error) {
            return { error: listRes.error }
          }

          const payload = listRes.data as HospitalsListApi
          const hospitals = payload.data ?? payload.result ?? []
          const targets = hospitals
            .filter((h) => Number(h._count?.professionalProfiles || 0) > 0)
            .slice(0, 3)

          if (targets.length === 0) {
            return { data: [] }
          }

          const details = await Promise.all(
            targets.map((h) =>
              baseQuery({
                url: `/company/public-hospitals/${encodeURIComponent(h.tenantId)}`,
              }),
            ),
          )

          const doctors: CareTeamDoctor[] = []
          for (let i = 0; i < details.length; i++) {
            const res = details[i]
            if (res.error) continue
            const hospital =
              (res.data as HospitalDetailApi).data ??
              (res.data as HospitalDetailApi).result ??
              targets[i]
            for (const doctor of hospital.doctors ?? []) {
              doctors.push({
                ...doctor,
                hospitalId: hospital.tenantId,
                hospitalName: hospital.companyName,
                city: hospital.city,
                country: hospital.country,
              })
            }
          }

          return { data: doctors.slice(0, limit) }
        },
        keepUnusedDataFor: 120,
        providesTags: ['CareTeam'],
      },
    ),
  }),
})

export const {
  useGetPublicHospitalsQuery,
  useGetPublicHospitalQuery,
  useGetPublicCareTeamQuery,
} = hospitalsApi
