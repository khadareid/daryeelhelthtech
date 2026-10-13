/**
 * Auth / account API (CSRF, login, profile, dashboard)
 * Hospitals / care-team public API (SaaS tenants) — different host!
 */
const AUTH_API = 'https://daryeel-healthtech-api.vercel.app/api/v1'
const SAAS_API =
  'https://daryeelsaashealthtech-api-seven.vercel.app/api/v1'

function trimSlash(url: string) {
  return url.replace(/\/$/, '')
}

export const env = {
  /** Login, CSRF, user profile, dashboard */
  apiUrl: trimSlash(import.meta.env.VITE_API_URL || AUTH_API),
  /** Public hospitals & clinicians — never auth host */
  saasApiUrl: trimSlash(import.meta.env.VITE_SAAS_API_URL || SAAS_API),
  appName: import.meta.env.VITE_APP_NAME ?? 'Daryeel',
  version: import.meta.env.VITE_APP_VERSION ?? '1.0.0',
}
