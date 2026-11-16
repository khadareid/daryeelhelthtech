import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Phone } from "lucide-react"
import { PhoneNumberInput } from "@/components/forms/PhoneNumberInput"
import { Button } from "@/components/ui/button"
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/Redex/service/users/UsersApi"
import { setUser } from "@/Redex/service/auth/Userinfo"
import { RootState } from "@/Redex/store/store"
import { isValidPhone, normalizePhone } from "@/lib/phone"

type NavState = { requirePhone?: boolean } | null

function extractApiMessage(err: unknown): string {
  if (!err || typeof err !== "object") return ""
  const e = err as {
    data?: { message?: string } | string
    error?: string
    status?: number | string
  }
  if (typeof e.data === "string") return e.data
  if (e.data && typeof e.data === "object" && e.data.message) {
    return String(e.data.message)
  }
  if (typeof e.error === "string" && e.error !== "FETCH_ERROR") return e.error
  return ""
}

/**
 * After register/login: if phone is missing, show this modal immediately.
 * Existing users who already have a phone are not interrupted.
 */
export function PhoneRequiredGate() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSelector((s: RootState) => s.userInfo)
  const navState = (location.state as NavState) || null
  const forcePrompt = Boolean(navState?.requirePhone)

  const { data: profile, isLoading, refetch } = useGetMyProfileQuery(undefined, {
    skip: !session.isAuthenticated,
  })
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()
  const [phone, setPhone] = useState("+252")

  const sessionPhone = String(session.phone || "").trim()
  const profilePhone = String(profile?.phone || "").trim()

  const needsPhone =
    Boolean(session.isAuthenticated) &&
    !sessionPhone &&
    (forcePrompt || isLoading || !profilePhone)

  useEffect(() => {
    if (forcePrompt && location.pathname.startsWith("/dashboard")) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      })
    }
  }, [forcePrompt, location.pathname, location.search, navigate])

  if (!needsPhone) return null

  const onSave = async () => {
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid phone number, e.g. +252 63 XXX XXXX")
      return
    }
    const normalized = normalizePhone(phone)
    try {
      const user = await updateProfile({ phone: normalized }).unwrap()
      dispatch(
        setUser({
          userId: user.userid || session.userId,
          name: user.fullName || session.name,
          email: user.email || session.email,
          phone: user.phone || normalized,
          image: user.avatarUrl ?? user.picture ?? session.image,
          role: user.role || session.role,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        }),
      )
      toast.success("Phone number saved")
      refetch()
    } catch (err: unknown) {
      toast.error(extractApiMessage(err) || "Could not save phone number")
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-brand-dark/50 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-gate-title"
        className="w-full max-w-md rounded-[1.5rem] border border-blue-100 bg-white p-6 shadow-xl"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-primary">
          <Phone className="h-5 w-5" />
        </div>
        <h2
          id="phone-gate-title"
          className="mt-4 font-heading text-xl font-bold text-brand-dark"
        >
          Add your phone number
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Registered successfully. Please enter your phone number to continue.
        </p>

        <div className="mt-5">
          <PhoneNumberInput
            value={phone}
            onChange={setPhone}
            required
            helperText="Example: +252 63 XXX XXXX"
          />
        </div>

        <Button
          className="mt-5 h-11 w-full"
          disabled={saving}
          onClick={() => void onSave()}
        >
          {saving ? "Saving…" : "Save & continue"}
        </Button>
      </div>
    </div>
  )
}
