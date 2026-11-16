import { createApi } from "@reduxjs/toolkit/query/react"
import { apiBaseQuery } from "@/lib/apiBaseQuery"
import { unwrapList, unwrapResult } from "@/Redex/lib/ownedApi"
import type { ApiResponse } from "@/Redex/types/Types"

export type SecurityStatus = {
  securityScore: number
  protected: boolean
  phoneAdded: boolean
  emailAdded: boolean
  passwordSet: boolean
  passwordChangedAt?: string | null
  emailVerified?: boolean
  phoneVerified?: boolean
  twoFactorEnabled: boolean
  twoFactorMethod?: string | null
  passkeysCount: number
  authenticatorConfigured: boolean
  recoveryEmail?: string | null
  recoveryPhone?: string | null
  activeSessions: number
  lastLoginAt?: string | null
  lastLoginIp?: string | null
  recommendations: string[]
  comingSoon?: {
    twoFactor?: boolean
    passkeys?: boolean
    authenticatorApp?: boolean
    whatsappVerification?: boolean
  }
}

export type SecurityActivityItem = {
  id: string
  type: string
  title: string
  device?: string | null
  browser?: string | null
  operatingSystem?: string | null
  ipAddress?: string | null
  location?: string | null
  createdAt: string
}

export type SecuritySession = {
  id: string
  device: string
  browser?: string | null
  operatingSystem?: string | null
  deviceType?: string | null
  ipAddress?: string | null
  location?: string | null
  lastActiveAt?: string | null
  createdAt?: string | null
  isCurrent?: boolean
}

export const securityApi = createApi({
  reducerPath: "securityApi",
  baseQuery: apiBaseQuery,
  tagTypes: ["SecurityStatus", "SecurityActivity", "SecuritySessions"],
  endpoints: (builder) => ({
    getSecurityStatus: builder.query<SecurityStatus, void>({
      query: () => ({ url: "/security/status", method: "GET" }),
      transformResponse: (res: ApiResponse<SecurityStatus>) => unwrapResult(res),
      providesTags: ["SecurityStatus"],
    }),

    getSecurityActivity: builder.query<SecurityActivityItem[], number | void>({
      query: (limit) => ({
        url: "/security/activity",
        method: "GET",
        params: { limit: limit ?? 30 },
      }),
      transformResponse: (
        res: ApiResponse<SecurityActivityItem[] | { items: SecurityActivityItem[] }>,
      ) => {
        const raw = unwrapResult(res) as
          | SecurityActivityItem[]
          | { items: SecurityActivityItem[] }
        if (Array.isArray(raw)) return raw
        if (raw && typeof raw === "object" && "items" in raw) return raw.items
        return unwrapList(res as ApiResponse<SecurityActivityItem[]>)
      },
      providesTags: ["SecurityActivity"],
    }),

    getSecuritySessions: builder.query<
      SecuritySession[],
      { refreshToken?: string } | void
    >({
      query: (arg) => ({
        url: "/security/sessions",
        method: "GET",
        params: arg?.refreshToken
          ? { refreshToken: arg.refreshToken }
          : undefined,
      }),
      transformResponse: (
        res: ApiResponse<SecuritySession[] | { items: SecuritySession[] }>,
      ) => {
        const raw = unwrapResult(res) as
          | SecuritySession[]
          | { items: SecuritySession[] }
        if (Array.isArray(raw)) return raw
        if (raw && typeof raw === "object" && "items" in raw) return raw.items
        return unwrapList(res as ApiResponse<SecuritySession[]>)
      },
      providesTags: ["SecuritySessions"],
    }),

    revokeSecuritySession: builder.mutation<
      { revoked: boolean },
      { id: string; refreshToken?: string }
    >({
      query: ({ id, refreshToken }) => ({
        url: `/security/sessions/${id}`,
        method: "DELETE",
        body: refreshToken ? { refreshToken } : {},
      }),
      transformResponse: (res: ApiResponse<{ revoked: boolean }>) =>
        unwrapResult(res),
      invalidatesTags: ["SecuritySessions", "SecurityActivity", "SecurityStatus"],
    }),

    revokeOtherSessions: builder.mutation<
      { revokedCount: number },
      { refreshToken?: string } | void
    >({
      query: (body) => ({
        url: "/security/sessions/revoke-others",
        method: "POST",
        body: body?.refreshToken ? { refreshToken: body.refreshToken } : {},
      }),
      transformResponse: (res: ApiResponse<{ revokedCount: number }>) =>
        unwrapResult(res),
      invalidatesTags: ["SecuritySessions", "SecurityActivity", "SecurityStatus"],
    }),

    updateSecurityPhone: builder.mutation<
      { phone?: string | null },
      { phone: string }
    >({
      query: (body) => ({
        url: "/security/phone",
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiResponse<{ phone?: string | null }>) =>
        unwrapResult(res),
      invalidatesTags: ["SecurityStatus", "SecurityActivity"],
    }),

    updateSecurityEmail: builder.mutation<
      { email?: string },
      { email: string }
    >({
      query: (body) => ({
        url: "/security/email",
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiResponse<{ email?: string }>) =>
        unwrapResult(res),
      invalidatesTags: ["SecurityStatus", "SecurityActivity"],
    }),

    updateRecoveryEmail: builder.mutation<
      { recoveryEmail?: string | null },
      { recoveryEmail: string | null }
    >({
      query: (body) => ({
        url: "/security/recovery-email",
        method: "PATCH",
        body,
      }),
      transformResponse: (res: ApiResponse<{ recoveryEmail?: string | null }>) =>
        unwrapResult(res),
      invalidatesTags: ["SecurityStatus", "SecurityActivity"],
    }),
  }),
})

export const {
  useGetSecurityStatusQuery,
  useGetSecurityActivityQuery,
  useGetSecuritySessionsQuery,
  useRevokeSecuritySessionMutation,
  useRevokeOtherSessionsMutation,
  useUpdateSecurityPhoneMutation,
  useUpdateSecurityEmailMutation,
  useUpdateRecoveryEmailMutation,
} = securityApi
