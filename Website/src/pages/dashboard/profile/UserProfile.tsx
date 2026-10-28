import { useEffect, useState, type FormEvent } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  Bell,
  Calendar,
  Camera,
  CheckCircle2,
  Droplet,
  FlaskConical,
  KeyRound,
  Mail,
  Phone,
  Pill,
  Save,
  Shield,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RootState } from "@/Redex/store/store"
import {
  useChangeMyPasswordMutation,
  useChangeMyRoleMutation,
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
} from "@/Redex/service/users/UsersApi"
import { setUser } from "@/Redex/service/auth/Userinfo"
import { User } from "@/Redex/types/Types"

/** Visible professional roles only — USER / PATIENT / RECEPTIONIST hidden from UI */
const ROLES = [
  "DOCTOR",
  "NURSE",
  "MIDWIFE",
  "LAB_TECH",
  "PHARMACIST",
] as const

const BLOOD_TYPES = [
  "UNKNOWN",
  "A_POSITIVE",
  "A_NEGATIVE",
  "B_POSITIVE",
  "B_NEGATIVE",
  "AB_POSITIVE",
  "AB_NEGATIVE",
  "O_POSITIVE",
  "O_NEGATIVE",
] as const

type ProfileUser = User & {
  _count?: {
    appointments?: number
    prescriptions?: number
    labOrders?: number
    documents?: number
    notifications?: number
    healthRecords?: number
    vitalSigns?: number
    consentsGranted?: number
  }
}

function initials(name?: string) {
  if (!name) return "U"
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}

function labelize(value?: string | null) {
  if (!value) return "—"
  const upper = value.toUpperCase()
  // Hide raw USER / PATIENT / RECEPTIONIST labels in the UI
  if (upper === "USER" || upper === "PATIENT") return "Member"
  if (upper === "RECEPTIONIST") return "Staff"
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtDate(d?: Date | string | null) {
  if (!d) return "—"
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString()
}

function profileErrorText(error: unknown) {
  if (!error || typeof error !== "object") return "Could not load your profile"
  const body = error as { data?: { message?: string }; error?: string; status?: number | string }
  if (body.data?.message) return body.data.message
  if (body.status === "FETCH_ERROR") return "The health server is not responding. Start it, then retry."
  if (typeof body.error === "string" && body.error) return body.error
  return "Could not load your profile"
}

function toDateInput(d?: Date | string | null) {
  if (!d) return ""
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

export default function UserProfile() {
  const dispatch = useDispatch()
  const session = useSelector((state: RootState) => state.userInfo)
  const { data, isLoading, isError, error, refetch } = useGetMyProfileQuery()
  const profile = data as ProfileUser | undefined

  const [updateProfile, { isLoading: saving }] = useUpdateMyProfileMutation()
  const [changePassword, { isLoading: changingPw }] = useChangeMyPasswordMutation()
  const [changeRole, { isLoading: changingRole }] = useChangeMyRoleMutation()

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    image: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    country: "",
    region: "",
    city: "",
    occupation: "",
    bloodType: "UNKNOWN",
    height: "",
    weight: "",
    role: "USER",
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
      nationality: profile.profile?.nationality ?? "",
      country: profile.profile?.country ?? "",
      region: profile.profile?.region ?? "",
      city: profile.profile?.city ?? "",
      occupation: profile.profile?.occupation ?? "",
      bloodType: profile.profile?.bloodType ?? "UNKNOWN",
      height: profile.profile?.height != null ? String(profile.profile.height) : "",
      weight: profile.profile?.weight != null ? String(profile.profile.weight) : "",
      role: profile.role ?? "USER",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }))
  }, [profile])

  const onChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const syncSession = (next: {
    name?: string
    email?: string
    phone?: string
    image?: string
    role?: string
    accessToken?: string
    refreshToken?: string
  }) => {
    dispatch(
      setUser({
        userId: session.userId,
        name: next.name ?? session.name,
        email: next.email ?? session.email,
        phone: next.phone ?? session.phone,
        image: next.image ?? session.image,
        role: next.role ?? session.role,
        accessToken: next.accessToken ?? session.accessToken,
        refreshToken: next.refreshToken ?? session.refreshToken,
        emailVerified: profile?.emailVerified ?? session.emailVerified,
        phoneVerified: profile?.phoneVerified ?? session.phoneVerified,
      })
    )
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const res = await updateProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avatarUrl: form.image.trim(),
        picture: form.image.trim(),
        gender:
          form.gender === "MALE" || form.gender === "FEMALE" || form.gender === "OTHER"
            ? form.gender
            : undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        profile: {
          nationality: form.nationality.trim(),
          country: form.country.trim(),
          region: form.region.trim(),
          city: form.city.trim(),
          occupation: form.occupation.trim(),
          bloodType: form.bloodType,
          height: form.height ? Number(form.height) : null,
          weight: form.weight ? Number(form.weight) : null,
        },
      }).unwrap()

      if (!res.isSuccess) throw new Error(res.message || "Update failed")

      syncSession({
        name: res.user?.fullName ?? form.fullName,
        email: res.user?.email ?? form.email,
        phone: res.user?.phone ?? form.phone,
        image: res.user?.avatarUrl ?? res.user?.picture ?? form.image,
        role: res.user?.role ?? session.role,
        accessToken: res.result?.accessToken,
        refreshToken: res.result?.refreshToken,
      })
      toast.success("Profile updated")
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Could not update profile")
    }
  }

  const [roleReason, setRoleReason] = useState("")

  const handleChangeRole = async (e: FormEvent) => {
    e.preventDefault()
    const clinical = ["DOCTOR", "NURSE", "MIDWIFE", "LAB_TECH", "PHARMACIST", "RECEPTIONIST"]
    if (clinical.includes(form.role) && roleReason.trim().length < 10) {
      toast.error("Add a short reason (why you need this role)")
      return
    }
    try {
      const res = await changeRole({
        role: form.role,
        reason: roleReason.trim() || undefined,
      }).unwrap()
      if (!res.isSuccess) throw new Error(res.message || "Role update failed")
      if (res.result?.applicationPending) {
        toast.success(
          res.message ||
            "Application sent. Super Admin must approve before your role changes.",
        )
        setRoleReason("")
        refetch()
        return
      }
      syncSession({
        role: res.user?.role ?? form.role,
        accessToken: res.result?.accessToken,
        refreshToken: res.result?.refreshToken,
      })
      toast.success(`Role is now ${labelize(res.user?.role ?? form.role)}`)
      setRoleReason("")
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Could not change role")
    }
  }

  const handleChangePassword = async (e: FormEvent) => {
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
      const res = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }).unwrap()
      if (!res.isSuccess) throw new Error(res.message || "Password update failed")
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
      toast.success("Password changed")
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Could not change password")
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl sm:h-40 sm:rounded-3xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl sm:h-80 sm:rounded-3xl" />
          <Skeleton className="h-72 rounded-2xl sm:h-80 sm:rounded-3xl" />
        </div>
      </div>
    )
  }

  if (isError && !profile) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground sm:text-base">
          {profileErrorText(error)}
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  const displayName = profile?.fullName || session.name || "User"
  const healthId =
    (profile as ProfileUser & { profile?: { healthId?: string | null } })?.profile
      ?.healthId || null
  const displayRole = profile?.role || session.role || "USER"
  const displayImage = form.image || session.image
  const counts = profile?._count

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <Card className="overflow-hidden border-blue-100 shadow-sm">
        <div className="bg-gradient-to-r from-brand-dark to-primary px-4 py-5 text-white sm:px-5 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white/40 sm:h-16 sm:w-16">
                <AvatarImage src={displayImage || undefined} alt={displayName} />
                <AvatarFallback className="bg-white/20 text-lg font-bold text-white">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs text-white/70">My account</p>
                <h2 className="truncate text-xl font-semibold text-white sm:text-2xl">
                  {displayName}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">
                    {labelize(displayRole)}
                  </Badge>
                  <span className="truncate text-sm text-white/80">
                    {profile?.email || session.email}
                  </span>
                </div>
                {healthId ? (
                  <p className="mt-2 font-mono text-sm font-semibold tracking-wide text-white">
                    Patient ID · {healthId}
                  </p>
                ) : null}
              </div>
            </div>
            <Button
              asChild
              variant="secondary"
              className="w-full bg-white text-brand-dark hover:bg-white/90 sm:w-auto"
            >
              <Link to="/dashboard?section=notifications">
                <Bell className="h-4 w-4" />
                Alerts
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {healthId ? (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Daryeel Patient ID
              </p>
              <p className="font-mono text-lg font-bold tracking-wide text-brand-dark">
                {healthId}
              </p>
              <p className="text-xs text-muted-foreground">
                Permanent healthcare identity — never changes if you become a professional.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <InfoTile icon={Shield} label="Role" value={labelize(displayRole)} />
        <InfoTile icon={Droplet} label="Blood type" value={labelize(profile?.profile?.bloodType)} />
        <InfoTile icon={Phone} label="Phone" value={profile?.phone || "—"} />
        <InfoTile icon={Calendar} label="Member since" value={fmtDate(profile?.createdAt)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <VerifyBadge label="Email" verified={profile?.emailVerified ?? false} />
        <VerifyBadge label="Phone" verified={profile?.phoneVerified ?? false} />
        <VerifyBadge label="2FA" verified={profile?.twoFactorEnabled ?? false} />
      </div>

      {/* Mobile-first Tabs: full-width on phone, equal columns from sm+ */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="sticky top-14 z-10 sm:top-16">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="care">My care</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 sm:space-y-5">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <UserRound className="h-5 w-5 text-primary" />
                Personal details
              </CardTitle>
              <CardDescription>Name, contact, and photo</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" id="fullName" value={form.fullName} onChange={(v) => onChange("fullName", v)} required />
                  <Field label="Email" id="email" type="email" icon={Mail} value={form.email} onChange={(v) => onChange("email", v)} required />
                  <Field label="Phone" id="phone" icon={Phone} value={form.phone} onChange={(v) => onChange("phone", v)} placeholder="+252 61 234 5678" />
                  <Field label="Photo URL" id="image" icon={Camera} value={form.image} onChange={(v) => onChange("image", v)} placeholder="https://..." />
                  <SelectField
                    label="Gender"
                    id="gender"
                    value={form.gender}
                    onChange={(v) => onChange("gender", v)}
                    options={[
                      { value: "", label: "Not set" },
                      { value: "MALE", label: "Male" },
                      { value: "FEMALE", label: "Female" },
                      { value: "OTHER", label: "Other" },
                    ]}
                  />
                  <Field label="Date of birth" id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(v) => onChange("dateOfBirth", v)} />
                </div>
                <Separator />
                <Field label="Nationality" id="nationality" value={form.nationality} onChange={(v) => onChange("nationality", v)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Country" id="country" value={form.country} onChange={(v) => onChange("country", v)} />
                  <Field label="Region" id="region" value={form.region} onChange={(v) => onChange("region", v)} />
                  <Field label="City" id="city" value={form.city} onChange={(v) => onChange("city", v)} />
                  <Field label="Occupation" id="occupation" value={form.occupation} onChange={(v) => onChange("occupation", v)} />
                </div>
                <SelectField
                  label="Blood type"
                  id="bloodType"
                  value={form.bloodType}
                  onChange={(v) => onChange("bloodType", v)}
                  options={BLOOD_TYPES.map((item) => ({ value: item, label: labelize(item) }))}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Height (cm)" id="height" type="number" value={form.height} onChange={(v) => onChange("height", v)} />
                  <Field label="Weight (kg)" id="weight" type="number" value={form.weight} onChange={(v) => onChange("weight", v)} />
                </div>
                <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save profile"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg">Account</CardTitle>
              <CardDescription>Language, timezone, and last sign-in</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 px-4 text-sm sm:grid-cols-2 sm:px-6">
              <MetaRow label="Language" value={profile?.language || "so"} />
              <MetaRow label="Timezone" value={profile?.timezone || "Africa/Mogadishu"} />
              <MetaRow label="Gender" value={labelize(profile?.gender)} />
              <MetaRow label="Date of birth" value={fmtDate(profile?.dateOfBirth)} />
              <MetaRow label="Last login" value={fmtDate(profile?.lastLoginAt ?? profile?.lastLogin)} />
              <MetaRow label="Active" value={profile?.isActive === false ? "No" : "Yes"} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4 sm:space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Role
                </CardTitle>
                <CardDescription>
                  Patient/User updates instantly. Doctor and other clinical roles
                  need a reason and Super Admin approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <form onSubmit={handleChangeRole} className="space-y-4">
                  <SelectField
                    label="I want to be"
                    id="role"
                    value={form.role}
                    onChange={(v) => onChange("role", v)}
                    options={ROLES.map((item) => ({ value: item, label: labelize(item) }))}
                  />
                  <div className="space-y-1.5">
                    <label
                      htmlFor="roleReason"
                      className="text-sm font-medium text-brand-dark"
                    >
                      Reason
                    </label>
                    <textarea
                      id="roleReason"
                      value={roleReason}
                      onChange={(e) => setRoleReason(e.target.value)}
                      rows={3}
                      placeholder="Why do you need this role? (required for clinical roles)"
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Current role: {labelize(displayRole)}. Clinical applications
                      stay pending until approved.
                    </p>
                  </div>
                  <Button type="submit" disabled={changingRole} className="w-full">
                    {changingRole ? "Submitting..." : "Save role / apply"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-blue-100 shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Password
                </CardTitle>
                <CardDescription>Use your current password to set a new one</CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <Field label="Current password" id="currentPassword" type="password" value={form.currentPassword} onChange={(v) => onChange("currentPassword", v)} required />
                  <Field label="New password" id="newPassword" type="password" value={form.newPassword} onChange={(v) => onChange("newPassword", v)} required />
                  <Field label="Confirm new password" id="confirmPassword" type="password" value={form.confirmPassword} onChange={(v) => onChange("confirmPassword", v)} required />
                  <Button type="submit" variant="outline" disabled={changingPw} className="w-full">
                    {changingPw ? "Updating..." : "Update password"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="care" className="space-y-4 sm:space-y-5">
          {counts ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
              <CountTile label="Visits" value={counts.appointments} />
              <CountTile label="Prescriptions" value={counts.prescriptions} />
              <CountTile label="Lab orders" value={counts.labOrders} />
              <CountTile label="Records" value={counts.healthRecords} />
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RecordList
              title="Appointments"
              icon={Calendar}
              empty="No upcoming visits."
              rows={(profile?.appointments ?? []).map((item) => ({
                id: item.appointmentid,
                title: item.doctorName || item.facilityName || item.appointmentCode,
                meta: `${fmtDate(item.scheduledAt)} · ${labelize(item.status)}`,
              }))}
            />
            <RecordList
              title="Prescriptions"
              icon={Pill}
              empty="No prescriptions yet."
              rows={(profile?.prescriptions ?? []).map((item) => ({
                id: item.prescriptionid,
                title: item.medication,
                meta: `${labelize(item.status)} · ${fmtDate(item.issuedAt)}`,
              }))}
            />
            <RecordList
              title="Lab orders"
              icon={FlaskConical}
              empty="No lab orders yet."
              rows={(profile?.labOrders ?? []).map((item) => ({
                id: item.laborderid,
                title: item.testName,
                meta: `${labelize(item.status)} · ${fmtDate(item.orderedAt)}`,
              }))}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  icon: Icon,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  icon?: React.ElementType
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id={id}
          type={type}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={Icon ? "border-blue-100 bg-brand-bg pl-10" : "border-blue-100 bg-brand-bg"}
        />
      </div>
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-md border border-blue-100 bg-brand-bg px-3 text-sm text-brand-dark outline-none focus:ring-2 focus:ring-primary"
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-xl bg-brand-light p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate font-semibold text-brand-dark">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function CountTile({ label, value }: { label: string; value?: number }) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-brand-dark">{value ?? 0}</p>
      </CardContent>
    </Card>
  )
}

function VerifyBadge({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
        verified
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-blue-100 bg-white text-muted-foreground"
      }`}
    >
      {verified ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span className="font-medium">{label}</span>
      <span className="text-xs">{verified ? "verified" : "not verified"}</span>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-xl bg-brand-bg px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-brand-dark">{value}</span>
    </div>
  )
}

function RecordList({
  title,
  icon: Icon,
  empty,
  rows,
}: {
  title: string
  icon: React.ElementType
  empty: string
  rows: { id: string; title: string; meta: string }[]
}) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-brand-dark">{title}</h3>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl bg-brand-bg px-3 py-2">
                <p className="truncate text-sm font-medium text-brand-dark">{row.title}</p>
                <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
