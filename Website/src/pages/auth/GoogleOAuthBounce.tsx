import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { env } from '@/config/env'

/**
 * Google Cloud sometimes still has the Website host as redirect URI:
 *   https://daryeel-healthtech.vercel.app/api/v1/auth/google/callback
 * The SPA cannot exchange the OAuth code — bounce to the real API callback
 * with the same query string so Passport can finish login.
 */
export default function GoogleOAuthBounce() {
  useEffect(() => {
    const { search, hash } = window.location
    const target = `${env.apiUrl}/auth/google/callback${search}${hash}`
    window.location.replace(target)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-brand-bg px-4 text-center text-brand-dark">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm font-medium">Finishing Google sign-in…</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Connecting securely to Daryeel. Please wait a moment.
      </p>
    </div>
  )
}
