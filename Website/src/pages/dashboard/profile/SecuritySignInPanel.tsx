import { useMemo, useState, type FormEvent } from "react"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import type { RootState } from "@/Redex/store/store"
import {
  AlertTriangle,
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Laptop,
  Mail,
  Phone,
  Shield,
  Smartphone,
  Watch,
} from "lucide-react"
import { PhoneNumberInput } from "@/components/forms/PhoneNumberInput"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useChangeMyPasswordMutation } from "@/Redex/service/users/UsersApi"
import {
  useGetSecurityActivityQuery,
  useGetSecuritySessionsQuery,
  useGetSecurityStatusQuery,
  useRevokeOtherSessionsMutation,
  useRevokeSecuritySessionMutation,
  useUpdateRecoveryEmailMutation,
  useUpdateSecurityPhoneMutation,
  type SecurityActivityItem,
} from "@/Redex/service/security/SecurityApi"
import {
  formatPhoneDisplay,
  isValidPhone,
  normalizePhone,
} from "@/lib/phone"

type Props = {
  email?: string | null
  phone?: string | null
  onProfileRefresh?: () => void
}

function fmtWhen(d?: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function fmtDate(d?: string | null) {
  if (!d) return "—"
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const SAMPLE_ACTIVITY: SecurityActivityItem[] = [
  {
    id: "sample-1",
    type: "SAMPLE",
    title: "Sample · New sign-in on Windows",
    operatingSystem: "Windows",
    browser: "Chrome",
    location: "Hargeisa",
    createdAt: new Date().toISOString(),
  },
]

export function SecuritySignInPanel({
  email,
  phone,
  onProfileRefresh,
}: Props) {
  const refreshToken = useSelector(
    (s: RootState) => s.userInfo.refreshToken || "",
  )
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } =
    useGetSecurityStatusQuery()
  const { data: activity = [], isLoading: activityLoading } =
    useGetSecurityActivityQuery(40)
  const { data: sessions = [], isLoading: sessionsLoading } =
    useGetSecuritySessionsQuery(
      refreshToken ? { refreshToken } : undefined,
    )
  const [revokeSession, { isLoading: revoking }] =
    useRevokeSecuritySessionMutation()
  const [revokeOthers, { isLoading: revokingOthers }] =
    useRevokeOtherSessionsMutation()
  const [updatePhone, { isLoading: savingPhone }] =
    useUpdateSecurityPhoneMutation()
  const [updateRecovery, { isLoading: savingRecovery }] =
    useUpdateRecoveryEmailMutation()
  const [changePassword, { isLoading: changingPw }] =
    useChangeMyPasswordMutation()

  const [activityOpen, setActivityOpen] = useState(false)
  const [phoneEditing, setPhoneEditing] = useState(false)
  const [phoneDraft, setPhoneDraft] = useState(phone || "+252")
  const [recoveryEditing, setRecoveryEditing] = useState(false)
  const [recoveryDraft, setRecoveryDraft] = useState("")
  const [pw, setPw] = useState({
    current: "",
    next: "",
    confirm: "",
  })

  const realActivity = activity.filter((a) => a.type !== "SAMPLE")
  const showSample = !activityLoading && realActivity.length === 0
  const previewActivity = showSample
    ? SAMPLE_ACTIVITY
    : realActivity.slice(0, 4)
  const fullActivity = showSample ? SAMPLE_ACTIVITY : realActivity

  const protectedOk = Boolean(status?.protected)
  const recommendations = status?.recommendations || []

  const recoveryPhone = status?.recoveryPhone || phone
  const recoveryEmail = status?.recoveryEmail

  const currentSession = useMemo(
    () => sessions.find((s) => s.isCurrent) || sessions[0],
    [sessions],
  )

  const savePhone = async () => {
    if (!isValidPhone(phoneDraft)) {
      toast.error("Enter a valid phone number, e.g. +252 63 XXX XXXX")
      return
    }
    try {
      await updatePhone({ phone: normalizePhone(phoneDraft) }).unwrap()
      toast.success("Phone updated")
      setPhoneEditing(false)
      refetchStatus()
      onProfileRefresh?.()
    } catch (err: unknown) {
      toast.error(apiErr(err) || "Could not update phone")
    }
  }

  const saveRecovery = async () => {
    const value = recoveryDraft.trim()
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Enter a valid recovery email")
      return
    }
    try {
      await updateRecovery({ recoveryEmail: value || null }).unwrap()
      toast.success(value ? "Recovery email added" : "Recovery email removed")
      setRecoveryEditing(false)
      refetchStatus()
    } catch (err: unknown) {
      toast.error(apiErr(err) || "Could not update recovery email")
    }
  }

  const onChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (pw.next.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match")
      return
    }
    try {
      await changePassword({
        currentPassword: pw.current,
        newPassword: pw.next,
      }).unwrap()
      toast.success("Password changed")
      setPw({ current: "", next: "", confirm: "" })
      refetchStatus()
    } catch (err: unknown) {
      toast.error(apiErr(err) || "Could not change password")
    }
  }

  const onRevokeOthers = async () => {
    if (
      !window.confirm(
        "Sign out of all other devices? This device will stay signed in.",
      )
    ) {
      return
    }
    try {
      const res = await revokeOthers(
        refreshToken ? { refreshToken } : undefined,
      ).unwrap()
      toast.success(
        res?.revokedCount
          ? `All other devices have been signed out (${res.revokedCount}).`
          : "All other devices have been signed out.",
      )
    } catch (err: unknown) {
      toast.error(apiErr(err) || "Could not sign out other devices")
    }
  }

  const onRevokeOne = async (id: string, isCurrent?: boolean) => {
    if (isCurrent) {
      toast.error("Use Sign out from the menu to leave this device.")
      return
    }
    if (!window.confirm("Sign out this device?")) return
    try {
      await revokeSession({
        id,
        refreshToken: refreshToken || undefined,
      }).unwrap()
      toast.success("Device signed out")
    } catch (err: unknown) {
      toast.error(apiErr(err) || "Could not sign out device")
    }
  }

  if (statusLoading) {
    return <Skeleton className="h-96 rounded-3xl" />
  }

  return (
    <div className="space-y-4">
      <Card className="border-blue-100">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            Security & Sign-in
          </CardTitle>
          <CardDescription>
            {protectedOk
              ? "Your Daryeel account is protected"
              : "Strengthen your account security"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className={`rounded-xl border px-4 py-3 ${
              protectedOk
                ? "border-emerald-200 bg-emerald-50/80"
                : "border-amber-200 bg-amber-50/80"
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
              {protectedOk ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
              Security Checkup · Your account security
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {protectedOk
                ? "✓ Your account is protected"
                : "⚠ Action recommended"}
              {typeof status?.securityScore === "number"
                ? ` · Score ${status.securityScore}/100`
                : ""}
              {typeof status?.activeSessions === "number"
                ? ` · ${status.activeSessions} active session${status.activeSessions === 1 ? "" : "s"}`
                : ""}
            </p>
            {recommendations.length > 0 ? (
              <ul className="mt-2 list-inside list-disc text-xs text-amber-900/80">
                {recommendations.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-emerald-800">
                ✓ No recommended actions
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent security activity</CardTitle>
          <CardDescription>
            {showSample
              ? "No real events yet — sample preview for development"
              : "Real activity on your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activityLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : (
            <ul className="space-y-2">
              {previewActivity.map((item) => (
                <ActivityRow key={item.id} item={item} sample={showSample} />
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="outline"
            className="border-primary/20"
            onClick={() => setActivityOpen(true)}
          >
            Review security activity
          </Button>
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">How you sign in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInRow
            icon={<Phone className="h-4 w-4 text-primary" />}
            title="Phone Number"
            value={
              phone || recoveryPhone
                ? formatPhoneDisplay(phone || recoveryPhone || "")
                : "Not added"
            }
            status={phone || recoveryPhone ? "Added" : "Not added"}
            action={
              phoneEditing ? undefined : phone || recoveryPhone ? "Change number" : "Add phone number"
            }
            onAction={() => {
              setPhoneDraft(phone || recoveryPhone || "+252")
              setPhoneEditing(true)
            }}
          />
          {phoneEditing ? (
            <div className="space-y-2 rounded-xl border border-blue-100 bg-brand-bg p-3">
              <PhoneNumberInput
                label=""
                value={phoneDraft}
                onChange={setPhoneDraft}
                required
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingPhone}
                  onClick={savePhone}
                >
                  {savingPhone ? "Saving…" : "Save phone"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setPhoneEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}

          <SignInRow
            icon={<Mail className="h-4 w-4 text-primary" />}
            title="Email address"
            value={email || "—"}
            status="Primary email"
          />

          <div className="rounded-xl border border-blue-100 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-brand-dark">
                    Password
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {status?.passwordSet
                      ? "Password is set"
                      : "Password not set"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last changed · {fmtDate(status?.passwordChangedAt)}
                  </p>
                </div>
              </div>
            </div>
            <form
              onSubmit={onChangePassword}
              className="mt-3 grid gap-2 sm:grid-cols-2"
            >
              <div className="space-y-1 sm:col-span-2">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={pw.current}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, current: e.target.value }))
                  }
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={pw.next}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, next: e.target.value }))
                  }
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Confirm password</Label>
                <Input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) =>
                    setPw((p) => ({ ...p, confirm: e.target.value }))
                  }
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={changingPw}>
                  {changingPw ? "Updating…" : "Change password"}
                </Button>
              </div>
            </form>
          </div>

          <ComingSoonRow
            icon={<Shield className="h-4 w-4 text-primary" />}
            title="2-Step Verification"
            value={status?.twoFactorEnabled ? "On" : "Off"}
            action="Set up"
          />
          <ComingSoonRow
            icon={<Fingerprint className="h-4 w-4 text-primary" />}
            title="Passkeys"
            value={
              status?.passkeysCount
                ? `${status.passkeysCount} passkey(s)`
                : "No passkeys added"
            }
            action="Add passkey"
          />
          <ComingSoonRow
            icon={<Watch className="h-4 w-4 text-primary" />}
            title="Authenticator app"
            value={
              status?.authenticatorConfigured
                ? "Configured"
                : "Not configured"
            }
            action="Set up"
          />
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recovery options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignInRow
            icon={<Smartphone className="h-4 w-4 text-primary" />}
            title="Recovery phone"
            value={
              recoveryPhone
                ? formatPhoneDisplay(recoveryPhone)
                : "Not added"
            }
            status={recoveryPhone ? "Added" : "Not added"}
            action={
              recoveryPhone ? "Change number" : "Add phone number"
            }
            onAction={() => {
              setPhoneDraft(recoveryPhone || "+252")
              setPhoneEditing(true)
            }}
          />

          <SignInRow
            icon={<Mail className="h-4 w-4 text-primary" />}
            title="Recovery email"
            value={recoveryEmail || "Not added"}
            status={recoveryEmail ? "Added" : "Not added"}
            action={recoveryEmail ? "Change recovery email" : "Add recovery email"}
            onAction={() => {
              setRecoveryDraft(recoveryEmail || "")
              setRecoveryEditing(true)
            }}
          />
          {recoveryEditing ? (
            <div className="space-y-2 rounded-xl border border-blue-100 bg-brand-bg p-3">
              <Label>Recovery email</Label>
              <Input
                type="email"
                value={recoveryDraft}
                onChange={(e) => setRecoveryDraft(e.target.value)}
                placeholder="recovery@example.com"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={savingRecovery}
                  onClick={saveRecovery}
                >
                  {savingRecovery ? "Saving…" : "Save"}
                </Button>
                {recoveryEmail ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={savingRecovery}
                    onClick={async () => {
                      setRecoveryDraft("")
                      try {
                        await updateRecovery({ recoveryEmail: null }).unwrap()
                        toast.success("Recovery email removed")
                        setRecoveryEditing(false)
                        refetchStatus()
                      } catch (err: unknown) {
                        toast.error(apiErr(err) || "Could not remove")
                      }
                    }}
                  >
                    Remove
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setRecoveryEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Laptop className="h-4 w-4 text-primary" />
            Your devices
          </CardTitle>
          <CardDescription>Where you&apos;re signed in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionsLoading ? (
            <Skeleton className="h-28 rounded-xl" />
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active device sessions yet. Sign in again to start session
              tracking.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">
                      {s.device}
                      {s.isCurrent ? (
                        <Badge variant="secondary" className="ml-2">
                          This device
                        </Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[s.browser, s.operatingSystem].filter(Boolean).join(" · ") ||
                        "Daryeel"}
                      {s.location ? ` · ${s.location}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active · {fmtWhen(s.lastActiveAt)}
                    </p>
                  </div>
                  {!s.isCurrent ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={revoking}
                      onClick={() => onRevokeOne(s.id, s.isCurrent)}
                    >
                      Sign out
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-primary">
                      Current
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {currentSession ? (
            <p className="text-xs text-muted-foreground">
              This device · {[currentSession.operatingSystem, currentSession.browser]
                .filter(Boolean)
                .join(" · ") || currentSession.device}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="border-rose-200 text-rose-700 hover:bg-rose-50"
            disabled={revokingOthers || sessions.length < 2}
            onClick={onRevokeOthers}
          >
            {revokingOthers
              ? "Signing out…"
              : "Sign out of all other devices"}
          </Button>
        </CardContent>
      </Card>

      <Sheet open={activityOpen} onOpenChange={setActivityOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Security activity</SheetTitle>
            <SheetDescription>
              {showSample
                ? "Sample preview until real events are recorded"
                : "Complete history for your account"}
            </SheetDescription>
          </SheetHeader>
          <ul className="mt-4 space-y-2">
            {fullActivity.map((item) => (
              <ActivityRow key={item.id} item={item} sample={showSample} />
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function apiErr(err: unknown) {
  if (err && typeof err === "object" && "data" in err) {
    return String(
      (err as { data?: { message?: string } }).data?.message || "",
    )
  }
  return ""
}

function ActivityRow({
  item,
  sample,
}: {
  item: SecurityActivityItem
  sample?: boolean
}) {
  const meta = [
    item.operatingSystem || item.device,
    item.browser,
    item.location,
  ]
    .filter(Boolean)
    .join(" · ")
  return (
    <li className="rounded-xl border border-blue-100 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-brand-dark">{item.title}</p>
        {sample ? (
          <Badge variant="secondary" className="text-[10px]">
            Sample
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {fmtWhen(item.createdAt)}
        {meta ? ` · ${meta}` : ""}
      </p>
    </li>
  )
}

function SignInRow({
  icon,
  title,
  value,
  status,
  action,
  onAction,
}: {
  icon: React.ReactNode
  title: string
  value: string
  status?: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 px-3 py-2.5">
      <div className="flex min-w-0 gap-2">
        <span className="mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-dark">{title}</p>
          <p className="truncate text-sm text-muted-foreground">{value}</p>
          {status ? (
            <p className="text-xs text-muted-foreground">{status}</p>
          ) : null}
        </div>
      </div>
      {action && onAction ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-primary/20"
          onClick={onAction}
        >
          {action}
        </Button>
      ) : null}
    </div>
  )
}

function ComingSoonRow({
  icon,
  title,
  value,
  action,
}: {
  icon: React.ReactNode
  title: string
  value: string
  action: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-blue-100 px-3 py-2.5 opacity-90">
      <div className="flex gap-2">
        <span className="mt-0.5">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-brand-dark">{title}</p>
          <p className="text-sm text-muted-foreground">{value}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">Coming soon</Badge>
        <Button type="button" size="sm" variant="outline" disabled>
          {action}
        </Button>
      </div>
    </div>
  )
}
