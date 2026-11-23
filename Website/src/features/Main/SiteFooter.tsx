import { Link } from "react-router-dom"
import { HeartPulse } from "lucide-react"
import { siteConfig } from "@/config/site"

const COLUMNS = [
  {
    title: "For Patients",
    links: [
      { to: "/doctors", label: "Find Doctors" },
      { to: "/hospitals", label: "Find Hospitals" },
      { to: "/healthcare/book", label: "Appointments" },
      { to: "/dashboard?section=records", label: "Health Records" },
      { to: "/#telemedicine", label: "Telemedicine" },
    ],
  },
  {
    title: "For Providers",
    links: [
      { to: "/hospitals", label: "Hospitals" },
      { to: "/doctors", label: "Doctors" },
      { to: "/#laboratory", label: "Laboratories" },
      { to: "/#pharmacy", label: "Pharmacies" },
      { to: "/signin", label: "Provider Login" },
    ],
  },
  {
    title: "Daryeel",
    links: [
      { to: "/about", label: "About" },
      { to: "/care", label: "Care" },
      { to: "/training", label: "Training" },
      { to: "/events", label: "Events" },
      { to: "/insights", label: "Insights" },
      { to: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/contact", label: "Help Center" },
      { to: "/privacy", label: "Privacy" },
      { to: "/terms", label: "Terms" },
      {
        to: `mailto:${siteConfig.supportEmail}`,
        label: "Email Support",
        external: true,
      },
    ],
  },
] as const

export default function SiteFooter() {
  return (
    <footer className="border-t border-blue-100 bg-white">
      <div className="container-page py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_2fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25">
                <HeartPulse className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-heading text-base font-bold text-brand-dark">
                  {siteConfig.appName}
                </span>
                <span className="block text-xs text-muted-foreground">
                  Caafimaadkaaga, Gacantaada.
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Find care, connect with healthcare providers, and manage your
              healthcare journey in one connected platform.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-dark">
                  {col.title}
                </p>
                <ul className="mt-3 space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.to}
                          className="text-sm text-muted-foreground transition hover:text-primary"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.to}
                          className="text-sm text-muted-foreground transition hover:text-primary"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-blue-50 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Daryeel Healthtech. All rights
            reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link to="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-primary">
              Terms
            </Link>
            <span>Hargeisa · Somaliland · East Africa</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
