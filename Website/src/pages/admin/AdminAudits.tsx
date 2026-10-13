import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetAuditLogsQuery } from '@/Redex/service/admin/AdminApi'

export default function AdminAudits() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useGetAuditLogsQuery({
    page,
    limit: 30,
    search: search || undefined,
  })
  const rows = data?.data ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Audit logs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform actions across users, plans, CMS, and moderation.
        </p>
        <Input
          className="mt-4"
          placeholder="Search action, entity, user id…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </header>
      <section className="space-y-2 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
        {isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
        {rows.map((log: any) => (
          <article
            key={log.auditlogid}
            className="rounded-2xl border border-blue-50 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-heading font-semibold text-brand-dark">
                {log.action}
              </p>
              <span className="text-xs text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {log.entity || '—'} {log.entityId ? `· ${log.entityId}` : ''} ·{' '}
              {log.user?.fullName || log.userId || 'system'}
            </p>
          </article>
        ))}
        {rows.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">No audit events yet.</p>
        ) : null}
        <div className="flex items-center justify-between pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {pagination?.page ?? page} / {pagination?.totalPages ?? 1}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={(pagination?.page ?? 1) >= (pagination?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  )
}
