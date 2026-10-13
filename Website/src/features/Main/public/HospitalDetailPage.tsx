import type { ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Globe,
  MapPin,
  Phone,
  Star,
  Stethoscope,
} from 'lucide-react'
import {
  doctorName,
  doctorPhoto,
  hospitalAbout,
  hospitalCover,
  useGetPublicHospitalQuery,
  type PublicHospitalDoctor,
} from '@/Redex/service/hospitals/HospitalsApi'
import { Button } from '@/components/ui/button'
import { siteConfig } from '@/config/site'

export default function HospitalDetailPage() {
  const { tenantId = '' } = useParams()
  const { data: hospital, isLoading, isError, refetch } =
    useGetPublicHospitalQuery(tenantId, { skip: !tenantId })

  if (isLoading) {
    return (
      <div className="bg-brand-bg">
        <div className="h-72 animate-pulse bg-slate-200" />
        <div className="container-page space-y-4 py-8">
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-white" />
          <div className="h-4 w-1/2 animate-pulse rounded-xl bg-white" />
          <div className="h-40 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  if (isError || !hospital) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Hospital not found
        </h1>
        <p className="mt-2 text-muted-foreground">
          This facility is not available from the public hospitals API.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
          <Button asChild>
            <Link to="/hospitals">Back to hospitals</Link>
          </Button>
        </div>
      </div>
    )
  }

  const doctors = hospital.doctors ?? []

  return (
    <div className="bg-brand-bg pb-16">
      <div className="relative h-64 w-full overflow-hidden bg-brand-dark sm:h-80">
        <img
          src={hospitalCover(hospital)}
          alt={hospital.companyName}
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0">
          <div className="container-page pb-6">
            <Link
              to="/hospitals"
              className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-blue-100">
              <ArrowLeft className="h-4 w-4" /> All hospitals
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
              {siteConfig.appName}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-white sm:text-4xl">
              {hospital.companyName}
            </h1>
            <p className="mt-1 text-sky-100">
              {hospital.industry || 'Health facility'}
            </p>
          </div>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[1.45fr_1fr]">
        <section className="space-y-5">
          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-brand-dark">
              About
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {hospitalAbout(hospital)}
            </p>
            {hospital.description &&
            hospital.description !== hospital.publicDescription ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {hospital.description}
              </p>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Stat
                label="Rating"
                value={Number(hospital.rating || 0).toFixed(1)}
              />
              <Stat
                label="Reviews"
                value={String(hospital.totalReviews ?? 0)}
              />
              <Stat label="Doctors" value={String(doctors.length)} />
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-xl font-semibold text-brand-dark">
              Doctors at this facility
            </h2>
            <div className="mt-4 space-y-3">
              {doctors.length > 0 ? (
                doctors.map((doctor) => (
                  <DoctorCard key={doctor.professionalProfileId} doctor={doctor} />
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-blue-100 p-4 text-sm text-muted-foreground">
                  No public doctors listed for this hospital yet.
                </p>
              )}
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-3 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-semibold text-brand-dark">
            Details
          </h2>
          <Row
            icon={MapPin}
            text={
              [hospital.address, hospital.city, hospital.country]
                .filter(Boolean)
                .join(', ') || 'Location TBA'
            }
          />
          {hospital.phone ? (
            <a href={`tel:${hospital.phone}`} className="block">
              <Row icon={Phone} text={hospital.phone} accent />
            </a>
          ) : null}
          {hospital.website ? (
            <a
              href={hospital.website}
              target="_blank"
              rel="noreferrer"
              className="block">
              <Row icon={Globe} text={hospital.website} accent />
            </a>
          ) : null}
          <Row
            icon={Star}
            text={`★ ${Number(hospital.rating || 0).toFixed(1)} · ${hospital.totalReviews ?? 0} reviews`}
          />
          <Row
            icon={Stethoscope}
            text={`${doctors.length} doctors listed`}
          />
          {hospital.username ? (
            <p className="pt-2 text-xs text-muted-foreground">
              @{hospital.username}
            </p>
          ) : null}
          <Button asChild className="mt-4 w-full">
            <Link to="/doctors">Browse care team</Link>
          </Button>
        </aside>
      </div>
    </div>
  )
}

function DoctorCard({ doctor }: { doctor: PublicHospitalDoctor }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-brand-bg p-4 sm:flex-row sm:gap-4">
      <img
        src={doctorPhoto(doctor)}
        alt={doctorName(doctor)}
        className="h-16 w-16 rounded-2xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-brand-dark">
            {doctorName(doctor)}
          </h3>
          {doctor.isVerified ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          ) : null}
        </div>
        <p className="text-sm text-primary">
          {doctor.specialization || 'General Physician'}
          {doctor.subSpecialty ? ` · ${doctor.subSpecialty}` : ''}
        </p>
        {doctor.department?.name ? (
          <p className="text-xs text-muted-foreground">{doctor.department.name}</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {doctor.yearsOfExperience
            ? `${doctor.yearsOfExperience}+ yrs · `
            : ''}
          {doctor.consultationFee
            ? `${doctor.currency || 'USD'} ${doctor.consultationFee}`
            : 'Fee on request'}
        </p>
        {doctor.publicBio ? (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {doctor.publicBio}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to={`/doctors/${doctor.professionalProfileId}`}>
              Book / Chat
            </Link>
          </Button>
          {doctor.publicPhone ? (
            <Button asChild size="sm" variant="outline">
              <a href={`tel:${doctor.publicPhone}`}>
                <Phone className="mr-1 h-3.5 w-3.5" /> Call
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-brand-bg p-3 text-center">
      <p className="font-heading text-lg font-bold text-brand-dark">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

function Row({
  icon: Icon,
  text,
  accent,
}: {
  icon: ComponentType<{ className?: string }>
  text: string
  accent?: boolean
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-brand-dark">
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${accent ? 'text-primary' : 'text-primary/80'}`}
      />
      <span className={`break-all ${accent ? 'text-primary' : ''}`}>{text}</span>
    </div>
  )
}
