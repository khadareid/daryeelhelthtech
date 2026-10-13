import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { env } from '@/config/env'

/** Resolve path against SaaS host (never auth/healthtech). */
function saasUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = env.saasApiUrl
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

const raw = fetchBaseQuery({
  baseUrl: env.saasApiUrl,
  credentials: 'omit',
})

/**
 * Public SaaS API — no CSRF.
 * Always rewrites to env.saasApiUrl so hospital calls cannot hit auth API.
 */
export const saasBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  if (typeof args === 'string') {
    return raw(saasUrl(args), api, extraOptions)
  }
  return raw({ ...args, url: saasUrl(args.url || '') }, api, extraOptions)
}
