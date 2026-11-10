import { FormEvent, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import {
  CalendarClock,
  Eye,
  Hospital,
  Ticket,
  XCircle,
} from "lucide-react"
import {
  useCancelAppointmentMutation,
  useGetAppointmentQuery,
  useGetAppointmentsQuery,
  useRequestRescheduleMutation,
  useRespondRescheduleMutation,
  type HealthcareAppointment,
} from "@/Redex/service/healthcare/HealthcareApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type TabKey = "upcoming" | "pending" | "completed" | "cancelled"

const UPCOMING = new Set([
  "ACCEPTED",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "RESCHEDULE_REQUESTED",
])
const PENDING = new Set(["PENDING"])
const COMPLETED = new Set(["COMPLETED"])
const CANCELLED = new Set(["CANCELLED", "REJECTED", "NO_SHOW"])

function statusVariant(
  status: string
): "default" | "success" | "danger" | "secondary" {
  const s = status.toUpperCase()
  if (COMPLETED.has(s) || s === "CONFIRMED" || s === "ACCEPTED") return "success"
  if (CANCELLED.has(s)) return "danger"
  if (PENDING.has(s) || s === "RESCHEDULE_REQUESTED") return "secondary"
  return "default"
}

function tabForStatus(status: string): TabKey {
  const s = status.toUpperCase()
  if (PENDING.has(s)) return "pending"
  if (COMPLETED.has(s)) return "completed"
  if (CANCELLED.has(s)) return "cancelled"
  return "upcoming"
}

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

function AppointmentCard({
  appt,
  onView,
  onCancel,
  onReschedule,
  onRespond,
  cancelling,
  rescheduling,
}: {
  appt: HealthcareAppointment
  onView: () => void
  onCancel: () => void
  onReschedule: () => void
  onRespond: (accept: boolean) => void
  cancelling?: boolean
  rescheduling?: boolean
}) {
  const status = String(appt.status || "").toUpperCase()
  const canCancel =
    !CANCELLED.has(status) && !COMPLETED.has(status) && status !== "NO_SHOW"
  const canReschedule = canCancel
  const hasProposal =
    status === "RESCHEDULE_REQUESTED" && Boolean(appt.proposedScheduledAt)

  return (
    <article className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-heading text-base font-bold text-brand-dark">
            {appt.facilityName || "Hospital"}
          </p>
          <p className="mt-0.5 text-sm text-primary">
            {appt.doctorName || "Doctor"}
            {appt.department ? ` · ${appt.department}` : ""}
            {!appt.department && appt.specialty ? ` · ${appt.specialty}` : ""}
          </p>
        </div>
        <Badge variant={statusVariant(status)}>{status}</Badge>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        {formatWhen(appt.scheduledAt)}
      </p>

      {appt.externalTicketNumber ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-light px-2.5 py-1 text-xs font-semibold text-brand-dark">
          <Ticket className="h-3.5 w-3.5 text-primary" />
          OPD {appt.externalTicketNumber}
        </p>
      ) : null}

      {hasProposal ? (
        <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Hospital proposed a new time</p>
          <p className="mt-1">{formatWhen(appt.proposedScheduledAt)}</p>
          {appt.proposedMessage ? (
            <p className="mt-1 text-amber-800">{appt.proposedMessage}</p>
          ) : null}
          <div className="mt-2 flex gap-2">
            <Button
              size="sm"
              className="h-8"
              onClick={() => onRespond(true)}
              disabled={rescheduling}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => onRespond(false)}
              disabled={rescheduling}
            >
              Decline
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="h-8" onClick={onView}>
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View
        </Button>
        {canCancel ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={onCancel}
            disabled={cancelling}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
        ) : null}
        {canReschedule ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={onReschedule}
            disabled={rescheduling}
          >
            <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
            Request reschedule
          </Button>
        ) : null}
        {appt.externalTicketNumber ? (
          <Button size="sm" variant="outline" className="h-8" onClick={onView}>
            <Ticket className="mr-1.5 h-3.5 w-3.5" />
            View OPD ticket
          </Button>
        ) : null}
      </div>
    </article>
  )
}

export function MyHealthcareSection({
  embedded = false,
}: {
  embedded?: boolean
}) {
  const [tab, setTab] = useState<TabKey>("upcoming")
  const [viewId, setViewId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [proposedAt, setProposedAt] = useState("")
  const [rescheduleMessage, setRescheduleMessage] = useState("")

  const [pollPending, setPollPending] = useState(false)

  const {
    data: appointments = [],
    isLoading,
    isError,
    refetch,
  } = useGetAppointmentsQuery(undefined, {
    // Poll pending hospital visits every 20s; stop when none remain
    pollingInterval: pollPending ? 20_000 : 0,
  })

  const hasPending = useMemo(
    () =>
      appointments.some((a) =>
        PENDING.has(String(a.status || "").toUpperCase())
      ),
    [appointments]
  )

  useEffect(() => {
    setPollPending(hasPending)
  }, [hasPending])

  const items = appointments

  const { data: detail } = useGetAppointmentQuery(viewId || "", {
    skip: !viewId,
  })

  const [cancelAppt, { isLoading: cancelling }] =
    useCancelAppointmentMutation()
  const [requestReschedule, { isLoading: rescheduling }] =
    useRequestRescheduleMutation()
  const [respondReschedule, { isLoading: responding }] =
    useRespondRescheduleMutation()

  const grouped = useMemo(() => {
    const buckets: Record<TabKey, HealthcareAppointment[]> = {
      upcoming: [],
      pending: [],
      completed: [],
      cancelled: [],
    }
    for (const a of items) {
      buckets[tabForStatus(String(a.status || ""))].push(a)
    }
    for (const key of Object.keys(buckets) as TabKey[]) {
      buckets[key].sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      )
    }
    return buckets
  }, [items])

  const onCancelSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!cancelId) return
    try {
      await cancelAppt({
        id: cancelId,
        reason: cancelReason || undefined,
      }).unwrap()
      toast.success("Appointment cancelled")
      setCancelId(null)
      setCancelReason("")
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Cancel failed"
      toast.error(message)
    }
  }

  const onRescheduleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!rescheduleId || !proposedAt) {
      toast.error("Pick a proposed date and time")
      return
    }
    try {
      await requestReschedule({
        id: rescheduleId,
        proposedScheduledAt: new Date(proposedAt).toISOString(),
        message: rescheduleMessage || undefined,
      }).unwrap()
      toast.success("Reschedule requested")
      setRescheduleId(null)
      setProposedAt("")
      setRescheduleMessage("")
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Reschedule failed"
      toast.error(message)
    }
  }

  const onRespond = async (id: string, accept: boolean) => {
    try {
      await respondReschedule({ id, accept }).unwrap()
      toast.success(accept ? "New time accepted" : "Proposal declined")
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ||
        "Could not respond"
      toast.error(message)
    }
  }

  return (
    <div className="space-y-5">
      {!embedded ? (
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Hospital visits
              </p>
              <h2 className="mt-1 font-heading text-2xl font-bold text-brand-dark">
                My Healthcare
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track hospital appointment requests, OPD tickets, and reschedules.
              </p>
            </div>
            <Button asChild>
              <Link to="/dashboard?section=book">
                <Hospital className="mr-2 h-4 w-4" />
                Book visit
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-brand-dark">
            Your hospital bookings
          </p>
          <Button asChild size="sm">
            <Link to="/dashboard?section=book">
              <Hospital className="mr-1.5 h-3.5 w-3.5" />
              Book hospital
            </Link>
          </Button>
        </div>
      )}

      {isError ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-center">
          <p className="text-sm text-rose-700">Could not load hospital visits.</p>
          <Button className="mt-3" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({grouped.upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({grouped.pending.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({grouped.completed.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({grouped.cancelled.length})
          </TabsTrigger>
        </TabsList>

        {(Object.keys(grouped) as TabKey[]).map((key) => (
          <TabsContent key={key} value={key} className="space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-28 animate-pulse rounded-2xl bg-white"
                  />
                ))}
              </div>
            ) : grouped[key].length === 0 ? (
              <div className="rounded-2xl border border-blue-100 bg-white p-8 text-center text-sm text-muted-foreground">
                No {key} hospital visits.
              </div>
            ) : (
              grouped[key].map((appt) => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  cancelling={cancelling}
                  rescheduling={rescheduling || responding}
                  onView={() => setViewId(appt.id)}
                  onCancel={() => setCancelId(appt.id)}
                  onReschedule={() => setRescheduleId(appt.id)}
                  onRespond={(accept) => onRespond(appt.id, accept)}
                />
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={Boolean(viewId)} onOpenChange={(o) => !o && setViewId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment details</DialogTitle>
            <DialogDescription>
              Hospital visit from Daryeel Healthtech.
            </DialogDescription>
          </DialogHeader>
          {detail ? (
            <dl className="space-y-2 text-sm">
              <Row label="ID" value={detail.appointmentCode || detail.id} mono />
              <Row label="Hospital" value={detail.facilityName || "—"} />
              <Row label="Doctor" value={detail.doctorName || "—"} />
              <Row
                label="Department"
                value={detail.department || detail.specialty || "—"}
              />
              <Row label="When" value={formatWhen(detail.scheduledAt)} />
              <Row label="Status" value={detail.status} />
              {detail.externalTicketNumber ? (
                <Row
                  label="OPD ticket"
                  value={detail.externalTicketNumber}
                  mono
                />
              ) : null}
              {detail.proposedScheduledAt ? (
                <Row
                  label="Proposed time"
                  value={formatWhen(detail.proposedScheduledAt)}
                />
              ) : null}
              {detail.reason ? <Row label="Reason" value={detail.reason} /> : null}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(cancelId)}
        onOpenChange={(o) => {
          if (!o) {
            setCancelId(null)
            setCancelReason("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>
              Tell the hospital why you need to cancel (optional).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCancelSubmit} className="space-y-3">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Cancellation reason"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCancelId(null)}
              >
                Keep
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={cancelling}
              >
                {cancelling ? "Cancelling…" : "Cancel visit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rescheduleId)}
        onOpenChange={(o) => {
          if (!o) {
            setRescheduleId(null)
            setProposedAt("")
            setRescheduleMessage("")
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request reschedule</DialogTitle>
            <DialogDescription>
              Propose a new date and time for the hospital to review.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onRescheduleSubmit} className="space-y-3">
            <Input
              type="datetime-local"
              value={proposedAt}
              onChange={(e) => setProposedAt(e.target.value)}
              required
            />
            <Input
              value={rescheduleMessage}
              onChange={(e) => setRescheduleMessage(e.target.value)}
              placeholder="Message (optional)"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setRescheduleId(null)}
              >
                Close
              </Button>
              <Button type="submit" className="flex-1" disabled={rescheduling}>
                {rescheduling ? "Sending…" : "Send request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-blue-50 py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "max-w-[60%] text-right font-semibold text-brand-dark",
          mono && "break-all font-mono text-xs"
        )}
      >
        {value}
      </dd>
    </div>
  )
}
