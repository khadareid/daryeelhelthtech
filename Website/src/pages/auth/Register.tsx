import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import axios from "axios"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setUser } from "@/Redex/service/auth/Userinfo"
import { AppDispatch } from "@/Redex/store/store"
import { env } from "@/config/env"
import { clearCsrfToken, ensureCsrfToken } from "@/lib/csrf"
import AuthLayout from "./AuthLayout"
import GoogleAuth from "./GoogleAuth"

type RegisterResponse = {
  isSuccess: boolean
  message?: string
  result?: {
    user: {
      userid: string
      email: string
      fullName: string
      role?: string
      phone?: string | null
      avatarUrl?: string | null
      picture?: string | null
      emailVerified?: boolean
      phoneVerified?: boolean
    }
    accessToken: string
    refreshToken: string
  }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const postRegister = async (forceCsrf = false) => {
        const csrf = await ensureCsrfToken(forceCsrf)
        return axios.post<RegisterResponse>(
          `${env.apiUrl}/user/register`,
          {
            fullName: fullName.trim(),
            email: email.trim(),
            password,
          },
          {
            withCredentials: true,
            headers: { "x-csrf-token": csrf },
          }
        )
      }

      let response
      try {
        response = await postRegister()
      } catch (first: unknown) {
        const status = axios.isAxiosError(first)
          ? first.response?.status
          : undefined
        const message = axios.isAxiosError(first)
          ? String(
              (first.response?.data as { message?: string } | undefined)
                ?.message || ""
            )
          : ""
        if (status === 403 && /csrf/i.test(message)) {
          clearCsrfToken()
          response = await postRegister(true)
        } else {
          throw first
        }
      }

      const data = response.data
      if (!data.isSuccess || !data.result) {
        throw new Error(data.message || "Registration failed")
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
          role: user.role || "USER",
          phone: user.phone ?? "",
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        })
      )

      toast.success(data.message || "Account created")
      navigate("/dashboard")
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg =
          (err.response?.data as { message?: string } | undefined)?.message ||
          err.message
        if (err.code === "ERR_NETWORK") {
          toast.error(
            "Could not reach the API. Check your connection and try again."
          )
        } else {
          toast.error(msg || "Registration failed")
        }
      } else {
        toast.error(err instanceof Error ? err.message : "Registration failed")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Name, email, and password. Everything else can wait."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Name</Label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
              autoComplete="name"
              disabled={isLoading}
              className="h-11 border-blue-100 bg-brand-bg pl-10 focus-visible:ring-primary"
            />
          </div>
        </div>

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
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              disabled={isLoading}
              className="h-11 border-blue-100 bg-brand-bg pl-10 pr-10 focus-visible:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-brand-dark"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-blue-100" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-blue-100" />
      </div>

      <GoogleAuth
        onError={(message) => toast.error(message)}
        onSuccess={() => undefined}
        isLoading={isLoading || googleLoading}
        setIsLoading={setGoogleLoading}
      />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          to="/signin"
          className="font-medium text-primary hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
