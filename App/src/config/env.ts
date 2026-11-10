/** Daryeel Healthtech API
 * Production:
 *   App/Website  https://daryeelhelthtech.vercel.app
 *   API          https://daryeelhelthtech-api.vercel.app
 */
const AUTH_API = 'https://daryeelhelthtech-api.vercel.app/api/v1';
const LOCAL_API = 'http://localhost:5000/api/v1';

function trimSlash(url: string) {
  return url.replace(/\/+$/, '');
}

export const env = {
  /** Auth, users, doctors, appointments, health records, healthcare proxy */
  apiUrl: trimSlash(
    process.env.EXPO_PUBLIC_API_URL || LOCAL_API
  ),

  /** Production API */
  productionApiUrl: trimSlash(AUTH_API),

  /** Website */
  websiteUrl: 'https://daryeelhelthtech.vercel.app',
} as const;

/** @deprecated use env.apiUrl */
export const API_URL = env.apiUrl;