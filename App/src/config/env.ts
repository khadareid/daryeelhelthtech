/** Daryeel Healthtech API — same base as Website */
const AUTH_API = 'https://daryeel-healthtech-api.vercel.app/api/v1';

function trimSlash(url: string) {
  return url.replace(/\/$/, '');
}

export const env = {
  /** Auth, users, doctors, appointments, health records */
  apiUrl: trimSlash(process.env.EXPO_PUBLIC_API_URL || AUTH_API),
  websiteUrl: 'https://daryeel-healthtech.vercel.app',
} as const;

/** @deprecated use env.apiUrl */
export const API_URL = env.apiUrl;
