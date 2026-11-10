/**
 * Healthtech Auth / account / healthcare proxy API (CSRF, login, profile, dashboard, hospitals)
 * Production:
 *   Website  https://daryeelhelthtech.vercel.app
 *   API      https://daryeelhelthtech-api.vercel.app
 */
const AUTH_API = "https://daryeelhelthtech-api.vercel.app/api/v1"

function trimSlash(url: string) {
  return url.replace(/\/$/, "")
}

export const env = {
  /** Login, CSRF, user profile, dashboard, healthcare proxy */
  apiUrl: trimSlash(import.meta.env.VITE_API_URL || AUTH_API),
  websiteUrl: trimSlash(
    import.meta.env.VITE_WEBSITE_URL || "https://daryeelhelthtech.vercel.app"
  ),
  appName: import.meta.env.VITE_APP_NAME ?? "Daryeel",
  version: import.meta.env.VITE_APP_VERSION ?? "1.0.0",
}
