import { FormEvent, useEffect, useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  Bell,
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react"
import { RootState } from "@/Redex/store/store"
import { cn } from "@/lib/utils"
import { siteConfig } from "@/config/site"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useGetUnreadCountQuery,
  useListNotificationsQuery,
} from "@/Redex/service/notifications/NotificationsApi"
import { useGetAdminStatsQuery } from "@/Redex/service/admin/AdminApi"
import { enumLabel } from "@/lib/enums"

const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/admin/appointments", label: "Bookings", icon: CalendarCheck },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/audits", label: "Audits", icon: FileText },
  { to: "/admin/settings", label: "Settings", icon: Settings2 },
]

function initials(name?: string) {
  if (!name) return "SA"
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const role = String(session.role || "").toUpperCase()
  const allowed = role === "SUPER_ADMIN" || role === "ADMIN"
  const [query, setQuery] = useState("")
  const [notifOpen, setNotifOpen] = useState(false)

  const { refetch: refetchStats, isFetching: statsFetching } =
    useGetAdminStatsQuery(undefined, { skip: !allowed })
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !signedIn || !allowed,
  })
  const unread = unreadData?.unreadCount ?? 0
  const { data: notifications = [] } = useListNotificationsQuery(
    { limit: 8 },
    { skip: !signedIn || !allowed || !notifOpen }
  )

  useEffect(() => {
    if (!signedIn) {
      navigate("/signin", { replace: true })
      return
    }
    if (!allowed) {
      navigate("/dashboard", { replace: true })
    }
  }, [signedIn, allowed, navigate])

  const onSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/admin/users?search=${encodeURIComponent(q)}` : "/admin/users")
  }

  const refresh = () => {
    void refetchStats()
  }

  if (!signedIn || !allowed) return null

  return (
    <div className="min-h-[100dvh] bg-[#F0F4FA]">
      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-3 py-2.5 sm:px-5 lg:px-6">
          <Link to="/admin/dashboard" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="truncate font-heading text-sm font-bold leading-tight text-brand-dark">
                {siteConfig.appName}
              </p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-primary">
                {role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
              </p>
            </div>
          </Link>

          <form
            onSubmit={onSearch}
            className="relative ml-auto hidden min-w-0 flex-1 max-w-md md:block"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users…"
              className="h-9 rounded-lg border-blue-100 bg-brand-light/40 pl-9 text-sm"
            />
          </form>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 rounded-lg border-blue-100 px-2.5"
              onClick={refresh}
              disabled={statsFetching}
              title="Refresh dashboard data"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", statsFetching && "animate-spin")}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <div className="relative">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="relative h-9 rounded-lg border-blue-100 px-2.5"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="h-3.5 w-3.5" />
                {unread > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                ) : null}
              </Button>
              {notifOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Close notifications"
                    onClick={() => setNotifOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
                    <div className="border-b border-blue-50 px-3 py-2">
                      <p className="text-xs font-semibold text-brand-dark">
                        Notifications
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {unread} unread
                      </p>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="p-3 text-xs text-muted-foreground">
                          No notifications.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id || n.notificationid}
                            className="border-b border-blue-50 px-3 py-2.5 last:border-0"
                          >
                            <p className="text-xs font-semibold text-brand-dark">
                              {n.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                              {n.body}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-brand-light/40 py-1 pl-1 pr-2.5">
              <Avatar className="h-7 w-7">
                <AvatarImage src={session.image || undefined} alt={session.name} />
                <AvatarFallback className="bg-primary text-[10px] font-bold text-white">
                  {initials(session.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[120px] truncate text-xs font-semibold text-brand-dark">
                  {session.name || "Admin"}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {enumLabel(role)}
                </p>
              </div>
            </div>

            <Link
              to="/dashboard"
              className="hidden rounded-lg border border-blue-100 px-2.5 py-1.5 text-[11px] font-semibold text-brand-dark lg:inline-flex"
            >
              Care app
            </Link>
          </div>
        </div>

        <form
          onSubmit={onSearch}
          className="relative border-t border-blue-50 px-3 py-2 md:hidden"
        >
          <Search className="pointer-events-none absolute left-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="h-9 rounded-lg border-blue-100 bg-brand-light/40 pl-9 text-sm"
          />
        </form>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[200px_1fr] lg:px-6">
        <aside className="rounded-xl border border-blue-100 bg-white p-1.5 shadow-sm lg:sticky lg:top-[4.5rem] lg:h-fit">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-[13px] font-medium transition",
                    isActive
                      ? "bg-primary text-white"
                      : "text-brand-dark hover:bg-brand-light"
                  )
                }
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
