/**
 * Healthtech Auth / account / healthcare proxy API (CSRF, login, profile, dashboard, hospitals)
 * Production:
 *   Website  https://daryeelhelthtech.vercel.app
 *   API      https://daryeelhelthtech-api.vercel.app
 *   SaaS     https://daryeelsaashealthtech-api-seven.vercel.app
 */
const AUTH_API = "https://daryeelhelthtech-api.vercel.app/api/v1"
const SAAS_PUBLIC_API =
  "https://daryeelsaashealthtech-api-seven.vercel.app/api/v1"

function trimSlash(url: string) {
  return url.replace(/\/$/, "")
}

export const env = {
  /** Login, CSRF, user profile, dashboard, healthcare proxy */
  apiUrl: trimSlash(import.meta.env.VITE_API_URL || AUTH_API),
  /**
   * Public SaaS hospital directory (no integration key).
   * Used only as discovery fallback when Healthtech proxy is unavailable.
   */
  saasPublicApiUrl: trimSlash(
    import.meta.env.VITE_SAAS_PUBLIC_API_URL || SAAS_PUBLIC_API
  ),
  websiteUrl: trimSlash(
    import.meta.env.VITE_WEBSITE_URL || "https://daryeelhelthtech.vercel.app"
  ),
  appName: import.meta.env.VITE_APP_NAME ?? "Daryeel",
  version: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
}
