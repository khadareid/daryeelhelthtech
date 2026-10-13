import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetAdminStatsQuery } from '@/Redex/service/admin/AdminApi'

export default function AdminDashboard() {
  const { data: stats, isLoading } = useGetAdminStatsQuery()
  const t = stats?.totals

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Platform control
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-dark">
          Super Admin overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Users, plans, subscriptions, homepage CMS, and live system metrics.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Quick to="/admin/users" label="Manage users" />
          <Quick to="/admin/plans" label="Plans" />
          <Quick to="/admin/subscriptions" label="Subscriptions" />
          <Quick to="/admin/cms" label="Homepage CMS" />
        </div>
      </header>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Users" value={t?.users} />
          <Stat label="Patients" value={t?.patients} />
          <Stat label="Professionals" value={t?.professionals} />
          <Stat label="Pending apps" value={t?.pendingApplications} />
          <Stat label="Active users" value={t?.activeUsers} />
          <Stat label="Suspended" value={t?.suspendedUsers} />
          <Stat label="Plans" value={t?.plans} />
          <Stat label="Active subscriptions" value={t?.activeSubscriptions} />
          <Stat label="Appointments" value={t?.appointments} />
          <Stat label="Messages" value={t?.messages} />
          <Stat label="News posts" value={t?.newsPosts} />
          <Stat label="Open reports" value={t?.openNewsReports} />
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Users by role">
          {(stats?.usersByRole ?? []).map((r: any) => (
            <Row key={r.role} label={r.role} value={r.count} />
          ))}
        </Card>
        <Card title="Appointments by status">
          {(stats?.appointmentsByStatus ?? []).map((r: any) => (
            <Row key={r.status} label={r.status} value={r.count} />
          ))}
          {(stats?.appointmentsByStatus ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments yet.</p>
          ) : null}
        </Card>
        <Card title="Recent registrations">
          {(stats?.recentRegistrations ?? []).map((u: any) => (
            <Row
              key={u.userid}
              label={`${u.fullName} · ${u.role}`}
              value={new Date(u.createdAt).toLocaleDateString()}
            />
          ))}
        </Card>
        <Card title="Recent admin activity">
          {(stats?.recentAdminActivity ?? []).map((a: any) => (
            <Row
              key={a.auditlogid}
              label={a.action}
              value={new Date(a.createdAt).toLocaleString()}
            />
          ))}
        </Card>
      </div>
    </div>
  )
}

function Quick({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="rounded-full border border-blue-100 bg-brand-bg px-3 py-1.5 text-xs font-semibold text-brand-dark"
    >
      {label}
    </Link>
  )
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-heading text-2xl font-bold text-brand-dark">
        {value ?? '—'}
      </p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <h3 className="font-heading font-semibold text-brand-dark">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-brand-dark">{label}</span>
      <span className="shrink-0 text-muted-foreground">{value}</span>
    </div>
  )
}
