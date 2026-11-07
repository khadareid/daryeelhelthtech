import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AdminDrawer,
  AdminPageHeader,
  AdminPagination,
  AdminStatusPill,
  AdminTable,
  AdminToolbar,
} from "@/components/admin/AdminShell"
import { useGetAuditLogsQuery } from "@/Redex/service/admin/AdminApi"
import type { AuditLog } from "@/Redex/types/Types"
import { enumLabel } from "@/lib/enums"

export default function AdminAudits() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const { data, isLoading, isError, refetch } = useGetAuditLogsQuery({
    page,
    limit: 30,
    search: search || undefined,
  })
  const rows = data?.items ?? []
  const meta = data?.meta

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow="Admin"
        title="Audits"
        subtitle="Platform actions across users, doctors, bookings, and health data."
        meta={
          meta?.total != null
            ? `${meta.total.toLocaleString()} audit events`
            : undefined
        }
      />

      <AdminToolbar>
        <Input
          className="h-9 flex-1 rounded-lg border-blue-100 sm:min-w-[220px]"
          placeholder="Search action, entity, user…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
      </AdminToolbar>

      {isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}

      {isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center">
          <p className="text-sm font-semibold text-rose-700">
            Could not load audit logs
          </p>
          <Button size="sm" className="mt-3" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <AdminTable
        columns={["When", "Action", "Entity", "Actor", "Status", "Actions"]}
        empty={
          !isLoading && rows.length === 0 ? "No audit events yet." : undefined
        }
        minWidth="860px"
      >
        {rows.map((log) => (
          <tr key={log.id} className="border-t border-blue-50">
            <td className="px-3 py-2.5 text-xs text-muted-foreground">
              {log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}
            </td>
            <td className="px-3 py-2.5">
              <Badge variant="secondary" className="text-[10px]">
                {enumLabel(String(log.action))}
              </Badge>
            </td>
            <td className="px-3 py-2.5 text-sm">
              <p className="font-medium text-brand-dark">{log.entity || "—"}</p>
              <p className="text-[11px] text-muted-foreground">
                {log.entityId || ""}
              </p>
            </td>
            <td className="px-3 py-2.5 text-sm">
              <p className="font-medium text-brand-dark">
                {log.user?.fullName || log.userId || "System"}
              </p>
              {log.user?.email ? (
                <p className="text-[11px] text-muted-foreground">
                  {log.user.email}
                </p>
              ) : null}
            </td>
            <td className="px-3 py-2.5">
              <AdminStatusPill tone="ok" label="Logged" />
            </td>
            <td className="px-3 py-2.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => setSelected(log)}
              >
                View
              </Button>
            </td>
          </tr>
        ))}
      </AdminTable>

      <AdminPagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onPage={setPage}
      />

      <AdminDrawer
        open={Boolean(selected)}
        title="Audit event"
        subtitle={selected ? enumLabel(String(selected.action)) : undefined}
        onClose={() => setSelected(null)}
        footer={
          <Button variant="outline" onClick={() => setSelected(null)}>
            Close
          </Button>
        }
      >
        {selected ? (
          <dl className="space-y-3 text-sm">
            <Row
              label="When"
              value={
                selected.createdAt
                  ? new Date(selected.createdAt).toLocaleString()
                  : "—"
              }
            />
            <Row label="Action" value={enumLabel(String(selected.action))} />
            <Row label="Entity" value={selected.entity || "—"} />
            <Row label="Entity ID" value={selected.entityId || "—"} />
            <Row
              label="Actor"
              value={
                selected.user?.fullName ||
                selected.user?.email ||
                selected.userId ||
                "System"
              }
            />
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Metadata
              </dt>
              <dd className="mt-1 overflow-x-auto rounded-lg bg-brand-light/50 p-3 font-mono text-[11px] text-brand-dark">
                {selected.metadata || selected.meta
                  ? JSON.stringify(selected.metadata ?? selected.meta, null, 2)
                  : selected.description || "—"}
              </dd>
            </div>
          </dl>
        ) : null}
      </AdminDrawer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-brand-dark">{value}</dd>
    </div>
  )
}
