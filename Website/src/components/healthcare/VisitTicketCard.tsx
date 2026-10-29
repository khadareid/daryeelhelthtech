import { Calendar, Hash, MapPin, Stethoscope, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

export type VisitTicketData = {
  ticketNumber?: string | null
  queueNumber?: number | null
  ticketStatus?: string | null
  status?: string
  doctorName?: string | null
  facilityName?: string | null
  department?: string | null
  specialty?: string | null
  scheduledAt?: string
  paymentStatus?: string | null
  appointmentCode?: string | null
}

const STAGES = [
  { key: 'REQUESTED', label: 'Requested' },
  { key: 'ISSUED', label: 'Ticket issued' },
  { key: 'WAITING', label: 'At clinic' },
  { key: 'CALLED', label: 'Called' },
  { key: 'COMPLETED', label: 'Done' },
] as const

function stageIndex(ticketStatus?: string | null, apptStatus?: string) {
  const t = String(ticketStatus || '').toUpperCase()
  const a = String(apptStatus || '').toUpperCase()
  if (t === 'COMPLETED' || a === 'COMPLETED') return 4
  if (t === 'CALLED' || t === 'IN_CONSULTATION') return 3
  if (t === 'CHECKED_IN' || t === 'WAITING') return 2
  if (t === 'ISSUED' || t === 'CONFIRMED' || a === 'CONFIRMED' || a === 'ACCEPTED')
    return 1
  return 0
}

function formatWhen(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function VisitTicketCard({
  ticket,
  compact,
  preview,
}: {
  ticket?: VisitTicketData | null
  compact?: boolean
  /** Shown on booking form before a real ticket exists */
  preview?: boolean
}) {
  const number = ticket?.ticketNumber || (preview ? 'OPD-······' : '—')
  const active = stageIndex(ticket?.ticketStatus, ticket?.status)

  return (
    <article
      className={cn(
        'overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm',
        compact ? 'p-0' : '',
      )}
    >
      <div className="relative bg-gradient-to-br from-[#0B3A5B] via-[#125A8A] to-[#1B7AB5] px-5 py-5 text-white">
        <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 left-10 h-16 w-16 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-100">
              Visit ticket
            </p>
            <p className="mt-2 font-mono text-2xl font-bold tracking-wide sm:text-3xl">
              {number}
            </p>
            {ticket?.queueNumber != null ? (
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-sky-100">
                <Hash className="h-3.5 w-3.5" />
                Queue {ticket.queueNumber}
              </p>
            ) : preview ? (
              <p className="mt-1 text-sm text-sky-100">
                Issued when the hospital accepts your booking
              </p>
            ) : null}
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur-sm">
            <Ticket className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-start gap-2 text-brand-dark">
            <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                Doctor
              </span>
              {ticket?.doctorName || (preview ? 'Selected clinician' : '—')}
            </span>
          </p>
          <p className="flex items-start gap-2 text-brand-dark">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                Hospital
              </span>
              {ticket?.facilityName || (preview ? 'Hospital' : '—')}
            </span>
          </p>
          <p className="flex items-start gap-2 text-brand-dark sm:col-span-2">
            <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                Visit time
              </span>
              {formatWhen(ticket?.scheduledAt)}
              {ticket?.department || ticket?.specialty
                ? ` · ${ticket.department || ticket.specialty}`
                : ''}
            </span>
          </p>
        </div>

        {!compact ? (
          <div className="pt-1">
            <div className="flex justify-between gap-1">
              {STAGES.map((s, i) => (
                <div key={s.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                  <div
                    className={cn(
                      'h-2 w-full rounded-full',
                      i <= active ? 'bg-primary' : 'bg-slate-200',
                    )}
                  />
                  <span
                    className={cn(
                      'text-center text-[10px] font-medium leading-tight',
                      i <= active ? 'text-primary' : 'text-slate-400',
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {ticket?.ticketStatus || ticket?.status ? (
            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              {(ticket.ticketStatus || ticket.status || '').replace(/_/g, ' ')}
            </span>
          ) : null}
          {ticket?.paymentStatus ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
              Payment {ticket.paymentStatus}
            </span>
          ) : null}
          {ticket?.appointmentCode ? (
            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
              {ticket.appointmentCode}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

/** Compact strip for appointment lists when a ticket already exists */
export function TicketChip({
  number,
  queue,
}: {
  number?: string | null
  queue?: number | null
}) {
  if (!number) return null
  return (
    <div className="mt-3 flex items-center gap-2 overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-r from-[#F0F7FC] to-white px-3 py-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#125A8A] text-white">
        <Ticket className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="font-mono text-sm font-bold text-brand-dark">{number}</p>
        <p className="text-[11px] text-muted-foreground">
          Visit ticket{queue != null ? ` · Queue ${queue}` : ''}
        </p>
      </div>
    </div>
  )
}
