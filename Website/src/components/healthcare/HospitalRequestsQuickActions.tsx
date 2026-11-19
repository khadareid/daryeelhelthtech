import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Clock3, Link2Off, RefreshCw, Send, UserCheck, XCircle } from "lucide-react"
import {
  useGetHospitalRequestsQuery,
  useRespondHospitalRequestMutation,
} from "@/Redex/service/healthcare/HealthcareApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type QuickTab = "pending" | "accepted" | "rejected" | "all"

function formatWhen(iso?: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function HospitalRequestsQuickActions({
  className,
}: {
  className?: string
}) {
  const [tab, setTab] = useState<QuickTab>("pending")
  const { data: hospitalRequests = [], refetch, isFetching } =
    useGetHospitalRequestsQuery(undefined, { pollingInterval: 30_000 })
  const [respondHospitalRequest, { isLoading: responding }] =
    useRespondHospitalRequestMutation()

  const counts = useMemo(() => {
    const pending = hospitalRequests.filter(
      (r) => String(r.status || "").toUpperCase() === "PENDING"
    ).length
    const accepted = hospitalRequests.filter(
      (r) => String(r.status || "").toUpperCase() === "ACCEPTED"
    ).length
    const rejected = hospitalRequests.filter(
      (r) => String(r.status || "").toUpperCase() === "REJECTED"
    ).length
    return {
      pending,
      accepted,
      rejected,
      all: hospitalRequests.length,
    }
  }, [hospitalRequests])

  const filtered = useMemo(() => {
    if (tab === "all") return hospitalRequests
    const want = tab.toUpperCase()
    return hospitalRequests.filter(
      (r) => String(r.status || "").toUpperCase() === want
    )
  }, [hospitalRequests, tab])

  async function onRespond(id: string, accept: boolean) {
    try {
      await respondHospitalRequest({ id, accept }).unwrap()
      toast.success(
        accept ? "Hospital request accepted" : "Hospital request rejected"
      )
      void refetch()
      if (!accept) setTab("rejected")
      else setTab("accepted")
    } catch (err: unknown) {
      toast.error(
        (err as { data?: { message?: string } })?.data?.message ||
          "Could not respond"
      )
    }
  }

  const cards: Array<{
    id: QuickTab
    label: string
    value: number
    icon: typeof Clock3
  }> = [
    {
      id: "pending",
      label: "Pending (aan la aqbalin)",
      value: counts.pending,
      icon: Clock3,
    },
    {
      id: "accepted",
      label: "Accepted (aan qaatay)",
      value: counts.accepted,
      icon: UserCheck,
    },
    {
      id: "rejected",
      label: "Rejected (aan diiday)",
      value: counts.rejected,
      icon: XCircle,
    },
    {
      id: "all",
      label: "All requests",
      value: counts.all,
      icon: Send,
    },
  ]

  return (
    <div
      className={cn(
        "rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Quick Actions
          </p>
          <h3 className="mt-1 font-heading text-lg font-bold text-brand-dark">
            Hospital requests from Daryeel SaaS
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            La soco kuwa kugu soo codsaday, kuwa aad aqbashay, kuwa aad diiday,
            iyo dhammaan requests-ka.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isFetching && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon
          const active = tab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                active
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-slate-200 bg-slate-50 hover:bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.label}
                </p>
                <Icon
                  className={cn(
                    "h-4 w-4",
                    active ? "text-primary" : "text-slate-400"
                  )}
                />
              </div>
              <p className="mt-1 text-2xl font-bold text-brand-dark">
                {item.value}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-4 space-y-2">
        {filtered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-muted-foreground">
            {tab === "pending" ? (
              <>
                <Link2Off className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                Ma jiraan requests pending ah. Marka hospital SaaS kaagu soo
                codsado, halkan ayaad ka arki doontaa.
              </>
            ) : (
              "Waxba kuma jiraan qaybtan."
            )}
          </p>
        ) : (
          filtered.map((req) => {
            const status = String(req.status || "PENDING").toUpperCase()
            return (
              <article
                key={req.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-heading text-base font-bold text-brand-dark">
                      {req.hospitalName || "Hospital"}
                    </p>
                    <p className="mt-0.5 text-sm text-primary">
                      {[req.doctorName, req.department || req.branchName]
                        .filter(Boolean)
                        .join(" · ") || "Hospital staff"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      status === "ACCEPTED"
                        ? "success"
                        : status === "REJECTED"
                          ? "danger"
                          : "secondary"
                    }
                  >
                    {status}
                  </Badge>
                </div>
                {req.message ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {req.message}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatWhen(req.createdAt)}
                  {req.respondedAt
                    ? ` · responded ${formatWhen(req.respondedAt)}`
                    : ""}
                  {req.healthId ? ` · Health ID ${req.healthId}` : ""}
                </p>
                {status === "PENDING" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={responding}
                      onClick={() => void onRespond(req.id, true)}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
                      disabled={responding}
                      onClick={() => void onRespond(req.id, false)}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
