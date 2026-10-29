import { createApi } from '@reduxjs/toolkit/query/react'
import { saasBaseQuery } from '@/lib/saasBaseQuery'

export type PublicHospitalDoctor = {
  professionalProfileId: string
  /** SaaS User.userId — required for Healthtech → SaaS booking */
  doctorId?: string | null
  facilityId?: string | null
  facilityName?: string | null
  specialization?: string | null
  subSpecialty?: string | null
  publicBio?: string | null
  publicPhotoUrl?: string | null
  yearsOfExperience?: number | null
  languages?: string[] | null
  publicPhone?: string | null
  website?: string | null
  consultationFee?: string | number | null
  currency?: string | null
  averageRating?: number | null
  totalReviews?: number | null
  isVerified?: boolean
  department?: { name?: string | null } | null
  user?: { name?: string | null; picture?: string | null; userId?: string | null } | null
}

/** Prefer SaaS userId for booking / availability APIs */
export function saasDoctorId(doctor: PublicHospitalDoctor) {
  return doctor.doctorId || doctor.user?.userId || doctor.professionalProfileId
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
    /**
     * Flatten doctors from SaaS public hospitals (not Healthtech professionals).
     * Use `{ all: true }` on Doctors pages; homepage can pass a smaller limit.
     */
    getPublicCareTeam: builder.query<
      CareTeamDoctor[],
      { limit?: number; all?: boolean } | void
    >({
      serializeQueryArgs: ({ queryArgs }) =>
        queryArgs?.all
          ? 'careTeam-all'
          : `careTeam-${queryArgs?.limit ?? 24}`,
      async queryFn(arg, _api, _extra, baseQuery) {
        const all = Boolean(arg?.all)
        const limit = all ? 500 : Math.max(1, arg?.limit ?? 24)
        const pageSize = all ? 50 : 9
        const hospitals: PublicHospital[] = []

        let page = 1
        let totalPages = 1
        do {
          const listRes = await baseQuery({
            url: `/company/public-hospitals?page=${page}&limit=${pageSize}`,
          })
          if (listRes.error) {
            return { error: listRes.error }
          }
          const payload = listRes.data as HospitalsListApi
          const batch = payload.data ?? payload.result ?? []
          hospitals.push(...(Array.isArray(batch) ? batch : []))
          totalPages = payload.pagination?.totalPages ?? 1
          page += 1
        } while (all && page <= totalPages && page <= 10)

        const targets = hospitals.filter(
          (h) =>
            Number(h._count?.professionalProfiles || 0) > 0 ||
            (h.doctors && h.doctors.length > 0),
        )
        const fetchTargets = all ? targets : targets.slice(0, 6)

        if (fetchTargets.length === 0) {
          return { data: [] }
        }

        const details = await Promise.all(
          fetchTargets.map((h) =>
            baseQuery({
              url: `/company/public-hospitals/${encodeURIComponent(h.tenantId)}`,
            }),
          ),
        )

        const seen = new Set<string>()
        const doctors: CareTeamDoctor[] = []
        for (let i = 0; i < details.length; i++) {
          const res = details[i]
          if (res.error) continue
          const hospital =
            (res.data as HospitalDetailApi).data ??
            (res.data as HospitalDetailApi).result ??
            fetchTargets[i]
          for (const doctor of hospital.doctors ?? []) {
            const id =
              doctor.doctorId ||
              doctor.user?.userId ||
              doctor.professionalProfileId
            if (!id || seen.has(id)) continue
            seen.add(id)
            doctors.push({
              ...doctor,
              doctorId: id,
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
    }),
    /** Public SaaS slots — no Healthtech integration key required */
    getPublicDoctorAvailability: builder.query<
      { windows: any[]; slots: string[]; usingDefault?: boolean },
      { doctorId: string; date?: string }
    >({
      query: ({ doctorId, date }) => {
        const q = date ? `?date=${encodeURIComponent(date)}` : ''
        return `/company/public-doctors/${encodeURIComponent(doctorId)}/availability${q}`
      },
      transformResponse: (res: any) => {
        const data = res?.data ?? res?.result ?? {}
        return {
          windows: data.windows ?? [],
          slots: Array.isArray(data.slots) ? data.slots : [],
          usingDefault: Boolean(data.usingDefault),
        }
      },
      providesTags: ['CareTeam'],
    }),
  }),
})

export const {
  useGetPublicHospitalsQuery,
  useGetPublicHospitalQuery,
  useGetPublicCareTeamQuery,
  useGetPublicDoctorAvailabilityQuery,
} = hospitalsApi
