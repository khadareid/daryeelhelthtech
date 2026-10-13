import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"
import { env } from "@/config/env"
import { RootState } from "@/Redex/store/store"
import { clearCsrfToken, ensureCsrfToken } from "@/lib/csrf"

const rawBaseQuery = fetchBaseQuery({
  baseUrl: env.apiUrl,
  credentials: "include",
  prepareHeaders: async (headers, { getState }) => {
    const token = (getState() as RootState).userInfo?.accessToken
    if (token) headers.set("Authorization", `Bearer ${token}`)
    try {
      const csrf = await ensureCsrfToken()
      if (csrf) headers.set("x-csrf-token", csrf)
    } catch {
      /* the request itself will report a missing token */
    }
    return headers
  },
})

function isCsrfError(error: FetchBaseQueryError | undefined): boolean {
  if (!error || error.status !== 403) return false
  const data = error.data as { message?: string } | undefined
  return typeof data?.message === "string" && /csrf/i.test(data.message)
}

export const apiBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)
  if (isCsrfError(result.error)) {
    clearCsrfToken()
    try {
      await ensureCsrfToken(true)
    } catch {
      return result
    }
    result = await rawBaseQuery(args, api, extraOptions)
  }
  return result
}
