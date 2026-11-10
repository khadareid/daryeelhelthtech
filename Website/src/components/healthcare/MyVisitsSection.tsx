import { useEffect, useMemo } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Building2, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MyHealthcareSection } from "@/components/healthcare/MyHealthcareSection"
import { AppointmentsSection } from "@/components/layout/HealthSections"

export type VisitsTab = "hospitals" | "daryeel"

function tabFromSearch(search: string, fallback: VisitsTab = "hospitals"): VisitsTab {
  const tab = new URLSearchParams(search).get("tab")
  if (tab === "daryeel" || tab === "doctors" || tab === "doctor") return "daryeel"
  if (tab === "hospitals" || tab === "hospital") return "hospitals"
  return fallback
}

export function MyVisitsSection({
  defaultTab = "hospitals",
}: {
  defaultTab?: VisitsTab
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const active = useMemo(
    () => tabFromSearch(location.search, defaultTab),
    [location.search, defaultTab]
  )

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const section = params.get("section")
    if (section === "appointments" && !params.get("tab")) {
      params.set("section", "healthcare")
      params.set("tab", "daryeel")
      navigate(`/dashboard?${params.toString()}`, { replace: true })
    }
  }, [location.search, navigate])

  const setTab = (tab: VisitsTab) => {
    const params = new URLSearchParams(location.search)
    params.set("section", "healthcare")
    params.set("tab", tab)
    // Drop hospital booking params when switching lists
    params.delete("hospitalId")
    if (tab !== "daryeel") params.delete("doctorId")
    navigate(`/dashboard?${params.toString()}`, { replace: true })
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Bookings
            </p>
            <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark">
              My Visits
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hospital bookings and Daryeel doctor bookings — pick a tab to view
              or book.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {active === "hospitals" ? (
              <Button asChild>
                <Link to="/dashboard?section=book">Book hospital</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/dashboard?section=doctors">Find Daryeel doctor</Link>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setTab("hospitals")}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition",
              active === "hospitals"
                ? "border-primary bg-brand-light shadow-sm"
                : "border-blue-100 bg-white hover:bg-brand-light/40"
            )}
          >
            <p className="inline-flex items-center gap-2 font-heading text-base font-bold text-brand-dark">
              <Building2 className="h-4 w-4 text-primary" />
              Hospitals
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              View hospital bookings · OPD tickets · book a hospital visit
            </p>
          </button>
          <button
            type="button"
            onClick={() => setTab("daryeel")}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition",
              active === "daryeel"
                ? "border-primary bg-brand-light shadow-sm"
                : "border-blue-100 bg-white hover:bg-brand-light/40"
            )}
          >
            <p className="inline-flex items-center gap-2 font-heading text-base font-bold text-brand-dark">
              <Stethoscope className="h-4 w-4 text-primary" />
              Daryeel doctors
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              View Daryeel doctor bookings · request a new visit
            </p>
          </button>
        </div>
      </div>

      {active === "hospitals" ? (
        <MyHealthcareSection embedded />
      ) : (
        <AppointmentsSection embedded />
      )}
    </div>
  )
}
