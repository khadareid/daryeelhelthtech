import { FormEvent, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { ArrowLeft, Stethoscope } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/config/site"
import { enumLabel } from "@/lib/enums"
import {
  useGetMyDoctorProfileQuery,
  useUpsertMyDoctorProfileMutation,
} from "@/Redex/service/doctors/DoctorsApi"
import type { RootState } from "@/Redex/store/store"

const empty = {
  fullName: "",
  specialty: "",
  subSpecialty: "",
  licenseNumber: "",
  qualification: "",
  clinicName: "",
  city: "Hargeisa",
  country: "Somaliland",
  yearsExperience: "",
  consultationFee: "",
  bio: "",
  phone: "",
  videoConsultationEnabled: false,
  chatConsultationEnabled: false,
}

export default function ApplyDoctorPage() {
  const navigate = useNavigate()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const { data: existing, isLoading, refetch } = useGetMyDoctorProfileQuery(
    undefined,
    { skip: !signedIn }
  )
  const [upsert, { isLoading: saving }] = useUpsertMyDoctorProfileMutation()
  const [form, setForm] = useState(empty)

  useEffect(() => {
    if (!existing) {
      setForm((f) => ({
        ...f,
        fullName: session.name || f.fullName,
      }))
      return
    }
    setForm({
      fullName: existing.fullName || session.name || "",
      specialty: existing.specialty || "",
      subSpecialty: existing.subSpecialty || "",
      licenseNumber: existing.licenseNumber || "",
      qualification: existing.qualification || "",
      clinicName: existing.clinicName || "",
      city: existing.city || "Hargeisa",
      country: existing.country || "Somaliland",
      yearsExperience:
        existing.yearsExperience != null
          ? String(existing.yearsExperience)
          : "",
      consultationFee:
        existing.consultationFee != null
          ? String(existing.consultationFee)
          : "",
      bio: existing.bio || "",
      phone: existing.user?.phone || "",
      videoConsultationEnabled: Boolean(existing.videoConsultationEnabled),
      chatConsultationEnabled: Boolean(existing.chatConsultationEnabled),
    })
  }, [existing, session.name])

  if (!signedIn) {
    return (
      <div className="container-page py-16 text-center">
        <Stethoscope className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 font-heading text-2xl font-bold text-brand-dark">
          Apply as a doctor
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Sign in first, then submit your specialty, license, and clinic details.
          Admins will verify your application.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/signin" state={{ from: "/doctors/apply" }}>
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/SignUp">Create account</Link>
          </Button>
        </div>
      </div>
    )
  }

  const status = String(existing?.verificationStatus || "")
  const isVerified = status === "VERIFIED"
  const isPending = status === "PENDING"
  const isRejected = status === "REJECTED"
  const isSuspended = status === "SUSPENDED"

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.fullName.trim() || !form.specialty.trim()) {
      toast.error("Full name and specialty are required")
      return
    }
    try {
      await upsert({
        fullName: form.fullName.trim(),
        specialty: form.specialty.trim(),
        subSpecialty: form.subSpecialty || null,
        licenseNumber: form.licenseNumber || null,
        qualification: form.qualification || null,
        clinicName: form.clinicName || null,
        city: form.city || null,
        country: form.country || null,
        yearsExperience: form.yearsExperience
          ? Number(form.yearsExperience)
          : null,
        consultationFee: form.consultationFee
          ? Number(form.consultationFee)
          : 0,
        bio: form.bio || null,
        videoConsultationEnabled: form.videoConsultationEnabled,
        chatConsultationEnabled: form.chatConsultationEnabled,
        consultationEnabled: true,
        resubmit: isRejected || undefined,
      }).unwrap()
      toast.success(
        isRejected
          ? "Application re-submitted for review"
          : "Application submitted — waiting for admin verification"
      )
      refetch()
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "data" in err
          ? String((err as { data?: { message?: string } }).data?.message || "")
          : ""
      toast.error(msg || "Could not submit application")
    }
  }

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-8 sm:py-10">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link to="/doctors">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Doctors directory
          </Link>
        </Button>

        <div className="mx-auto max-w-3xl space-y-4">
          <header className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {siteConfig.appName}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark">
              Apply as a doctor
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Fill in your specialty (takhassus), license, clinic, and bio.
              After you submit, an admin verifies you before you appear in the
              public directory.
            </p>
            {isLoading ? <Skeleton className="mt-4 h-8 w-40 rounded-full" /> : null}
            {existing ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Status · {enumLabel(status || "PENDING")}
                </Badge>
                {isVerified ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/doctors/${existing.id}`}>View my public profile</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </header>

          {isVerified ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-emerald-950">
              You are already a verified doctor. Update your public profile from
              the doctor tools, or ask admin if you need changes.
              <div className="mt-3">
                <Button size="sm" onClick={() => navigate(`/doctors/${existing!.id}`)}>
                  Open my profile
                </Button>
              </div>
            </div>
          ) : null}

          {isPending ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 text-sm text-amber-950">
              Your application is pending review. You can update the details
              below while you wait.
            </div>
          ) : null}

          {isRejected ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5 text-sm text-rose-900">
              Your previous application was rejected
              {existing?.rejectionReason
                ? `: ${existing.rejectionReason}`
                : "."}{" "}
              Update your information and submit again.
            </div>
          ) : null}

          {isSuspended ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-5 text-sm text-rose-900">
              Your doctor account is suspended. Contact{" "}
              {siteConfig.supportEmail} for help.
            </div>
          ) : null}

          {!isVerified && !isSuspended ? (
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Full name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
                <Field label="Specialty (takhassus) *" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} required placeholder="e.g. Neurology" />
                <Field label="Sub-specialty" value={form.subSpecialty} onChange={(v) => setForm({ ...form, subSpecialty: v })} />
                <Field label="License number" value={form.licenseNumber} onChange={(v) => setForm({ ...form, licenseNumber: v })} />
                <Field label="Qualification" value={form.qualification} onChange={(v) => setForm({ ...form, qualification: v })} placeholder="e.g. MD, MBBS" />
                <Field label="Years of experience" value={form.yearsExperience} onChange={(v) => setForm({ ...form, yearsExperience: v })} />
                <Field label="Clinic / hospital" value={form.clinicName} onChange={(v) => setForm({ ...form, clinicName: v })} />
                <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <Field label="Consultation fee (USD)" value={form.consultationFee} onChange={(v) => setForm({ ...form, consultationFee: v })} placeholder="0 = free visits" />
                <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              </div>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-brand-dark">About you / bio</span>
                <textarea
                  className="min-h-[100px] w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell patients about your experience and specialty…"
                />
              </label>
              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.videoConsultationEnabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        videoConsultationEnabled: e.target.checked,
                      })
                    }
                  />
                  Offer video visits
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.chatConsultationEnabled}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        chatConsultationEnabled: e.target.checked,
                      })
                    }
                  />
                  Offer chat visits
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Submitting…"
                    : isRejected
                      ? "Re-submit application"
                      : isPending
                        ? "Update application"
                        : "Submit application"}
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link to="/doctors">Browse doctors</Link>
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="font-medium text-brand-dark">{label}</span>
      <Input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
