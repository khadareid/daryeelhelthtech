import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Lock, Mail, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRegisterMutation } from "@/Redex/service/users/UsersApi"
import { setUser } from "@/Redex/service/auth/Userinfo"
import { AppDispatch } from "@/Redex/store/store"
import AuthLayout from "./AuthLayout"
import GoogleAuth from "./GoogleAuth"

export default function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const [register, { isLoading }] = useRegisterMutation()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role: "USER",
      }).unwrap()

      if (!res.isSuccess || !res.result) {
        throw new Error(res.message || "Registration failed")
      }

      const { user, accessToken, refreshToken } = res.result

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

      toast.success(res.message || "Account created")
      navigate("/dashboard")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Registration failed")
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
        <Link to="/signin" className="font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
