/**
 * Direct SaaS browser calls are disabled.
 * All hospital discovery/booking must go through Healthtech `/api/v1/healthcare/*`.
 */
export function saasBaseQuery(): never {
  throw new Error(
    "Direct SaaS API access is disabled. Use HealthcareApi (/api/v1/healthcare/*) instead."
  )
}
