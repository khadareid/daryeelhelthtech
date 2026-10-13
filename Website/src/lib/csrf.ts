import { env } from '@/config/env'

const CSRF_COOKIE = 'csrf-token'
let memoryToken = ''
let pending: Promise<string> | null = null

function readCookie(name: string): string {
  if (typeof document === 'undefined') return ''
  const prefix = `${name}=`
  const row = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
  return row ? decodeURIComponent(row.slice(prefix.length)) : ''
}

export function clearCsrfToken(): void {
  memoryToken = ''
  pending = null
}

export async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) clearCsrfToken()
  if (memoryToken) return memoryToken

  // Same-origin only — cross-site API cookies are invisible to document.cookie
  const fromCookie = readCookie(CSRF_COOKIE)
  if (fromCookie && !forceRefresh) {
    memoryToken = fromCookie
    return memoryToken
  }

  if (!pending) {
    pending = fetch(`${env.apiUrl}/csrf`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          let detail = ''
          try {
            const body = await res.json()
            detail =
              typeof body?.message === 'string' ? ` (${body.message})` : ''
          } catch {
            /* ignore */
          }
          throw new Error(
            `Could not get a CSRF token from ${env.apiUrl}/csrf${detail}. Start the Backend on port 5000, or set VITE_API_URL to the auth API.`,
          )
        }
        const data = await res.json().catch(() => null)
        // Always prefer JSON body — works when Set-Cookie is blocked
        const token =
          (typeof data?.result?.csrfToken === 'string' &&
            data.result.csrfToken) ||
          readCookie(CSRF_COOKIE)
        if (!token) throw new Error('Could not get a CSRF token')
        memoryToken = token
        return token
      })
      .finally(() => {
        pending = null
      })
  }
  return pending
}
