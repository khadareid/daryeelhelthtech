import { Link } from "react-router-dom"
import { useSelector } from "react-redux"
import {
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings2,
  Stethoscope,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminShell"
import { RootState } from "@/Redex/store/store"
import { siteConfig } from "@/config/site"
import { enumLabel } from "@/lib/enums"

const LINKS = [
  {
    to: "/admin/dashboard",
    title: "Overview",
    desc: "Live KPIs and recent activity",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/users",
    title: "Users",
    desc: "Create, edit, suspend, or delete accounts",
    icon: Users,
  },
  {
    to: "/admin/doctors",
    title: "Doctors",
    desc: "Verify clinicians and manage fees",
    icon: Stethoscope,
  },
  {
    to: "/admin/appointments",
    title: "Bookings",
    desc: "Confirm, cancel, or reopen visits",
    icon: CalendarCheck,
  },
  {
    to: "/admin/payments",
    title: "Payments",
    desc: "Invoices, Zaad / eDahab, refunds",
    icon: CreditCard,
  },
  {
    to: "/admin/audits",
    title: "Audits",
    desc: "Review platform actions",
    icon: FileText,
  },
]

export default function AdminSettings() {
  const session = useSelector((s: RootState) => s.userInfo)
  const role = String(session.role || "").toUpperCase()
  const isSuper = role === "SUPER_ADMIN"

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={isSuper ? "Super Admin" : "Admin"}
        title="Settings"
        subtitle="Platform identity, operator role, and management shortcuts."
        actions={
          <Button asChild size="sm" variant="outline" className="h-8 rounded-lg border-blue-100">
            <Link to="/admin/dashboard">Back to overview</Link>
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <AdminPanel title="Platform">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Item label="App name" value={siteConfig.appName} />
            <Item label="Support email" value={siteConfig.supportEmail || "—"} />
            <Item label="Support phone" value={siteConfig.supportPhone || "—"} />
            <Item label="Signed in as" value={session.name || "—"} />
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Role
              </dt>
              <dd className="mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {enumLabel(role)}
                </Badge>
              </dd>
            </div>
            <Item
              label="Permissions"
              value={
                isSuper
                  ? "Full control · create admins · delete users"
                  : "Manage users, doctors, bookings, payments"
              }
            />
          </dl>
        </AdminPanel>

        <AdminPanel title="Operator tips">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="rounded-lg border border-blue-50 bg-brand-light/40 px-3 py-2">
              Doctor fee <strong className="text-brand-dark">0</strong> makes
              visits free; set a fee for Zaad / eDahab invoices.
            </li>
            <li className="rounded-lg border border-blue-50 bg-brand-light/40 px-3 py-2">
              Enable <strong className="text-brand-dark">Video</strong> /{" "}
              <strong className="text-brand-dark">Chat</strong> on doctor edit
              for remote visit features.
            </li>
            <li className="rounded-lg border border-blue-50 bg-brand-light/40 px-3 py-2">
              Suspend users to block login without deleting history; deactivate
              doctors to hide them from the directory.
            </li>
          </ul>
        </AdminPanel>
      </div>

      <AdminPanel
        title="Management modules"
        action={
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Settings2 className="h-3 w-3" />
            Same view style as Overview
          </span>
        }
      >
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-start gap-3 rounded-lg border border-blue-50 bg-brand-light/40 px-3 py-2.5 transition hover:border-primary/30 hover:bg-white"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <p className="text-sm font-semibold text-brand-dark">
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {item.desc}
                </p>
              </span>
            </Link>
          ))}
        </div>
      </AdminPanel>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-brand-dark">{value}</dd>
    </div>
  )
}
