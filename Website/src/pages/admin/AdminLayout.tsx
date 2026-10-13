import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  Newspaper,
  Settings2,
  ShieldCheck,
  Users,
  ClipboardList,
} from 'lucide-react'
import { RootState } from '@/Redex/store/store'
import { cn } from '@/lib/utils'
import { siteConfig } from '@/config/site'

const NAV = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/plans', label: 'Plans', icon: CreditCard },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: ClipboardList },
  { to: '/admin/cms', label: 'Homepage CMS', icon: Newspaper },
  { to: '/admin/audits', label: 'Audits', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings2 },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)
  const role = String(session.role || '').toUpperCase()
  const allowed = role === 'SUPER_ADMIN' || role === 'ADMIN'

  useEffect(() => {
    if (!signedIn) {
      navigate('/signin', { replace: true })
      return
    }
    if (!allowed) {
      navigate('/dashboard', { replace: true })
    }
  }, [signedIn, allowed, navigate])

  if (!signedIn || !allowed) return null

  const isSuper = role === 'SUPER_ADMIN'

  return (
    <div className="min-h-[100dvh] bg-[#F0F4FA]">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-heading text-base font-bold text-brand-dark">
                {siteConfig.appName} Super Admin
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.name} · {role}
                {!isSuper ? ' · limited (no plans/CMS write)' : ''}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              to="/dashboard"
              className="rounded-full border border-blue-100 px-3 py-1.5 text-xs font-semibold text-brand-dark"
            >
              Care app
            </Link>
            <Link
              to="/"
              className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white"
            >
              Public site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[220px_1fr] lg:px-6">
        <aside className="rounded-2xl border border-blue-100 bg-white p-2 shadow-sm lg:sticky lg:top-4 lg:h-fit">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((item) => {
              const locked =
                !isSuper &&
                (item.to.includes('/plans') ||
                  item.to.includes('/subscriptions') ||
                  item.to.includes('/cms'))
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-brand-dark hover:bg-brand-bg',
                      locked && 'opacity-60',
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0 pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
