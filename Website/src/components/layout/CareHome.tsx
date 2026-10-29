import { FormEvent, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  FlaskConical,
  HeartPulse,
  MapPin,
  Pill,
  Search,
  Star,
  Stethoscope,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { DashboardData } from '@/Redex/service/Dashboard/Dashboard'
import {
  doctorName,
  doctorPhoto,
  hospitalCover,
  useGetPublicCareTeamQuery,
  useGetPublicHospitalsQuery,
} from '@/Redex/service/hospitals/HospitalsApi'
import { useGetNewsFeedQuery } from '@/Redex/service/news/NewsApi'
import { DailyHealthPanel } from './DailyHealthPanel'
import { siteConfig } from '@/config/site'

function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function initials(name?: string) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const SERVICES = [
  {
    title: 'Doctors',
    desc: 'Book a clinician',
    icon: Stethoscope,
    to: '/dashboard?section=doctors',
  },
  {
    title: 'Hospitals',
    desc: 'Find facilities',
    icon: MapPin,
    to: '/dashboard?section=hospitals',
  },
  {
    title: 'Health',
    desc: 'Daily log',
    icon: HeartPulse,
    to: '/dashboard?section=health',
  },
  {
    title: 'Appointments',
    desc: 'Your visits',
    icon: Calendar,
    to: '/dashboard?section=appointments',
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
  const [query, setQuery] = useState('')
  const { data: hospitalsData, isLoading: hospitalsLoading } =
    useGetPublicHospitalsQuery({ page: 1, limit: 9 })
  const { data: careTeam = [], isLoading: doctorsLoading } =
    useGetPublicCareTeamQuery()
  const { data: newsData } = useGetNewsFeedQuery({ page: 1, limit: 6 })
  const liveNews = newsData?.data ?? []

  const hospitals = hospitalsData?.data ?? []
  const firstName = name.split(' ')[0] || 'there'
  const upcomingList = data?.appointmentsOverview?.upcoming ?? []
  const appointments = upcomingList.slice(0, 2).map((upcoming) => ({
    id: upcoming.appointmentid,
    doctorName: upcoming.doctorName || upcoming.patientName || 'Care visit',
    specialty: upcoming.appointmentCode || 'Visit',
    hospital: siteConfig.appName,
    when: new Date(upcoming.scheduledAt).toLocaleString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }),
    status: upcoming.status.replace(/_/g, ' '),
  }))
  const prescriptions = data?.recentActivity?.recentPrescriptions ?? []
  const labOrders = data?.recentActivity?.recentLabOrders ?? []

  function onSearch(event: FormEvent) {
    event.preventDefault()
    const next = query.trim()
    navigate(
      next
        ? `/dashboard?section=doctors&q=${encodeURIComponent(next)}`
        : '/dashboard?section=doctors',
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
      {/* Greeting + search */}
      <section className="overflow-hidden rounded-2xl border border-blue-100/80 bg-white shadow-sm sm:rounded-3xl">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/15 sm:h-14 sm:w-14">
              <AvatarImage src={image || undefined} alt={name} />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate font-heading text-xl font-bold text-brand-dark sm:text-2xl">
                {greetingForNow()}, {firstName}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                Your care home · {siteConfig.appName}
              </p>
              {healthId ? (
                <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-primary sm:text-sm">
                  Patient ID · {healthId}
                </p>
              ) : null}
            </div>
          </div>
          <form onSubmit={onSearch} className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doctors, hospitals..."
              className="h-11 rounded-full border-blue-100 bg-brand-bg pl-10"
            />
          </form>
        </div>
      </section>

      {/* Services */}
      <section>
        <SectionHead title="Health services" />
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {SERVICES.map((service) => (
            <button
              key={service.title}
              type="button"
              onClick={() => navigate(service.to)}
              className="flex flex-col items-start gap-2 rounded-2xl border border-blue-100 bg-white p-3.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-4"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <service.icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-brand-dark">
                  {service.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {service.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Promo */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-brand-dark p-5 text-white shadow-lg shadow-primary/20 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-lg">
            <h2 className="font-heading text-xl font-bold sm:text-2xl">
              Better care, closer to home
            </h2>
            <p className="mt-2 text-sm text-white/90">
              Book clinicians, open hospitals, and keep labs & prescriptions in
              one place.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-fit rounded-full bg-white text-primary hover:bg-blue-50"
            onClick={() => navigate('/dashboard?section=doctors')}
          >
            Explore doctors
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </section>

      {/* Desktop: 2-col health + next visit */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <SectionHead
            title="Health Daily"
            action="Details"
            onAction={() => navigate('/dashboard?section=health')}
          />
          <div className="mt-3">
            <DailyHealthPanel soft />
          </div>
        </div>

        <section className="min-w-0">
          <SectionHead
            title="Next visit"
            action="All"
            onAction={() => navigate('/dashboard?section=appointments')}
          />
          <div className="mt-3 space-y-2.5">
            {appointments.length === 0 ? (
              <p className="rounded-2xl border border-blue-100 bg-white p-4 text-sm text-muted-foreground shadow-sm">
                No upcoming visits yet.
              </p>
            ) : null}
            {appointments.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-heading font-semibold text-brand-dark">
                      {item.doctorName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {item.specialty} · {item.hospital}
                    </p>
                    <p className="mt-1 text-sm text-brand-dark">{item.when}</p>
                  </div>
                  <Badge className="shrink-0 border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    {item.status}
                  </Badge>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Hospitals */}
      <section>
        <SectionHead
          title="Hospitals & clinics"
          action="See all"
          onAction={() => navigate('/dashboard?section=hospitals')}
        />
        <div className="scroll-snap-x mt-3 -mx-1 gap-3 px-1 pb-1">
          {hospitalsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 w-[min(72vw,240px)] shrink-0 animate-pulse snap-start rounded-2xl bg-white sm:w-56"
                />
              ))
            : hospitals.map((hospital) => (
                <Link
                  key={hospital.tenantId}
                  to={`/dashboard?section=hospitals&hospital=${encodeURIComponent(hospital.tenantId)}`}
                  className="w-[min(72vw,240px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-56"
                >
                  <img
                    src={hospitalCover(hospital)}
                    alt={hospital.companyName}
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                  <div className="space-y-1 p-3">
                    <p className="line-clamp-1 font-heading text-sm font-semibold text-brand-dark">
                      {hospital.companyName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {[hospital.city, hospital.country]
                          .filter(Boolean)
                          .join(' · ') || 'Location TBA'}
                      </span>
                    </p>
                    <p className="flex items-center gap-1 text-xs font-medium text-primary">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {Number(hospital.rating || 0).toFixed(1)}
                      {typeof hospital._count?.professionalProfiles === 'number'
                        ? ` · ${hospital._count.professionalProfiles} doctors`
                        : ''}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Doctors */}
      <section>
        <SectionHead
          title="Popular doctors"
          action="See all"
          onAction={() => navigate('/dashboard?section=doctors')}
        />
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {doctorsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-2xl bg-white"
                />
              ))
            : careTeam.slice(0, 4).map((doctor) => (
                <Link
                  key={doctor.professionalProfileId || doctor.doctorId}
                  to={`/doctors/${encodeURIComponent(
                    doctor.doctorId ||
                      doctor.user?.userId ||
                      doctor.professionalProfileId,
                  )}?hospital=${encodeURIComponent(doctor.hospitalId)}`}
                  className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:border-primary/30"
                >
                  <img
                    src={doctorPhoto(doctor)}
                    alt={doctorName(doctor)}
                    className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading font-semibold text-brand-dark">
                      {doctorName(doctor)}
                    </p>
                    <p className="truncate text-sm text-primary">
                      {doctor.specialization || 'General Physician'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doctor.hospitalName}
                      {doctor.consultationFee
                        ? ` · ${doctor.currency || 'USD'} ${doctor.consultationFee}`
                        : ''}
                    </p>
                  </div>
                </Link>
              ))}
        </div>
      </section>

      {/* Rx + Labs + Pharmacies — responsive grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ListBlock
          title="Prescriptions"
          action="Pharmacy"
          onAction={() => navigate('/dashboard?section=pharmacy')}
          icon={Pill}
        >
          {prescriptions.length === 0 ? (
            <p className="rounded-2xl border border-blue-100 bg-white p-3.5 text-sm text-muted-foreground shadow-sm">
              No prescriptions yet.
            </p>
          ) : (
            prescriptions.slice(0, 3).map((rx) => (
              <article
                key={rx.prescriptionid}
                className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm"
              >
                <p className="font-heading text-sm font-semibold text-brand-dark">
                  {rx.medication}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rx.prescriptionCode}
                </p>
                <Badge className="mt-2 border-0 bg-blue-50 text-primary hover:bg-blue-50">
                  {rx.status}
                </Badge>
              </article>
            ))
          )}
        </ListBlock>

        <ListBlock title="Laboratory" icon={FlaskConical}>
          {labOrders.length === 0 ? (
            <p className="rounded-2xl border border-blue-100 bg-white p-3.5 text-sm text-muted-foreground shadow-sm">
              No lab orders yet.
            </p>
          ) : (
            labOrders.slice(0, 3).map((lab) => (
              <article
                key={lab.laborderid}
                className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-sm"
              >
                <p className="font-heading text-sm font-semibold text-brand-dark">
                  {lab.testName}
                </p>
                <p className="text-xs text-muted-foreground">{lab.orderCode}</p>
                <Badge className="mt-2 border-0 bg-amber-50 text-amber-700 hover:bg-amber-50">
                  {lab.status}
                </Badge>
              </article>
            ))
          )}
        </ListBlock>

        <ListBlock
          title="Pharmacies"
          action="Open"
          onAction={() => navigate('/dashboard?section=pharmacy')}
          icon={Pill}
          className="md:col-span-2 xl:col-span-1"
        >
          <p className="rounded-2xl border border-blue-100 bg-white p-3.5 text-sm text-muted-foreground shadow-sm">
            No pharmacies listed yet.
          </p>
        </ListBlock>
      </div>

      {/* News */}
      <section>
        <SectionHead
          title="Health news & tips"
          action="See all"
          onAction={() => navigate('/news')}
        />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {liveNews.length === 0 ? (
            <p className="rounded-2xl border border-blue-100 bg-white p-4 text-sm text-muted-foreground shadow-sm sm:col-span-2 lg:col-span-3">
              No published news yet.
            </p>
          ) : (
            liveNews.map((news) => (
              <Link
                key={news.newspostid}
                to={`/news/${news.newspostid}`}
                className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="space-y-1 p-3.5 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {String(news.category || '').replace(/_/g, ' ')}
                  </p>
                  <h3 className="font-heading text-sm font-semibold leading-snug text-brand-dark sm:text-base">
                    {news.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {news.content}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function SectionHead({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-heading text-base font-semibold text-brand-dark sm:text-lg">
        {title}
      </h2>
      {action && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-semibold text-primary"
        >
          {action}
        </button>
      ) : null}
    </div>
  )
}

function ListBlock({
  title,
  action,
  onAction,
  icon: Icon,
  children,
  className = '',
}: {
  title: string
  action?: string
  onAction?: () => void
  icon: ComponentType<{ className?: string }>
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold text-brand-dark">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h2>
        {action && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-semibold text-primary"
          >
            {action}
          </button>
        ) : null}
      </div>
      <div className="space-y-2.5">{children}</div>
    </section>
  )
}
