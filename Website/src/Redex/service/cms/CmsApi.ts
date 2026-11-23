import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapResult } from "@/Redex/lib/ownedApi"
import type { ApiResponse } from "@/Redex/types/Types"

export type SiteBranding = {
  name: string
  appName: string
  tagline: string
  description: string
  url: string
  supportEmail: string
  supportPhone: string
  location: string
  address?: string
}

export type CmsHighlight = { title: string; description?: string }
export type CmsQuote = { text: string; author?: string; role?: string }
export type CmsCta = {
  title: string
  description?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
}

export type CmsPage = {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  summary?: string | null
  heroImageUrl?: string | null
  body?: unknown
  highlights?: CmsHighlight[] | null
  quote?: CmsQuote | null
  cta?: CmsCta | null
  locale: string
  status: "DRAFT" | "PUBLISHED"
  publishedAt?: string | null
  sortOrder: number
  updatedAt?: string
}

export type TeamMember = {
  id: string
  slug: string
  fullName: string
  title: string
  department?: string | null
  category:
    | "BOARD"
    | "EXECUTIVE"
    | "DEPARTMENT"
    | "STAFF"
    | "PARTNER"
    | "SPONSOR"
    | "VOLUNTEER"
  bio?: string | null
  email?: string | null
  phone?: string | null
  photoUrl?: string | null
  expertise: string[]
  education?: string | null
  yearsExperience?: number | null
  socialLinks?: Record<string, string> | null
  sortOrder: number
  isPublished: boolean
  isFeatured: boolean
}

export type TeamGrouped = {
  members: TeamMember[]
  groups: Partial<Record<TeamMember["category"], TeamMember[]>>
  counts: {
    board: number
    executive: number
    department: number
    staff: number
    partner: number
    sponsor: number
    volunteer: number
    total: number
  }
}

export type CmsBundle = {
  branding: SiteBranding
  pages: CmsPage[]
  leadershipPage: CmsPage | null
  team: TeamGrouped
}

export type CmsPublicSettings = {
  branding: SiteBranding
  settings: Record<string, unknown>
}

export const cmsApi = createApi({
  reducerPath: "cmsApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["CmsBundle", "CmsPages", "CmsTeam", "CmsSettings"],
  endpoints: (builder) => ({
    getCmsBundle: builder.query<CmsBundle, void>({
      query: () => ({ url: "/cms/bundle" }),
      transformResponse: (r: ApiResponse<CmsBundle>) => unwrapResult(r),
      providesTags: ["CmsBundle"],
    }),

    getPublicCmsSettings: builder.query<CmsPublicSettings, void>({
      query: () => ({ url: "/cms/settings" }),
      transformResponse: (r: ApiResponse<CmsPublicSettings>) => unwrapResult(r),
      providesTags: ["CmsSettings"],
    }),

    getPublicCmsPage: builder.query<CmsPage, string>({
      query: (slug) => ({ url: `/cms/pages/${slug}` }),
      transformResponse: (r: ApiResponse<CmsPage>) => unwrapResult(r),
      providesTags: (_r, _e, slug) => [{ type: "CmsPages", id: slug }],
    }),

    getPublicTeam: builder.query<TeamGrouped, void>({
      query: () => ({ url: "/cms/team" }),
      transformResponse: (r: ApiResponse<TeamGrouped>) => unwrapResult(r),
      providesTags: ["CmsTeam"],
    }),

    getAdminCmsSettings: builder.query<CmsPublicSettings, void>({
      query: () => ({ url: "/admin/cms/settings" }),
      transformResponse: (r: ApiResponse<CmsPublicSettings>) => unwrapResult(r),
      providesTags: ["CmsSettings"],
    }),

    updateCmsBranding: builder.mutation<SiteBranding, Partial<SiteBranding>>({
      query: (body) => ({
        url: "/admin/cms/settings/branding",
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<SiteBranding>) => unwrapResult(r),
      invalidatesTags: ["CmsSettings", "CmsBundle"],
    }),

    getAdminCmsPages: builder.query<CmsPage[], void>({
      query: () => ({ url: "/admin/cms/pages" }),
      transformResponse: (r: ApiResponse<CmsPage[]>) => unwrapResult(r),
      providesTags: ["CmsPages"],
    }),

    ensureCmsPages: builder.mutation<CmsPage[], void>({
      query: () => ({ url: "/admin/cms/pages/ensure", method: "POST" }),
      transformResponse: (r: ApiResponse<CmsPage[]>) => unwrapResult(r),
      invalidatesTags: ["CmsPages", "CmsBundle"],
    }),

    createCmsPage: builder.mutation<CmsPage, Partial<CmsPage>>({
      query: (body) => ({ url: "/admin/cms/pages", method: "POST", body }),
      transformResponse: (r: ApiResponse<CmsPage>) => unwrapResult(r),
      invalidatesTags: ["CmsPages", "CmsBundle"],
    }),

    updateCmsPage: builder.mutation<
      CmsPage,
      { id: string; body: Partial<CmsPage> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/cms/pages/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<CmsPage>) => unwrapResult(r),
      invalidatesTags: ["CmsPages", "CmsBundle"],
    }),

    deleteCmsPage: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/cms/pages/${id}`, method: "DELETE" }),
      invalidatesTags: ["CmsPages", "CmsBundle"],
    }),

    getAdminTeam: builder.query<TeamMember[], { category?: string } | void>({
      query: (params) => ({
        url: "/admin/cms/team",
        params: params ?? undefined,
      }),
      transformResponse: (r: ApiResponse<TeamMember[]>) => unwrapResult(r),
      providesTags: ["CmsTeam"],
    }),

    createTeamMember: builder.mutation<TeamMember, Partial<TeamMember>>({
      query: (body) => ({ url: "/admin/cms/team", method: "POST", body }),
      transformResponse: (r: ApiResponse<TeamMember>) => unwrapResult(r),
      invalidatesTags: ["CmsTeam", "CmsBundle"],
    }),

    updateTeamMember: builder.mutation<
      TeamMember,
      { id: string; body: Partial<TeamMember> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/cms/team/${id}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<TeamMember>) => unwrapResult(r),
      invalidatesTags: ["CmsTeam", "CmsBundle"],
    }),

    deleteTeamMember: builder.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/cms/team/${id}`, method: "DELETE" }),
      invalidatesTags: ["CmsTeam", "CmsBundle"],
    }),
  }),
})

export const {
  useGetCmsBundleQuery,
  useGetPublicCmsSettingsQuery,
  useGetPublicCmsPageQuery,
  useGetPublicTeamQuery,
  useGetAdminCmsSettingsQuery,
  useUpdateCmsBrandingMutation,
  useGetAdminCmsPagesQuery,
  useEnsureCmsPagesMutation,
  useCreateCmsPageMutation,
  useUpdateCmsPageMutation,
  useDeleteCmsPageMutation,
  useGetAdminTeamQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
} = cmsApi
