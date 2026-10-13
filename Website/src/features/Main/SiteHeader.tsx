import { useEffect, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  Activity,
  Calendar,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  User as UserIcon,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserProfileMenu } from "@/components/layout/UserProfileMenu"
import { siteConfig } from "@/config/site"
import { RootState } from "@/Redex/store/store"
import { cn } from "@/lib/utils"
import { useDispatch } from "react-redux"
import { logout } from "@/Redex/service/auth/Userinfo"

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/hospitals", label: "Hospitals" },
  { to: "/doctors", label: "Care Team" },
  { to: "/news", label: "News" },
  { to: "/#services", label: "Services" },
  { to: "/#how", label: "How it works" },
  { to: "/#contact", label: "Contact" },
]

const MOBILE_ACCOUNT = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/UserProfile", label: "My Profile", icon: UserIcon },
  { to: "/dashboard?section=doctors", label: "Doctors", icon: Stethoscope },
  { to: "/dashboard?section=appointments", label: "Appointments", icon: Calendar },
  { to: "/dashboard/UserProfile", label: "Settings", icon: Settings },
]

export default function SiteHeader() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, name, email, image, role } = useSelector(
    (s: RootState) => s.userInfo,
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

  const handleLogout = () => {
    dispatch(logout())
    navigate("/")
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-blue-100/80 bg-white/95 shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-white/80 backdrop-blur-md",
      )}
    >
      <div className="container-page flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 sm:h-10 sm:w-10">
            <HeartPulse className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-heading text-sm font-bold text-brand-dark sm:text-base">
              {siteConfig.appName}
            </p>
            <p className="hidden truncate text-[10px] text-muted-foreground sm:block">
              {siteConfig.tagline}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive && link.end
                    ? "bg-brand-light text-primary"
                    : "text-brand-muted hover:bg-brand-light hover:text-primary",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${siteConfig.supportPhone}`}
            className="hidden items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100 transition hover:bg-red-100 xl:inline-flex"
          >
            <Activity className="h-3.5 w-3.5" />
            Emergency 24/7
          </a>

          {isAuthenticated ? (
            <UserProfileMenu
              userName={name || "User"}
              userEmail={email || ""}
              userImage={image || ""}
              userRole={role || "USER"}
            />
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" onClick={() => navigate("/signin")}>
                Sign in
              </Button>
              <Button
                onClick={() => navigate("/SignUp")}
                className="bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
              >
                Get started
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-blue-50 bg-white lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive && link.end
                      ? "bg-brand-light text-primary"
                      : "text-brand-muted",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}

            <a
              href={`tel:${siteConfig.supportPhone}`}
              className="mt-1 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600"
            >
              <Activity className="h-4 w-4" />
              Emergency · 24/7
            </a>

            {isAuthenticated ? (
              <div className="mt-2 grid gap-1 border-t border-blue-50 pt-3">
                {MOBILE_ACCOUNT.map(({ to, label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => navigate(to)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand-dark hover:bg-brand-light"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    {label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            ) : (
              <div className="mt-2 flex gap-2 border-t border-blue-50 pt-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/signin")}
                >
                  Sign in
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/SignUp")}
                >
                  Get started
                </Button>
              </div>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  )
}
