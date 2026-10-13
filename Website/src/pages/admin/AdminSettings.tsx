import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useGetFeatureFlagsQuery,
  useGetNewsReportsQuery,
  useGetProfessionalApplicationsQuery,
  useReviewNewsReportMutation,
  useReviewProfessionalApplicationMutation,
  useUpdateFeatureFlagMutation,
} from '@/Redex/service/admin/AdminApi'

export default function AdminSettings() {
  const { data: flags = [], isLoading: flagsLoading } = useGetFeatureFlagsQuery()
  const { data: apps = [] } = useGetProfessionalApplicationsQuery()
  const { data: reports = [] } = useGetNewsReportsQuery()
  const [updateFlag] = useUpdateFeatureFlagMutation()
  const [reviewApp] = useReviewProfessionalApplicationMutation()
  const [reviewReport] = useReviewNewsReportMutation()

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Settings & governance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Feature modules, professional approvals, and news moderation.
        </p>
      </header>

      <section className="space-y-2 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
        <h2 className="font-heading font-semibold text-brand-dark">Modules</h2>
        {flagsLoading ? <Skeleton className="h-24 rounded-2xl" /> : null}
        {flags.map((f: any) => (
          <article
            key={f.featureflagid}
            className="flex items-center justify-between gap-3 rounded-2xl border border-blue-50 p-3"
          >
            <div>
              <p className="font-heading font-semibold text-brand-dark">
                {f.label}
              </p>
              <p className="text-xs text-muted-foreground">{f.key}</p>
            </div>
            <Button
              size="sm"
              variant={f.enabled ? 'default' : 'outline'}
              onClick={() =>
                updateFlag({ key: f.key, body: { enabled: !f.enabled } })
              }
            >
              {f.enabled ? 'Enabled' : 'Disabled'}
            </Button>
          </article>
        ))}
      </section>

      <section className="space-y-2 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
        <h2 className="font-heading font-semibold text-brand-dark">
          Professional applications
        </h2>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">No applications.</p>
        ) : null}
        {apps.map((app: any) => (
          <article
            key={app.professionalapplicationid}
            className="rounded-2xl border border-blue-50 p-3"
          >
            <p className="font-heading font-semibold text-brand-dark">
              {app.user?.fullName} → {app.requestedRole}
            </p>
            <p className="text-xs text-muted-foreground">
              {app.specialization || '—'} · {app.status}
            </p>
            {app.notes ? (
              <p className="mt-1 text-xs text-brand-dark">Reason: {app.notes}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() =>
                  reviewApp({
                    id: app.professionalapplicationid,
                    decision: 'APPROVED',
                  })
                }
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  const reason = prompt('Rejection reason') || 'Rejected'
                  reviewApp({
                    id: app.professionalapplicationid,
                    decision: 'REJECTED',
                    rejectionReason: reason,
                  })
                }}
              >
                Reject
              </Button>
            </div>
          </article>
        ))}
      </section>

      <section className="space-y-2 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
        <h2 className="font-heading font-semibold text-brand-dark">
          News reports
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open reports.</p>
        ) : null}
        {reports.map((r: any) => (
          <article
            key={r.newsreportid}
            className="rounded-2xl border border-blue-50 p-3"
          >
            <div className="flex items-center gap-2">
              <Badge>{r.reason}</Badge>
              <span className="text-sm font-semibold text-brand-dark">
                {r.post?.title || 'Comment report'}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  reviewReport({
                    id: r.newsreportid,
                    status: 'RESOLVED',
                    hideContent: true,
                  })
                }
              >
                Hide content
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  reviewReport({
                    id: r.newsreportid,
                    status: 'DISMISSED',
                  })
                }
              >
                Dismiss
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
