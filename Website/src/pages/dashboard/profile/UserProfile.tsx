import { useEffect, useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "sonner"
import {
  KeyRound,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RootState } from "@/Redex/store/store"
import {
  useChangeMyPasswordMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/Redex/service/users/UsersApi"
import { setUser } from "@/Redex/service/auth/Userinfo"
import { PatientIdCard } from "@/components/common/PatientIdCard"
import { BloodTypeEnum } from "@/Redex/types/Types"
import { useGetMedicalProfileQuery, useUpsertMedicalProfileMutation } from "@/Redex/service/health/HealthApi"
import { BLOOD_TYPE_OPTIONS, enumLabel, GENDER_OPTIONS } from "@/lib/enums"

function initials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function labelize(value?: string | null) {
  return enumLabel(value)
}

function fmtDate(d?: Date | string | null) {
  if (!d) return "—"
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString()
}

function toDateInput(d?: Date | string | null) {
  if (!d) return ""
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

export default function UserProfile() {
  const dispatch = useDispatch()
  const session = useSelector((state: RootState) => state.userInfo)
  const { data: profile, isLoading, isError, refetch } = useGetMyProfileQuery()
  const { data: medical } = useGetMedicalProfileQuery()
  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()
  const [changePassword, { isLoading: changingPw }] = useChangeMyPasswordMutation()
  const [upsertMedical] = useUpsertMedicalProfileMutation()

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    image: "",
    gender: "",
    dateOfBirth: "",
    country: "",
    region: "",
    city: "",
    bloodType: "UNKNOWN",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (!profile) return
    setForm((prev) => ({
      ...prev,
      fullName: profile.fullName ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? "",
      image: profile.avatarUrl ?? profile.picture ?? "",
      gender: profile.gender ?? "",
      dateOfBirth: toDateInput(profile.dateOfBirth),
      country: profile.country ?? "",
      region: profile.region ?? "",
      city: profile.city ?? "",
      bloodType: medical?.bloodType || profile.medicalProfile?.bloodType || "UNKNOWN",
    }))
  }, [profile, medical])

  const onChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const user = await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || null,
        gender: (form.gender as "MALE" | "FEMALE") || null,
        dateOfBirth: form.dateOfBirth || null,
        avatarUrl: form.image || null,
        country: form.country || null,
        region: form.region || null,
        city: form.city || null,
      }).unwrap()

      await upsertMedical({ bloodType: form.bloodType as keyof typeof BloodTypeEnum }).unwrap()

      dispatch(
        setUser({
          userId: user.userid || session.userId,
          name: user.fullName || form.fullName,
          email: user.email || form.email,
          phone: user.phone || form.phone,
          image: user.avatarUrl ?? user.picture ?? form.image,
          role: user.role || session.role,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
        })
      )
      toast.success("Profile updated")
      refetch()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not update profile")
    }
  }

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault()
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters")
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }).unwrap()
      toast.success("Password changed")
      setForm((p) => ({
        ...p,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not change password")
    }
  }

  if (isLoading) {
    return <Skeleton className="h-64 rounded-3xl" />
  }

  if (isError || !profile) {
    return (
      <Card className="border-rose-100">
        <CardContent className="p-6">
          <p className="text-sm text-rose-700">Could not load your profile.</p>
          <Button className="mt-3" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="border-blue-100 shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <Avatar className="h-16 w-16">
            <AvatarImage src={form.image || undefined} />
            <AvatarFallback className="bg-primary text-white">
              {initials(form.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-xl font-bold text-brand-dark">
              {form.fullName || "Your profile"}
            </h1>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{labelize(String(profile.role))}</Badge>
              {profile.healthId ? (
                <Badge variant="outline" className="font-mono">
                  {profile.healthId}
                </Badge>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <PatientIdCard healthId={profile.healthId} />

      <Tabs defaultValue="account">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-4">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserRound className="h-4 w-4 text-primary" />
                Profile details
              </CardTitle>
              <CardDescription>Update how you appear on Daryeel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name" value={form.fullName} onChange={(v) => onChange("fullName", v)} />
                <Field label="Email" value={form.email} disabled icon={<Mail className="h-3.5 w-3.5" />} />
                <Field label="Phone" value={form.phone} onChange={(v) => onChange("phone", v)} icon={<Phone className="h-3.5 w-3.5" />} />
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 text-sm"
                    value={form.gender}
                    onChange={(e) => onChange("gender", e.target.value)}
                  >
                    <option value="">—</option>
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Date of birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(v) => onChange("dateOfBirth", v)}
                />
                <div className="space-y-1.5">
                  <Label>Blood type</Label>
                  <select
                    className="h-10 w-full rounded-md border px-3 text-sm"
                    value={form.bloodType}
                    onChange={(e) => onChange("bloodType", e.target.value)}
                  >
                    {BLOOD_TYPE_OPTIONS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field label="Country" value={form.country} onChange={(v) => onChange("country", v)} />
                <Field label="Region" value={form.region} onChange={(v) => onChange("region", v)} />
                <Field label="City" value={form.city} onChange={(v) => onChange("city", v)} />
                <Field label="Avatar URL" value={form.image} onChange={(v) => onChange("image", v)} />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              </form>
              <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
                <Meta label="Language" value={profile.language || "so"} />
                <Meta label="Timezone" value={profile.timezone || "Africa/Mogadishu"} />
                <Meta label="Last login" value={fmtDate(profile.lastLoginAt)} />
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <KeyRound className="h-4 w-4 text-primary" />
                Change password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword} className="grid max-w-md gap-3">
                <Field
                  label="Current password"
                  type="password"
                  value={form.currentPassword}
                  onChange={(v) => onChange("currentPassword", v)}
                />
                <Field
                  label="New password"
                  type="password"
                  value={form.newPassword}
                  onChange={(v) => onChange("newPassword", v)}
                />
                <Field
                  label="Confirm password"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(v) => onChange("confirmPassword", v)}
                />
                <Button type="submit" disabled={changingPw}>
                  {changingPw ? "Updating…" : "Update password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  icon,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  disabled?: boolean
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </Label>
      <Input
        type={type}
        value={value}
        disabled={disabled || !onChange}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      />
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium text-brand-dark">{value}</dd>
    </div>
  )
}
