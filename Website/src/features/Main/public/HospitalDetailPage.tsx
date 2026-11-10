import { Link, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Building2,
  MapPin,
  Star,
  Stethoscope,
} from "lucide-react"
import {
  doctorIdOf,
  doctorNameOf,
  doctorPhotoOf,
  doctorSpecialtyOf,
  hospitalDoctorsCount,
  hospitalIdOf,
  hospitalLogoOf,
  hospitalNameOf,
  hospitalRatingOf,
  useGetDepartmentsQuery,
  useGetHospitalDoctorsQuery,
  useGetHospitalQuery,
} from "@/Redex/service/healthcare/HealthcareApi"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export default function HospitalDetailPage() {
  const { hospitalId = "" } = useParams()
  const {
    data: hospital,
    isLoading,
    isError,
    refetch,
  } = useGetHospitalQuery(hospitalId, { skip: !hospitalId })
  const { data: departments = [] } = useGetDepartmentsQuery(hospitalId, {
    skip: !hospitalId,
  })
  const { data: doctors = [], isLoading: doctorsLoading } =
    useGetHospitalDoctorsQuery(
      { hospitalId, limit: 40 },
      { skip: !hospitalId }
    )

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-brand-bg">
        <div className="container-page py-10">
          <div className="h-64 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    )
  }

  if (isError || !hospital) {
    return (
      <div className="min-h-[70vh] bg-brand-bg">
        <div className="container-page py-10">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center">
            <p className="text-sm text-rose-700">Hospital not found.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
              <Button asChild>
                <Link to="/hospitals">Back to hospitals</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const id = hospitalIdOf(hospital) || hospitalId
  const name = hospitalNameOf(hospital)
  const logo = hospitalLogoOf(hospital)
  const rating = hospitalRatingOf(hospital)
  const location = [hospital.city, hospital.country].filter(Boolean).join(", ")
  const doctorsCount = hospitalDoctorsCount(hospital) || doctors.length

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page space-y-6 py-10 sm:py-12">
        <Button asChild variant="ghost" className="-ml-2 w-fit text-brand-muted">
          <Link to="/hospitals">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Hospitals
          </Link>
        </Button>

        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-light">
              {logo ? (
                <img src={logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <Building2 className="h-8 w-8 text-primary/50" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {siteConfig.appName}
              </p>
              <h1 className="mt-1 font-heading text-3xl font-bold text-brand-dark">
                {name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="h-3.5 w-3.5 text-primary" />
                  {doctorsCount} doctors
                </span>
                {rating != null && !Number.isNaN(rating) ? (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                    {hospital.totalReviews
                      ? ` · ${hospital.totalReviews} reviews`
                      : ""}
                  </span>
                ) : null}
              </div>
              {hospital.publicDescription || hospital.description ? (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {String(hospital.publicDescription || hospital.description)}
                </p>
              ) : null}
              <div className="mt-5">
                <Button asChild>
                  <Link
                    to={`/healthcare/book?hospitalId=${encodeURIComponent(id)}`}
                  >
                    Book appointment
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-xl font-bold text-brand-dark">
            Departments
          </h2>
          {departments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No departments listed yet.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {departments.map((d) => (
                <span
                  key={String(d.departmentId || d.id || d.name)}
                  className="rounded-full bg-brand-light px-3 py-1.5 text-xs font-semibold text-brand-dark"
                >
                  {d.name || "Department"}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-bold text-brand-dark">
              Doctors
            </h2>
            <Button asChild variant="outline" className="border-primary/20">
              <Link
                to={`/healthcare/doctors?hospitalId=${encodeURIComponent(id)}`}
              >
                View all
              </Link>
            </Button>
          </div>

          {doctorsLoading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-2xl bg-brand-light"
                />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No doctors listed for this hospital yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((d) => {
                const docId = doctorIdOf(d)
                const photo = doctorPhotoOf(d)
                return (
                  <div
                    key={docId}
                    className="flex gap-3 rounded-2xl border border-blue-50 bg-brand-light/40 p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                      {photo ? (
                        <img
                          src={photo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary/50">
                          {doctorNameOf(d).slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-brand-dark">
                        {doctorNameOf(d)}
                      </p>
                      <p className="truncate text-xs text-primary">
                        {doctorSpecialtyOf(d)}
                      </p>
                      <Button
                        asChild
                        size="sm"
                        className="mt-2 h-8"
                        variant="outline"
                      >
                        <Link
                          to={`/healthcare/book?hospitalId=${encodeURIComponent(id)}&doctorId=${encodeURIComponent(docId)}`}
                        >
                          Book
                        </Link>
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
