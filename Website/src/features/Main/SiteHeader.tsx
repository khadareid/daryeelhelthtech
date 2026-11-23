import { useEffect, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import {
  Activity,
  Calendar,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Phone,
  Settings,
  Stethoscope,
  User as UserIcon,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserProfileMenu } from "@/components/layout/UserProfileMenu"
import { InstallAppButton } from "@/components/pwa/InstallAppButton"
import { siteConfig } from "@/config/site"
import { RootState } from "@/Redex/store/store"
import { cn } from "@/lib/utils"
import { logout } from "@/Redex/service/auth/Userinfo"

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/hospitals", label: "Hospitals" },
  { to: "/doctors", label: "Doctors" },
  {
    to: "/about",
    label: "About",
    match: ["/about", "/about/management-staff", "/about/team"],
  },
  { to: "/care", label: "Care" },
  { to: "/training", label: "Training" },
  { to: "/events", label: "Events" },
  { to: "/insights", label: "Insights" },
  { to: "/contact", label: "Contact" },
] as const

const MOBILE_ACCOUNT = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/UserProfile", label: "My Profile", icon: UserIcon },
  { to: "/dashboard?section=hospitals", label: "Hospitals", icon: Stethoscope },
  { to: "/dashboard?section=book", label: "Book hospital", icon: Calendar },
  { to: "/dashboard?section=healthcare", label: "My Visits", icon: Calendar },
  { to: "/dashboard?section=doctors", label: "Daryeel doctors", icon: Stethoscope },
  { to: "/dashboard/UserProfile", label: "Settings", icon: Settings },
]

function isNavActive(
  pathname: string,
  link: (typeof NAV_LINKS)[number]
): boolean {
  if ("hash" in link && link.hash) return false
  if ("end" in link && link.end) return pathname === "/"
  if ("match" in link && link.match) {
    return link.match.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  }
  return pathname === link.to || pathname.startsWith(`${link.to}/`)
}

export default function SiteHeader() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, name, email, image, role } = useSelector(
    (s: RootState) => s.userInfo
  )
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  const handleLogout = () => {
    dispatch(logout())
    navigate("/")
  }

  const emergencyHref = `tel:${siteConfig.supportPhone}`

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled || mobileOpen
          ? "border-b border-blue-100/80 bg-white/95 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-white/85 backdrop-blur-md"
      )}
    >
      {/* Top utility strip — emergency visible early on mobile */}
      <div className="border-b border-blue-50/80 bg-gradient-to-r from-brand-light via-white to-brand-light">
        <div className="container-page flex h-8 items-center justify-between gap-2 text-[11px] sm:h-9 sm:text-xs">
          <p className="truncate font-medium text-brand-muted">
            <span className="hidden sm:inline">
              Your Health. Your Care. One Connected Platform.
            </span>
            <span className="sm:hidden">{siteConfig.tagline}</span>
          </p>
          <a
            href={emergencyHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            <Activity className="h-3 w-3" />
            Emergency 24/7
          </a>
        </div>
      </div>

      <div className="container-page flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        {/* Brand */}
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/30 sm:h-11 sm:w-11">
            <HeartPulse className="h-5 w-5 sm:h-[22px] sm:w-[22px]" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-heading text-[15px] font-bold tracking-tight text-brand-dark sm:text-lg">
              Daryeel Health
            </p>
            <p className="truncate text-[10px] font-medium text-primary/80 sm:text-[11px]">
              Caafimaadkaaga, Gacantaada
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => {
            const active = isNavActive(location.pathname, link)
            const className = cn(
              "rounded-lg px-2 py-2 text-[13px] font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-brand-light text-primary"
                : "text-brand-muted hover:bg-brand-light hover:text-primary"
            )
            if ("hash" in link && link.hash) {
              return (
                <a key={link.label} href={link.to} className={className}>
                  {link.label}
                </a>
              )
            }
            return (
              <NavLink
                key={link.label}
                to={link.to}
                end={"end" in link ? link.end : false}
                className={className}
              >
                {link.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={emergencyHref}
            className="hidden items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100 md:inline-flex xl:hidden"
            aria-label="Call emergency line"
          >
            <Phone className="h-3.5 w-3.5" />
            24/7
          </a>

          <InstallAppButton
            variant="compact"
            className="hidden lg:inline-flex"
          />

          {isAuthenticated ? (
            <UserProfileMenu
              userName={name || "User"}
              userEmail={email || ""}
              userImage={image || ""}
              userRole={role || "USER"}
            />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button
                variant="ghost"
                className="h-9 px-3 text-brand-dark"
                onClick={() => navigate("/signin")}
              >
                Login
              </Button>
              <Button
                className="h-9 bg-primary px-4 text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
                onClick={() => navigate("/SignUp")}
              >
                Get Started
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-blue-100 xl:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile / tablet drawer */}
      {mobileOpen ? (
        <div className="border-t border-blue-50 bg-white xl:hidden">
          <div className="container-page max-h-[calc(100dvh-6.5rem)] overflow-y-auto py-3 pb-6">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map((link) => {
                const active = isNavActive(location.pathname, link)
                const className = cn(
                  "rounded-xl px-3 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-brand-light text-primary"
                    : "text-brand-dark hover:bg-brand-light/70"
                )
                if ("hash" in link && link.hash) {
                  return (
                    <a key={link.label} href={link.to} className={className}>
                      {link.label}
                    </a>
                  )
                }
                return (
                  <NavLink key={link.label} to={link.to} className={className}>
                    {link.label}
                  </NavLink>
                )
              })}
            </nav>

            <a
              href={emergencyHref}
              className="mt-3 flex items-center justify-between rounded-2xl bg-gradient-to-r from-red-50 to-red-100/60 px-4 py-3.5 ring-1 ring-red-100"
            >
              <span className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm">
                  <Activity className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-red-700">
                    Emergency 24/7
                  </span>
                  <span className="block text-xs text-red-600/80">
                    Tap to call {siteConfig.supportPhone}
                  </span>
                </span>
              </span>
              <Phone className="h-4 w-4 text-red-600" />
            </a>

            <div className="mt-3">
              <InstallAppButton variant="menu" />
            </div>

            {isAuthenticated ? (
              <div className="mt-3 grid gap-1 border-t border-blue-50 pt-3">
                {MOBILE_ACCOUNT.map(({ to, label, icon: Icon }) => (
                  <button
                    key={`${label}-${to}`}
                    type="button"
                    onClick={() => navigate(to)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium text-brand-dark hover:bg-brand-light"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-col gap-2 border-t border-blue-50 pt-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-blue-100"
                  onClick={() => navigate("/signin")}
                >
                  Login
                </Button>
                <Button
                  className="h-11 flex-1 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/SignUp")}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
