import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock3,
  Star,
  Ticket,
  ShieldCheck,
} from 'lucide-react'
import {
  useCancelHealthcareAppointmentMutation,
  useGetConsentsQuery,
  useGetHealthcareActivityQuery,
  useGetHealthcareAppointmentsQuery,
  useGetOpdTicketsQuery,
  useRespondHealthcareRescheduleMutation,
  useRevokeConsentMutation,
  useSubmitHealthcareReviewMutation,
  type HealthcareAppointment,
} from '@/Redex/service/healthcare/HealthcareApi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Tab =
  | 'upcoming'
  | 'requests'
  | 'tickets'
  | 'visits'
  | 'activity'
  | 'consents'
  | 'reviews'

function formatWhen(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase()
  const tone =
    ['CONFIRMED', 'COMPLETED', 'ACCEPTED', 'CHECKED_IN'].includes(s)
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : ['PENDING', 'RESCHEDULE_REQUESTED'].includes(s)
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : ['REJECTED', 'CANCELLED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_HOSPITAL'].includes(s)
          ? 'bg-rose-50 text-rose-700 border-rose-100'
          : 'bg-slate-50 text-slate-700 border-slate-100'
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', tone)}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function AppointmentCard({
  item,
  onRespond,
  onCancel,
  onReview,
  busy,
}: {
  item: HealthcareAppointment
  onRespond?: (accept: boolean) => void
  onCancel?: () => void
  onReview?: (rating: number, comment: string) => void
  busy?: boolean
}) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const completed = item.status === 'COMPLETED'
  const canReview = completed && !item.doctorReview

  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-brand-dark">
            {item.doctorName || 'Doctor'}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.facilityName || 'Hospital'}
            {item.specialty || item.department
              ? ` · ${item.specialty || item.department}`
              : ''}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {formatWhen(item.scheduledAt)}
          </p>
        </div>
        <StatusPill status={item.status} />
      </div>

      {item.saasTicketNumber ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm">
          <Ticket className="h-4 w-4 text-primary" />
          <span className="font-medium">{item.saasTicketNumber}</span>
          <span className="text-xs text-muted-foreground">
            · Payment {item.paymentStatus || 'UNPAID'}
          </span>
        </div>
      ) : null}

      {item.status === 'RESCHEDULE_REQUESTED' && item.proposedScheduledAt ? (
        <div className="mt-3 space-y-2 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
          <p className="text-sm font-medium text-amber-900">
            Doctor suggested a new time
          </p>
          <p className="text-xs text-amber-800">
            Original: {formatWhen(item.scheduledAt)}
          </p>
          <p className="text-xs text-amber-800">
            New: {formatWhen(item.proposedScheduledAt)}
          </p>
          {item.proposedMessage ? (
            <p className="text-xs text-amber-800">{item.proposedMessage}</p>
          ) : null}
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => onRespond?.(true)}>
              Accept new time
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onRespond?.(false)}
            >
              Decline
            </Button>
          </div>
        </div>
      ) : null}

      {item.rejectionReason ? (
        <p className="mt-2 text-xs text-rose-600">
          Rejected: {item.rejectionReason}
        </p>
      ) : null}

      {canReview ? (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <p className="text-sm font-medium">Review this doctor</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    'h-5 w-5',
                    n <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300',
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Optional feedback"
            rows={2}
          />
          <Button
            size="sm"
            disabled={busy}
            onClick={() => onReview?.(rating, comment)}
          >
            Submit review
          </Button>
        </div>
      ) : item.doctorReview ? (
        <p className="mt-2 text-xs text-muted-foreground">
          You rated this visit {item.doctorReview.rating}/5
        </p>
      ) : null}

      {['PENDING', 'CONFIRMED', 'ACCEPTED', 'RESCHEDULE_REQUESTED'].includes(
        item.status,
      ) ? (
        <div className="mt-3">
          <Button
            size="sm"
            variant="ghost"
            className="text-rose-600"
            disabled={busy}
            onClick={onCancel}
          >
            Cancel request
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default function MyHealthcareSection() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const { data: appointments = [], isLoading, refetch } =
    useGetHealthcareAppointmentsQuery()
  const { data: tickets = [] } = useGetOpdTicketsQuery()
  const { data: activity = [] } = useGetHealthcareActivityQuery()
  const { data: consents = [] } = useGetConsentsQuery()
  const [respond, { isLoading: responding }] =
    useRespondHealthcareRescheduleMutation()
  const [cancel, { isLoading: cancelling }] =
    useCancelHealthcareAppointmentMutation()
  const [review, { isLoading: reviewing }] =
    useSubmitHealthcareReviewMutation()
  const [revoke] = useRevokeConsentMutation()

  const busy = responding || cancelling || reviewing

  const { upcoming, requests, past } = useMemo(() => {
    const now = Date.now()
    const closed = new Set([
      'COMPLETED',
      'CANCELLED',
      'CANCELLED_BY_PATIENT',
      'CANCELLED_BY_HOSPITAL',
      'REJECTED',
      'NO_SHOW',
    ])
    return {
      upcoming: appointments.filter(
        (a) =>
          !closed.has(a.status) &&
          new Date(a.scheduledAt).getTime() >= now - 60_000,
      ),
      requests: appointments.filter((a) =>
        ['PENDING', 'RESCHEDULE_REQUESTED', 'REJECTED'].includes(a.status),
      ),
      past: appointments.filter(
        (a) =>
          closed.has(a.status) || new Date(a.scheduledAt).getTime() < now,
      ),
    }
  }, [appointments])

  const tabs: { id: Tab; label: string; icon: typeof Calendar }[] = [
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
    { id: 'requests', label: 'Requests', icon: Clock3 },
    { id: 'tickets', label: 'OPD Tickets', icon: Ticket },
    { id: 'visits', label: 'Past visits', icon: CheckCircle2 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'consents', label: 'Consent', icon: ShieldCheck },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          My Healthcare
        </p>
        <h1 className="mt-1 font-heading text-2xl font-bold text-brand-dark">
          Hospitals, tickets & visits
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track Healthtech bookings with hospitals on the Daryeel network —
          from request to OPD ticket, visit, and review.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/dashboard?section=hospitals">Find hospital</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard?section=doctors">Find doctor</Link>
          </Button>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold',
              tab === t.id
                ? 'border-primary bg-primary text-white'
                : 'border-slate-200 bg-white text-slate-600',
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm text-muted-foreground">
          Loading your healthcare activity…
        </div>
      ) : null}

      {tab === 'upcoming' ? (
        <div className="space-y-3">
          {upcoming.length === 0 ? (
            <Empty text="No upcoming hospital appointments." />
          ) : (
            upcoming.map((item) => (
              <AppointmentCard
                key={item.appointmentid}
                item={item}
                busy={busy}
                onRespond={async (accept) => {
                  await respond({ id: item.appointmentid, accept })
                  refetch()
                }}
                onCancel={async () => {
                  await cancel({ id: item.appointmentid })
                  refetch()
                }}
              />
            ))
          )}
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div className="space-y-3">
          {requests.length === 0 ? (
            <Empty text="No open requests." />
          ) : (
            requests.map((item) => (
              <AppointmentCard
                key={item.appointmentid}
                item={item}
                busy={busy}
                onRespond={async (accept) => {
                  await respond({ id: item.appointmentid, accept })
                  refetch()
                }}
                onCancel={async () => {
                  await cancel({ id: item.appointmentid })
                  refetch()
                }}
              />
            ))
          )}
        </div>
      ) : null}

      {tab === 'tickets' ? (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <Empty text="No OPD tickets yet. Tickets appear after the hospital confirms your booking." />
          ) : (
            tickets.map((t) => (
              <div
                key={t.appointmentid}
                className="rounded-2xl border border-blue-100 bg-white p-4"
              >
                <p className="font-mono text-lg font-bold text-brand-dark">
                  {t.saasTicketNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t.doctorName} · {t.facilityName}
                </p>
                <p className="mt-1 text-sm">{formatWhen(t.scheduledAt)}</p>
                <div className="mt-2 flex gap-2">
                  <StatusPill status={t.status} />
                  <StatusPill status={t.paymentStatus || 'UNPAID'} />
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'visits' || tab === 'reviews' ? (
        <div className="space-y-3">
          {past.length === 0 ? (
            <Empty text="No past visits yet." />
          ) : (
            past.map((item) => (
              <AppointmentCard
                key={item.appointmentid}
                item={item}
                busy={busy}
                onReview={async (rating, comment) => {
                  await review({ id: item.appointmentid, rating, comment })
                  refetch()
                }}
              />
            ))
          )}
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div className="space-y-2">
          {activity.length === 0 ? (
            <Empty text="No healthcare activity yet." />
          ) : (
            activity.map((e) => (
              <div
                key={e.eventid}
                className="rounded-xl border border-slate-100 bg-white px-4 py-3"
              >
                <p className="text-sm font-medium text-brand-dark">{e.title}</p>
                {e.body ? (
                  <p className="text-xs text-muted-foreground">{e.body}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatWhen(e.occurredAt)}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'consents' ? (
        <div className="space-y-3">
          {consents.length === 0 ? (
            <Empty text="No hospital data-sharing consents yet. Consent is requested when you book." />
          ) : (
            consents.map((c: any) => (
              <div
                key={c.consentid}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-brand-dark">
                    {c.grantedToTenantName || c.grantedToTenantId || 'Hospital'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.scope} · {c.status}
                    {c.purpose ? ` · ${c.purpose}` : ''}
                  </p>
                </div>
                {c.status === 'ACTIVE' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => revoke({ id: c.consentid })}
                  >
                    Revoke
                  </Button>
                ) : null}
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
