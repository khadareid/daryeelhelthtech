/** Persist auth session in localStorage (Remember me) or sessionStorage. */

const REMEMBER_KEY = "daryeel_remember"
const EMAIL_KEY = "daryeel_remember_email"
const AUTH_KEYS = ["userInfo", "accessToken", "refreshToken"] as const

export function getRememberMe(): boolean {
  if (typeof window === "undefined") return true
  const v = localStorage.getItem(REMEMBER_KEY)
  return v !== "0"
}

export function setRememberMe(remember: boolean) {
  if (typeof window === "undefined") return
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0")
}

export function getRememberedEmail(): string {
  if (typeof window === "undefined") return ""
  return localStorage.getItem(EMAIL_KEY) || ""
}

export function setRememberedEmail(email: string | null) {
  if (typeof window === "undefined") return
  if (email?.trim()) localStorage.setItem(EMAIL_KEY, email.trim())
  else localStorage.removeItem(EMAIL_KEY)
}

function activeStore(): Storage {
  return getRememberMe() ? localStorage : sessionStorage
}

export function readAuthItem(key: (typeof AUTH_KEYS)[number]): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

export function writeAuthItem(
  key: (typeof AUTH_KEYS)[number],
  value: string
) {
  if (typeof window === "undefined") return
  const store = activeStore()
  const other = store === localStorage ? sessionStorage : localStorage
  store.setItem(key, value)
  other.removeItem(key)
}

export function clearAuthItems() {
  if (typeof window === "undefined") return
  for (const key of AUTH_KEYS) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}
