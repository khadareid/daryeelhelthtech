/** Country dial codes for registration / profile phone input. */
export const PHONE_COUNTRIES = [
  { code: "SO", dial: "+252", label: "Somalia / Somaliland (+252)" },
  { code: "ET", dial: "+251", label: "Ethiopia (+251)" },
  { code: "KE", dial: "+254", label: "Kenya (+254)" },
  { code: "DJ", dial: "+253", label: "Djibouti (+253)" },
  { code: "UG", dial: "+256", label: "Uganda (+256)" },
  { code: "TZ", dial: "+255", label: "Tanzania (+255)" },
  { code: "GB", dial: "+44", label: "United Kingdom (+44)" },
  { code: "US", dial: "+1", label: "United States (+1)" },
] as const

export type PhoneCountry = (typeof PHONE_COUNTRIES)[number]

/** Normalize to E.164-style +digits (e.g. +252634000100). */
export function normalizePhone(value: string): string {
  let digits = value.trim().replace(/[^\d+]/g, "")
  if (digits.startsWith("00")) digits = `+${digits.slice(2)}`
  if (!digits.startsWith("+")) digits = `+${digits.replace(/\D/g, "")}`
  return `+${digits.slice(1).replace(/\D/g, "")}`
}

export function isValidPhone(value: string): boolean {
  const phone = normalizePhone(value)
  return /^\+\d{8,15}$/.test(phone)
}

export function formatPhoneDisplay(value?: string | null): string {
  if (!value) return ""
  const phone = normalizePhone(value)
  if (!/^\+\d{8,15}$/.test(phone)) return value
  // +252 63 XXX XXXX style for Somali numbers
  if (phone.startsWith("+252") && phone.length >= 12) {
    const rest = phone.slice(4)
    return `+252 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`.trim()
  }
  return phone
}

/** Split stored E.164 into dial code + national number for the input UI. */
export function splitPhone(value?: string | null): {
  dial: string
  national: string
} {
  const phone = value ? normalizePhone(value) : ""
  if (!phone || phone === "+") {
    return { dial: "+252", national: "" }
  }
  const match = PHONE_COUNTRIES.find((c) => phone.startsWith(c.dial))
  if (match) {
    return { dial: match.dial, national: phone.slice(match.dial.length) }
  }
  // Unknown dial — treat first 1–3 digits after + as dial heuristically
  const m = phone.match(/^\+(\d{1,3})(\d*)$/)
  if (m) return { dial: `+${m[1]}`, national: m[2] }
  return { dial: "+252", national: phone.replace(/\D/g, "") }
}

export function joinPhone(dial: string, national: string): string {
  return normalizePhone(`${dial}${national.replace(/\D/g, "")}`)
}
