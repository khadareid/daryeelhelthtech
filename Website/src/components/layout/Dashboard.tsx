import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  Activity,
  Bell,
  Calendar,
  CheckCircle2,
  FlaskConical,
  Mail,
  Phone,
  Pill,
  ShieldCheck,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RootState } from "@/Redex/store/store"
import { useGetMyProfileQuery } from "@/Redex/service/users/UsersApi"
import {
  useGetDashboardQuery,
  type DashboardData,
} from "@/Redex/service/Dashboard/Dashboard"
import {
  isAdminRole,
  linksForRole,
  normalizeRole,
  sectionFromLocation,
  workspaceForRole,
  type AppRole,
  type DashLink,
} from "./Sidebar"
import { cn } from "@/lib/utils"
import { DailyHealthPanel } from "./DailyHealthPanel"
import { CareHome } from "./CareHome"
import { useGetMyAppointmentsQuery } from "@/Redex/service/appointments/AppointmentsApi"
import {
  doctorName,
  doctorPhoto,
  saasDoctorId,
  useGetPublicCareTeamQuery,
} from "@/Redex/service/hospitals/HospitalsApi"
import SuperAdminPanel from "@/pages/dashboard/admin/SuperAdminPanel"
import ApplyProfessional from "@/pages/dashboard/ApplyProfessional"
import HospitalsSection from "@/components/layout/HospitalsSection"
import MessagesSection from "@/components/layout/MessagesSection"
import MyHealthcareSection from "@/components/healthcare/MyHealthcareSection"
import { useGetNewsFeedQuery } from "@/Redex/service/news/NewsApi"
import {
  useGetConnectionsQuery,
  useAcceptConnectionMutation,
  useRejectConnectionMutation,
  useEndConnectionMutation,
} from "@/Redex/service/professionals/ProfessionalsApi"
import { PatientIdCard } from "@/components/common/PatientIdCard"
import { Building2, MapPin, Newspaper, Star } from "lucide-react"

function initials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function roleLabel(role: string) {
  const upper = role.toUpperCase()
  if (upper === "USER" || upper === "PATIENT") return "Member"
  if (upper === "RECEPTIONIST") return "Staff"
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase())
}

function formatWhen(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function money(value?: number) {
  if (typeof value !== "number") return "—"
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSelector((state: RootState) => state.userInfo)
  const role = normalizeRole(session.role)
  const section = sectionFromLocation(location.pathname, location.search)
  const links = linksForRole(role).filter((item) => item.id !== "home")

  const { data: profile } = useGetMyProfileQuery()
  const { data, isLoading } = useGetDashboardQuery()

  const name = profile?.fullName || session.name || "User"
  const email = profile?.email || session.email
  const phone = profile?.phone || session.phone
  const image = profile?.avatarUrl || profile?.picture || session.image

  const isHome = section === "dashboard" || section === "home"

  return (
    <div className="space-y-5">
      {isHome ? (
        <CareHome
          name={name}
          image={image}
          data={data}
          healthId={(profile as any)?.profile?.healthId}
        />
      ) : section === "doctors" ? (
        <DoctorsSection />
      ) : section === "hospitals" ? (
        <HospitalsSection />
      ) : section === "appointments" ? (
        <AppointmentsSection data={data} loading={isLoading} />
      ) : section === "healthcare" ||
        section === "opd-tickets" ||
        section === "visits" ||
        section === "healthcare-activity" ? (
        <MyHealthcareSection />
      ) : section === "connections" ? (
        <ConnectionsSection />
      ) : section === "messages" ? (
        <MessagesSection />
      ) : section === "news" ? (
        <NewsSection />
      ) : section === "admin" && isAdminRole(role) ? (
        <SuperAdminPanel />
      ) : section === "apply-professional" ? (
        <ApplyProfessional />
      ) : (
        <>
          <Hero
            name={name}
            email={email}
            phone={phone}
            image={image}
            role={role}
            emailVerified={profile?.emailVerified ?? session.emailVerified}
            phoneVerified={profile?.phoneVerified ?? session.phoneVerified}
            bloodType={profile?.profile?.bloodType}
            healthId={(profile as any)?.profile?.healthId}
          />
          <SectionBody
            section={section}
            links={links}
            data={data}
            loading={isLoading}
            onOpen={(to) => navigate(to)}
          />
        </>
      )}
    </div>
  )
}

function DoctorsSection() {
  const navigate = useNavigate()
  const [q, setQ] = useState("")
  const { data: doctors = [], isLoading, isError, refetch } =
    useGetPublicCareTeamQuery({ all: true })

  const filtered = doctors.filter((d) => {
    const needle = q.trim().toLowerCase()
    if (!needle) return true
    const hay = [
      doctorName(d),
      d.specialization,
      d.hospitalName,
      d.city,
      d.country,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return hay.includes(needle)
  })

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <header className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
          Doctors
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clinicians from Daryeel SaaS hospitals — open a profile to book. Your
          request appears in the hospital console instantly.
        </p>
        <button
          type="button"
          onClick={() => navigate("/dashboard?section=hospitals")}
          className="mt-2 text-sm font-semibold text-primary"
        >
          Open hospitals →
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search doctors, specialty, hospital, city…"
          className="mt-3 h-10 w-full rounded-xl border border-blue-100 bg-[#F8FAFC] px-3 text-sm outline-none ring-primary focus:ring-2"
        />
        {!isLoading ? (
          <p className="mt-2 text-sm font-semibold text-primary">
            {filtered.length} SaaS hospital clinicians
          </p>
        ) : null}
      </header>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}
      {isError ? (
        <Card className="border-blue-100">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Couldn’t load hospital doctors from SaaS.
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-semibold text-primary"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doctor) => {
          const id = saasDoctorId(doctor)
          return (
            <button
              key={`${doctor.hospitalId}-${id}`}
              type="button"
              onClick={() =>
                navigate(
                  `/doctors/${encodeURIComponent(id)}?hospital=${encodeURIComponent(doctor.hospitalId)}`,
                )
              }
              className="flex gap-3 rounded-2xl border border-blue-100 bg-white p-3 text-left shadow-sm transition hover:border-primary/30"
            >
              <img
                src={doctorPhoto(doctor)}
                alt={doctorName(doctor)}
                className="h-14 w-14 shrink-0 rounded-2xl object-cover sm:h-16 sm:w-16"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate font-heading font-semibold text-brand-dark">
                    {doctorName(doctor)}
                  </p>
                  {doctor.isVerified ? (
                    <Badge className="shrink-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      Verified
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-sm text-primary">
                  {doctor.specialization || "Doctor"}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {doctor.hospitalName}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {[doctor.city, doctor.country].filter(Boolean).join(" · ") ||
                    "Location TBA"}
                  {typeof doctor.averageRating === "number" &&
                  doctor.averageRating > 0 ? (
                    <>
                      <Star className="ml-1 h-3 w-3 fill-amber-400 text-amber-400" />
                      {doctor.averageRating.toFixed(1)}
                    </>
                  ) : null}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Book
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    View profile
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {!isLoading && !isError && filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No SaaS hospital doctors yet. Open Hospitals to browse facilities.
        </p>
      ) : null}
    </div>
  )
}

function AppointmentsSection({
  data,
  loading,
}: {
  data?: DashboardData
  loading: boolean
}) {
  const navigate = useNavigate()
  const { data: mine = [], isLoading: mineLoading } = useGetMyAppointmentsQuery()
  const live = mine.length > 0 ? mine : data?.appointmentsOverview?.upcoming ?? []

  const now = Date.now()
  const closed = new Set(["CANCELLED", "COMPLETED", "NO_SHOW"])
  const upcoming = live.filter(
    (item) =>
      new Date(item.scheduledAt).getTime() >= now &&
      !closed.has(String(item.status).toUpperCase()),
  )
  const history = live.filter(
    (item) =>
      new Date(item.scheduledAt).getTime() < now ||
      closed.has(String(item.status).toUpperCase()),
  )

  const asDoctor = upcoming.filter((i) => i.isMineAsProfessional)
  const asPatient = upcoming.filter((i) => !i.isMineAsProfessional)

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-6">
        <div>
          <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Patients who booked you appear here. Your own visits are listed too.
          </p>
        </div>
        <Link
          to="/dashboard?section=doctors"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
        >
          Book visit
        </Link>
      </header>
      {loading || mineLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          {asDoctor.length > 0 ? (
            <Card className="border-blue-100">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-semibold text-brand-dark">
                  Patients who booked you ({asDoctor.length})
                </p>
                {asDoctor.map((item) => (
                  <div
                    key={item.appointmentid}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-50 bg-[#F8FAFC] p-3"
                  >
                    <div>
                      <p className="font-medium text-brand-dark">
                        {item.patientName || "Patient"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatWhen(item.scheduledAt)} ·{" "}
                        {String(item.status).replace(/_/g, " ")}
                        {item.reason ? ` · ${item.reason}` : ""}
                      </p>
                      {item.patientHealthId ? (
                        <p className="mt-0.5 font-mono text-[11px] text-primary">
                          Patient ID · {item.patientHealthId}
                        </p>
                      ) : null}
                    </div>
                    {item.patientUserId ? (
                      <button
                        type="button"
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                        onClick={() =>
                          navigate(
                            `/dashboard?section=messages&peer=${encodeURIComponent(item.patientUserId!)}&name=${encodeURIComponent(item.patientName || "Patient")}`,
                          )
                        }
                      >
                        Message patient
                      </button>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <ListCard
            title={`My visits (${asPatient.length})`}
            icon={Calendar}
            empty="No upcoming visits. Book a doctor to get started."
            rows={asPatient.map((item) => ({
              id: item.appointmentid,
              title: item.doctorName || item.professionalName || "Visit",
              meta: `${formatWhen(item.scheduledAt)} · ${String(item.status).replace(/_/g, " ")}${
                item.facilityName ? ` · ${item.facilityName}` : ""
              }${item.reason ? ` · ${item.reason}` : ""}`,
            }))}
          />
          <ListCard
            title={`History (${history.length})`}
            icon={Activity}
            empty="No past appointments yet."
            rows={history.map((item) => ({
              id: item.appointmentid,
              title: item.isMineAsProfessional
                ? item.patientName || "Patient visit"
                : item.doctorName || item.professionalName || "Visit",
              meta: `${formatWhen(item.scheduledAt)} · ${String(item.status).replace(/_/g, " ")}${
                item.patientHealthId
                  ? ` · ${item.patientHealthId}`
                  : item.reason
                    ? ` · ${item.reason}`
                    : ""
              }`,
            }))}
          />
        </>
      )}
    </div>
  )
}

function ConnectionsSection() {
  const { data: rows = [], isLoading, isError, refetch } = useGetConnectionsQuery()
  const [accept] = useAcceptConnectionMutation()
  const [reject] = useRejectConnectionMutation()
  const [end] = useEndConnectionMutation()

  const list = (rows as any[]) || []
  const pending = list.filter((r) => r.status === "PENDING")
  const accepted = list.filter((r) => r.status === "ACCEPTED")

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
          Healthcare connections
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connection is not medical-record access — consent is still required.
        </p>
      </header>
      {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : null}
      {isError ? (
        <button type="button" className="text-sm text-primary" onClick={() => refetch()}>
          Retry loading connections
        </button>
      ) : null}
      <Card className="border-blue-100">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-brand-dark">
            Pending ({pending.length})
          </p>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            pending.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-50 bg-[#F8FAFC] p-3"
              >
                <div>
                  <p className="font-medium text-brand-dark">
                    {row.patient?.fullName || row.professional?.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {row.reason || "Connection request"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => accept(row.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                    onClick={() => reject(row.id)}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card className="border-blue-100">
        <CardContent className="space-y-3 p-4">
          <p className="text-sm font-semibold text-brand-dark">
            Connected ({accepted.length})
          </p>
          {accepted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active connections.</p>
          ) : (
            accepted.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-50 p-3"
              >
                <div>
                  <p className="font-medium text-brand-dark">
                    {row.professional?.fullName || row.patient?.fullName}
                  </p>
                  <PatientIdCard
                    compact
                    healthId={row.patient?.profile?.healthId}
                    className="mt-1"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                  onClick={() => end(row.id)}
                >
                  End
                </button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function NewsSection() {
  const { data, isLoading, isError } = useGetNewsFeedQuery({ page: 1, limit: 12 })
  const live = data?.data ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Newspaper className="h-3.5 w-3.5" />
          Feed
        </p>
        <h1 className="mt-1 font-heading text-xl font-bold text-brand-dark sm:text-2xl">
          Health news & community
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live moderated posts from Daryeel. Read and comment — only admins
          publish. Do not share private medical details.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/news"
            className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-sm font-semibold text-white"
          >
            Open full feed
          </Link>
          <Link
            to="/dashboard?section=apply-professional"
            className="inline-flex h-9 items-center rounded-xl border border-blue-100 px-3 text-sm font-semibold text-brand-dark"
          >
            Apply as professional
          </Link>
        </div>
      </header>
      {isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
      {isError ? (
        <p className="text-sm text-muted-foreground">
          Could not load the news feed. Try again later.
        </p>
      ) : null}
      {live.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {live.map((post) => (
            <Link
              key={post.newspostid}
              to={`/news/${post.newspostid}`}
              className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase text-primary">
                {post.category.replace(/_/g, " ")}
                {post.author?.verifiedProfessional ? " · Verified" : ""}
              </p>
              <p className="mt-1 font-heading font-semibold text-brand-dark">
                {post.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {post.content}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {post.reactionCount ?? 0} reactions · {post.commentCount ?? 0}{" "}
                comments
              </p>
            </Link>
          ))}
        </div>
      ) : !isLoading && !isError ? (
        <p className="rounded-2xl border border-blue-100 bg-white p-5 text-sm text-muted-foreground">
          No published posts yet.
        </p>
      ) : null}
    </div>
  )
}

function Hero({
  name,
  email,
  phone,
  image,
  role,
  emailVerified,
  phoneVerified,
  bloodType,
  healthId,
}: {
  name: string
  email?: string
  phone?: string
  image?: string
  role: AppRole
  emailVerified?: boolean
  phoneVerified?: boolean
  bloodType?: string | null
  healthId?: string | null
}) {
  return (
    <Card className="overflow-hidden border-blue-100 shadow-sm">
      <div className="bg-gradient-to-r from-brand-dark to-primary px-5 py-5 text-white">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-white/40">
            <AvatarImage src={image || undefined} alt={name} />
            <AvatarFallback className="bg-white/20 text-base font-bold text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-white/70">Signed in as</p>
            <h2 className="truncate text-xl font-semibold text-white">{name}</h2>
            <Badge className="mt-1 border-0 bg-white/15 text-[10px] text-white hover:bg-white/15">
              {roleLabel(role)}
            </Badge>
            {healthId ? (
              <p className="mt-1 font-mono text-xs text-white/90">
                Patient ID · {healthId}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <CardContent className="grid gap-2 px-5 py-4 sm:grid-cols-2">
        <InfoLine icon={Mail} text={email || "No email"} ok={emailVerified} />
        <InfoLine icon={Phone} text={phone || "No phone"} ok={phoneVerified} />
        {bloodType && bloodType !== "UNKNOWN" && (
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Blood type{" "}
            <span className="font-medium text-brand-dark">
              {bloodType.replace(/_/g, " ")}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function InfoLine({
  icon: Icon,
  text,
  ok,
}: {
  icon: React.ElementType
  text: string
  ok?: boolean
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-brand-text">
      <Icon className="h-4 w-4 shrink-0 text-primary" />
      <span className="truncate">{text}</span>
      {ok && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-success" />}
    </p>
  )
}

function StatRow({
  role,
  loading,
  data,
}: {
  role: AppRole
  loading: boolean
  data?: DashboardData
}) {
  const workspace = workspaceForRole(role)
  const summary = data?.summary
  const ops = data?.operationalMetrics

  const tiles =
    workspace === "admin"
      ? [
          { label: "Users", value: summary?.totalUsers },
          { label: "Patients", value: summary?.totalPatients },
          { label: "Doctors", value: summary?.totalDoctors },
          { label: "Appointments", value: summary?.totalAppointments },
        ]
      : workspace === "clinical"
        ? [
            { label: "Today", value: ops?.appointments?.today },
            { label: "This week", value: ops?.appointments?.thisWeek },
            { label: "Rx pending", value: ops?.prescriptions?.pending },
            { label: "Labs open", value: ops?.labOrders?.ordered },
          ]
        : [
            { label: "Visits", value: summary?.totalAppointments },
            { label: "Prescriptions", value: summary?.totalPrescriptions },
            { label: "Lab orders", value: summary?.totalLabOrders },
            { label: "Consents", value: summary?.activeConsents },
          ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <Card key={tile.label} className="border-blue-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{tile.label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-12" />
            ) : (
              <p className="mt-1 text-2xl font-semibold text-brand-dark">
                {typeof tile.value === "number" ? tile.value.toLocaleString() : "—"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function hintFor(
  id: string,
  data?: DashboardData
): string | undefined {
  const summary = data?.summary
  const ops = data?.operationalMetrics
  const map: Record<string, number | undefined> = {
    care: ops?.appointments?.today ?? summary?.totalAppointments,
    users: summary?.totalUsers,
    patients: summary?.totalPatients,
    labs: summary?.totalLabOrders,
    prescriptions: ops?.prescriptions?.pending,
    finance: summary?.totalTransactions,
    wallet: summary?.totalTransactions,
    consents: summary?.activeConsents,
    health: data?.healthMetrics?.vitalsRecorded,
    activity: data?.recentActivity?.recentUsers?.length,
  }
  const value = map[id]
  if (typeof value !== "number") return undefined
  return value.toLocaleString()
}

function ModuleCard({
  item,
  hint,
  onOpen,
}: {
  item: DashLink
  hint?: string
  onOpen: () => void
}) {
  const Icon = item.icon
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full flex-col items-start gap-3 rounded-2xl border border-blue-100 bg-white p-4 text-left shadow-sm transition hover:border-primary/30 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-light text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-dark">{item.label}</span>
          {hint && (
            <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
              {hint}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-snug text-muted-foreground">
          {item.description}
        </span>
      </span>
    </button>
  )
}

function Recent({
  workspace,
  data,
  loading,
}: {
  workspace: ReturnType<typeof workspaceForRole>
  data?: DashboardData
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-36 rounded-2xl" />
      </div>
    )
  }

  const appointments =
    data?.appointmentsOverview?.upcoming ??
    data?.recentActivity?.recentAppointments ??
    []
  const prescriptions = data?.recentActivity?.recentPrescriptions ?? []
  const users = data?.recentActivity?.recentUsers ?? []

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ListCard
        title={workspace === "patient" ? "Upcoming visits" : "Appointments"}
        icon={Calendar}
        empty="No appointments yet."
        rows={appointments.slice(0, 4).map((item) => ({
          id: item.appointmentid,
          title: item.patientName || item.appointmentCode,
          meta: `${formatWhen(item.scheduledAt)} · ${item.status}`,
        }))}
      />
      {workspace === "admin" ? (
        <ListCard
          title="New accounts"
          icon={Activity}
          empty="No recent accounts."
          rows={users.slice(0, 4).map((item) => ({
            id: item.userid,
            title: item.fullName,
            meta: `${roleLabel(item.role)} · ${formatWhen(item.createdAt)}`,
          }))}
        />
      ) : (
        <ListCard
          title="Prescriptions"
          icon={Pill}
          empty="No prescriptions yet."
          rows={prescriptions.slice(0, 4).map((item) => ({
            id: item.prescriptionid,
            title: item.medication,
            meta: `${item.status} · ${formatWhen(item.issuedAt)}`,
          }))}
        />
      )}
    </div>
  )
}

function ListCard({
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

function SectionBody({
  section,
  links,
  data,
  loading,
  onOpen,
}: {
  section: string
  links: DashLink[]
  data?: DashboardData
  loading: boolean
  onOpen: (to: string) => void
}) {
  const current = links.find((item) => item.id === section)
  const Icon = current?.icon ?? Activity

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-light text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-brand-dark">
            {current?.label ?? "Dashboard"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {current?.description}
          </p>
        </div>
      </div>

      {loading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <SectionLists section={section} data={data} />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {links
          .filter((item) => item.id !== section)
          .slice(0, 3)
          .map((item) => (
            <ModuleCard key={item.id} item={item} onOpen={() => onOpen(item.to)} />
          ))}
      </div>
    </div>
  )
}

function SectionLists({
  section,
  data,
}: {
  section: string
  data?: DashboardData
}) {
  const appointments =
    data?.appointmentsOverview?.upcoming ??
    data?.recentActivity?.recentAppointments ??
    []
  const prescriptions = data?.recentActivity?.recentPrescriptions ?? []
  const labs = data?.recentActivity?.recentLabOrders ?? []
  const users = data?.recentActivity?.recentUsers ?? []
  const tx = data?.recentActivity?.recentTransactions ?? []

  if (section === "care" || section === "appointments") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <ListCard
          title="Appointments"
          icon={Calendar}
          empty="No appointments on your account yet."
          rows={appointments.slice(0, 6).map((item) => ({
            id: item.appointmentid,
            title: item.patientName || item.appointmentCode,
            meta: `${formatWhen(item.scheduledAt)} · ${item.status}`,
          }))}
        />
        <ListCard
          title="Prescriptions"
          icon={Pill}
          empty="No prescriptions yet."
          rows={prescriptions.slice(0, 6).map((item) => ({
            id: item.prescriptionid,
            title: item.medication,
            meta: `${item.patientName} · ${item.status}`,
          }))}
        />
      </div>
    )
  }

  if (section === "pharmacy") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <ListCard
          title="Prescriptions"
          icon={Pill}
          empty="No prescriptions yet."
          rows={prescriptions.slice(0, 6).map((item) => ({
            id: item.prescriptionid,
            title: item.medication,
            meta: `${item.patientName} · ${item.status}`,
          }))}
        />
        <ListCard
          title="Pharmacies"
          icon={Pill}
          empty="No pharmacies listed yet."
          rows={[]}
        />
      </div>
    )
  }

  if (section === "labs" || section === "records") {
    return (
      <ListCard
        title={section === "labs" ? "Lab orders" : "Recent clinical activity"}
        icon={FlaskConical}
        empty="Nothing recorded here yet."
        rows={labs.slice(0, 6).map((item) => ({
          id: item.laborderid,
          title: item.testName,
          meta: `${item.patientName} · ${item.status} · ${formatWhen(item.orderedAt)}`,
        }))}
      />
    )
  }

  if (section === "prescriptions") {
    return (
      <ListCard
        title="Prescriptions"
        icon={Pill}
        empty="No prescriptions waiting."
        rows={prescriptions.slice(0, 8).map((item) => ({
          id: item.prescriptionid,
          title: item.medication,
          meta: `${item.patientName} · ${item.status}`,
        }))}
      />
    )
  }

  if (section === "users" || section === "patients" || section === "activity") {
    return (
      <ListCard
        title={section === "activity" ? "Recent accounts" : "People"}
        icon={Activity}
        empty="No people to show yet."
        rows={users.slice(0, 8).map((item) => ({
          id: item.userid,
          title: item.fullName,
          meta: `${roleLabel(item.role)} · ${item.email}`,
        }))}
      />
    )
  }

  if (section === "finance" || section === "wallet") {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Transactions</p>
            <p className="mt-1 text-2xl font-semibold text-brand-dark">
              {money(data?.summary?.totalTransactions)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Revenue {money(data?.summary?.totalRevenue)}
            </p>
          </CardContent>
        </Card>
        <ListCard
          title="Latest payments"
          icon={Activity}
          empty="No payments yet."
          rows={tx.slice(0, 5).map((item) => ({
            id: item.transactionid,
            title: item.description || item.type,
            meta: `${item.amount} · ${item.status}`,
          }))}
        />
      </div>
    )
  }

  if (section === "consents") {
    const consents = data?.operationalMetrics?.consents
    const tiles = [
      { label: "Active", value: consents?.active ?? data?.summary?.activeConsents },
      { label: "Pending", value: consents?.pending },
      { label: "Revoked", value: consents?.revoked },
      { label: "Expired", value: consents?.expired },
    ]
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.label} className="border-blue-100 shadow-sm">
            <CardContent className="p-4">
              <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">{tile.label}</p>
              <p className="mt-1 text-xl font-semibold text-brand-dark">
                {typeof tile.value === "number" ? tile.value : "—"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (section === "health") {
    return <DailyHealthPanel />
  }

  if (section === "notifications") {
    return (
      <Card className="border-blue-100 shadow-sm">
        <CardContent className="flex items-start gap-3 p-5">
          <Bell className="mt-0.5 h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-brand-dark">No new alerts</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Appointment reminders, lab results, and payment notices will appear
              here.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">
        Nothing to show in this section yet.
      </CardContent>
    </Card>
  )
}

function MiniStat({ label, value }: { label: string; value?: number }) {
  return (
    <Card className="border-blue-100 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-brand-dark">
          {typeof value === "number" ? value.toLocaleString() : "—"}
        </p>
      </CardContent>
    </Card>
  )
}
