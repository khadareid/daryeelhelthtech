import { FormEvent, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Activity,
  ArrowRight,
  Calendar,
  HeartPulse,
  Pill,
  Search,
  ShieldAlert,
  Stethoscope,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DashboardData } from "@/Redex/service/Dashboard/Dashboard"
import {
  doctorDisplayName,
  doctorPhoto,
  useListDoctorsQuery,
} from "@/Redex/service/doctors/DoctorsApi"
import { DailyHealthPanel } from "./DailyHealthPanel"
import { siteConfig } from "@/config/site"

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function initials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const SERVICES = [
  {
    title: "Doctors",
    desc: "Book a clinician",
    icon: Stethoscope,
    to: "/dashboard?section=doctors",
  },
  {
    title: "Vitals",
    desc: "Log BP & HR",
    icon: Activity,
    to: "/dashboard?section=vitals",
  },
  {
    title: "Health",
    desc: "Daily log",
    icon: HeartPulse,
    to: "/dashboard?section=health",
  },
  {
    title: "Visits",
    desc: "Book & confirm",
    icon: Calendar,
    to: "/dashboard?section=appointments",
  },
  {
    title: "Payments",
    desc: "Free or pay fee",
    icon: Pill,
    to: "/dashboard?section=payments",
  },
  {
    title: "Records",
    desc: "Visits, labs, docs",
    icon: Activity,
    to: "/dashboard?section=records",
  },
  {
    title: "Emergency",
    desc: "Card & contacts",
    icon: ShieldAlert,
    to: "/dashboard?section=emergency",
  },
]

export function CareHome({
  name,
  image,
  data,
  healthId,
}: {
  name: string
  image?: string
  data?: DashboardData
  healthId?: string | null
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const { data: doctors = [], isLoading: doctorsLoading } = useListDoctorsQuery({
    limit: 8,
  })

  const firstName = name.split(" ")[0] || "there"
  const upcomingList = data?.appointmentsOverview?.upcoming ?? []

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/doctors?q=${encodeURIComponent(q)}` : "/doctors")
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-[#F5F9FF] to-[#E8F1FF] p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
            <AvatarImage src={image || undefined} alt={name} />
            <AvatarFallback className="bg-primary text-white">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              {siteConfig.appName}
            </p>
            <h1 className="mt-1 font-heading text-2xl font-bold text-brand-dark sm:text-3xl">
              {greetingForNow()}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your health records, doctors, and daily log — in one place.
              {healthId ? ` Health ID ${healthId}` : ""}
            </p>
          </div>
        </div>

        <form onSubmit={onSearch} className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors by name or specialty…"
            className="h-11 rounded-2xl border-blue-100 bg-white pl-10"
          />
        </form>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SERVICES.map((s) => (
            <button
              key={s.title}
              type="button"
              onClick={() => navigate(s.to)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-2 py-3 text-center shadow-sm transition hover:border-primary/30 hover:bg-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-primary">
                <s.icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold text-brand-dark sm:text-[11px]">
                {s.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {upcomingList.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold text-brand-dark">
              Upcoming visits
            </h2>
            <Link
              to="/dashboard?section=appointments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              See all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {upcomingList.slice(0, 2).map((a) => (
              <div
                key={a.id || a.appointmentid}
                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
              >
                <p className="font-semibold text-brand-dark">
                  {a.doctorName || "Appointment"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(a.scheduledAt).toLocaleString()} · {a.status}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-brand-dark">
            Featured doctors
          </h2>
          <Link
            to="/dashboard?section=doctors"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
          >
            Browse <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {doctorsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-blue-50 bg-gradient-to-br from-white to-blue-50/60"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.slice(0, 4).map((d) => (
              <Link
                key={d.id}
                to={`/doctors/${d.id}`}
                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm transition hover:border-primary/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={doctorPhoto(d)} />
                    <AvatarFallback>
                      {doctorDisplayName(d).slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-dark">
                      {doctorDisplayName(d)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {d.specialty}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!doctorsLoading && doctors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No doctors listed yet. Check back soon.
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-brand-dark">
            Today&apos;s health
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/dashboard?section=health")}
          >
            Open log
          </Button>
        </div>
        <DailyHealthPanel compact />
      </section>
    </div>
  )
}
