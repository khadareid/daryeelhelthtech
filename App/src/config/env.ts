/** Auth / profile / appointments / chat (healthtech API) */
const AUTH_API = 'https://daryeel-healthtech-api.vercel.app/api/v1';
/** Public hospitals & SaaS care-team */
const SAAS_API =
  'https://daryeelsaashealthtech-api-seven.vercel.app/api/v1';

function trimSlash(url: string) {
  return url.replace(/\/$/, '');
}

export const env = {
  /** Login, CSRF, profile, booking, messages */
  apiUrl: trimSlash(process.env.EXPO_PUBLIC_API_URL || AUTH_API),
  /** Public hospitals only */
  saasApiUrl: trimSlash(process.env.EXPO_PUBLIC_SAAS_API_URL || SAAS_API),
  websiteUrl: 'https://daryeel-healthtech.vercel.app',
} as const;

/** @deprecated use env.apiUrl */
export const API_URL = env.apiUrl;
