import { useEffect, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import axios from "axios"
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { env } from "@/config/env"
import { clearCsrfToken, ensureCsrfToken } from "@/lib/csrf"
import { setUser } from "@/Redex/service/auth/Userinfo"
import { AppDispatch } from "@/Redex/store/store"
import AuthLayout from "./AuthLayout"
import GoogleAuth from "./GoogleAuth"

interface LoginResponse {
  isSuccess: boolean
  message: string
  result?: {
    user: {
      userid: string
      email: string
      phone?: string | null
      fullName: string
      role: string
      avatarUrl?: string | null
      picture?: string | null
      emailVerified: boolean
      phoneVerified: boolean
    }
    accessToken: string
    refreshToken: string
  }
}

export default function SignInPage() {
  const location = useLocation()
  const prefill =
    (location.state as { email?: string; password?: string } | null) || {}

  const [email, setEmail] = useState(prefill.email ?? "")
  const [password, setPassword] = useState(prefill.password ?? "")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const postLogin = async (forceCsrf = false) => {
        const csrf = await ensureCsrfToken(forceCsrf)
        return axios.post<LoginResponse>(
          `${env.apiUrl}/user/login`,
          { email: email.trim(), password },
          { withCredentials: true, headers: { "x-csrf-token": csrf } }
        )
      }

      let response
      try {
        response = await postLogin()
      } catch (first: unknown) {
        const status = axios.isAxiosError(first) ? first.response?.status : undefined
        const message = axios.isAxiosError(first)
          ? String((first.response?.data as { message?: string } | undefined)?.message || "")
          : ""
        if (status === 403 && /csrf/i.test(message)) {
          clearCsrfToken()
          response = await postLogin(true)
        } else {
          throw first
        }
      }

      const { data } = response

      if (!data.isSuccess || !data.result) {
        throw new Error(data.message || "Login failed")
      }

      const { user, accessToken, refreshToken } = data.result

      dispatch(
        setUser({
          userId: user.userid,
          name: user.fullName,
          email: user.email,
          image: user.avatarUrl ?? user.picture ?? "",
          accessToken,
          refreshToken,
          role: user.role,
          phone: user.phone ?? "",
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        })
      )

      setSuccess("Signed in. Redirecting…")
      const next =
        String(user.role || "").toUpperCase() === "SUPER_ADMIN"
          ? "/admin"
          : "/dashboard"
      setTimeout(() => navigate(next), 400)
    } catch (err: any) {
      setSuccess(null)
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email or password"
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")
    const err = params.get("error")
    const userParam = params.get("user")

    if (err) {
      setError(decodeURIComponent(err))
      setIsLoading(false)
    } else if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam))
        localStorage.setItem("accessToken", token)
        localStorage.setItem("user", JSON.stringify(user))
        navigate(
          String(user.role || "").toUpperCase() === "SUPER_ADMIN"
            ? "/admin"
            : "/dashboard",
        )
      } catch {
        setError("Failed to process authentication data")
        setIsLoading(false)
      }
    }
  }, [navigate])

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in with your email and password"
    >
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isLoading}
              className="h-11 border-blue-100 bg-brand-bg pl-10 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={isLoading}
              className="h-11 border-blue-100 bg-brand-bg pl-10 pr-10 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-dark"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-blue-100" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-blue-100" />
      </div>

      <GoogleAuth
        onError={(message) => setError(message)}
        onSuccess={() => setSuccess("Opening Google…")}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/SignUp" className="font-medium text-primary hover:text-primary/80">
          Create one
        </Link>
      </p>
    </AuthLayout>
  )
}
