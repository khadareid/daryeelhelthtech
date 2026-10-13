import { FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowLeft,
  Calendar,
  Loader2,
  MessageCircle,
  Phone,
  Star,
  Video,
} from 'lucide-react'
import {
  doctorName,
  doctorPhoto,
  useGetPublicCareTeamQuery,
  type CareTeamDoctor,
} from '@/Redex/service/hospitals/HospitalsApi'
import { useCreateAppointmentMutation } from '@/Redex/service/appointments/AppointmentsApi'
import {
  useCreateMessageMutation,
  useGetThreadQuery,
} from '@/Redex/service/messages/MessagesApi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { siteConfig } from '@/config/site'
import type { RootState } from '@/Redex/store/store'

const TIME_SLOTS = [
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
]

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function slotToDate(day: Date, slot: string) {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  let h = 9
  let m = 0
  if (match) {
    h = Number(match[1])
    m = Number(match[2])
    const ampm = (match[3] || '').toUpperCase()
    if (ampm === 'PM' && h < 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
  }
  const when = new Date(day)
  when.setHours(h, m, 0, 0)
  return when
}

export default function DoctorDetailPage() {
  const { doctorId = '' } = useParams()
  const [search] = useSearchParams()
  const navigate = useNavigate()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const { data: careTeam = [], isLoading } = useGetPublicCareTeamQuery()
  const doctor = useMemo(
    () =>
      careTeam.find((d) => d.professionalProfileId === doctorId) ??
      null,
    [careTeam, doctorId],
  )

  const days = useMemo(() => nextDays(7), [])
  const [dayIndex, setDayIndex] = useState(0)
  const [slot, setSlot] = useState(TIME_SLOTS[0])
  const [visitType, setVisitType] = useState<'In-Person' | 'Video Call'>(
    (search.get('visit') as 'Video Call') || 'In-Person',
  )
  const [chatOpen, setChatOpen] = useState(search.get('chat') === '1')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const peerId = doctor?.professionalProfileId || doctorId
  const [book, { isLoading: booking }] = useCreateAppointmentMutation()
  const [sendMessage, { isLoading: sending }] = useCreateMessageMutation()
  const { data: thread = [], refetch: refetchThread } = useGetThreadQuery(peerId, {
    skip: !signedIn || !peerId || !chatOpen,
  })

  function requireSignIn(next: string) {
    navigate(`/signin?next=${encodeURIComponent(next)}`)
  }

  async function onBook(e?: FormEvent) {
    e?.preventDefault()
    if (!doctor) return
    if (!signedIn) {
      requireSignIn(`/doctors/${doctorId}`)
      return
    }
    setStatus(null)
    try {
      const when = slotToDate(days[dayIndex], slot)
      const appt = await book({
        doctorId: doctor.professionalProfileId,
        doctorName: doctorName(doctor),
        specialty: doctor.specialization || 'General Physician',
        facilityName: doctor.hospitalName,
        facilityId: doctor.hospitalId,
        scheduledAt: when.toISOString(),
        reason: `${visitType} visit`,
        visitType,
      }).unwrap()
      setStatus(
        `Booked ${when.toLocaleString()} · ${appt.appointmentCode || appt.appointmentid}`,
      )
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : 'Booking failed. Try again.',
      )
    }
  }

  async function onSendChat(e: FormEvent) {
    e.preventDefault()
    if (!signedIn) {
      requireSignIn(`/doctors/${doctorId}?chat=1`)
      return
    }
    const body = draft.trim()
    if (!body || !peerId) return
    try {
      await sendMessage({
        senderId: session.userId,
        recipientId: peerId,
        recipientType: 'CLINICIAN',
        subject: `Chat with ${doctor ? doctorName(doctor) : 'doctor'}`,
        body,
      }).unwrap()
      setDraft('')
      refetchThread()
    } catch {
      /* keep draft */
    }
  }

  function onCall() {
    const phone =
      doctor?.publicPhone?.replace(/\s/g, '') ||
      siteConfig.supportPhone.replace(/\s/g, '')
    window.location.href = `tel:${phone}`
  }

  if (isLoading) {
    return (
      <div className="container-page flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Doctor not found
        </h1>
        <Button asChild className="mt-6">
          <Link to="/doctors">Back to doctors</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-brand-bg pb-16">
      <div className="container-page space-y-6 py-8">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All doctors
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex gap-4">
              <img
                src={doctorPhoto(doctor)}
                alt={doctorName(doctor)}
                className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
              />
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-bold text-brand-dark">
                  {doctorName(doctor)}
                </h1>
                <p className="text-primary">
                  {doctor.specialization || 'General Physician'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {doctor.hospitalName}
                  {doctor.city ? ` · ${doctor.city}` : ''}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 text-sm text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  Trusted clinician
                  {doctor.consultationFee
                    ? ` · ${doctor.currency || 'USD'} ${doctor.consultationFee}`
                    : ''}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {doctor.publicBio ||
                'Book a visit, chat securely, or call for care guidance.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setChatOpen(true)}
              >
                <MessageCircle className="h-4 w-4" /> Chat
              </Button>
              <Button type="button" variant="outline" className="gap-2" onClick={onCall}>
                <Phone className="h-4 w-4" /> Call
              </Button>
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setVisitType('Video Call')}
              >
                <Video className="h-4 w-4" /> Video visit
              </Button>
            </div>
          </section>

          <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-dark">
              <Calendar className="h-5 w-5 text-primary" /> Book appointment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Available for every signed-in patient.
            </p>

            <form onSubmit={onBook} className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((d, i) => (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setDayIndex(i)}
                      className={`min-w-[4.25rem] rounded-xl border px-2 py-2 text-center text-sm ${
                        i === dayIndex
                          ? 'border-primary bg-primary text-white'
                          : 'border-blue-100 bg-brand-bg text-brand-dark'
                      }`}
                    >
                      <div className="text-[11px] opacity-80">
                        {d.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="font-semibold">{d.getDate()}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Time
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSlot(item)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        slot === item
                          ? 'border-primary bg-primary text-white'
                          : 'border-blue-100 text-brand-dark'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {(['In-Person', 'Video Call'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setVisitType(item)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${
                      visitType === item
                        ? 'border-primary bg-blue-50 text-primary'
                        : 'border-blue-100 text-muted-foreground'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {status ? (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {status}
                </p>
              ) : null}

              <Button type="submit" className="w-full" disabled={booking}>
                {booking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {signedIn ? 'Confirm booking' : 'Sign in to book'}
              </Button>
            </form>
          </section>
        </div>

        {chatOpen ? (
          <DoctorChatPanel
            doctor={doctor}
            peerId={peerId}
            signedIn={signedIn}
            thread={thread}
            draft={draft}
            setDraft={setDraft}
            sending={sending}
            onSend={onSendChat}
            onClose={() => setChatOpen(false)}
            onSignIn={() => requireSignIn(`/doctors/${doctorId}?chat=1`)}
          />
        ) : null}
      </div>
    </div>
  )
}

function DoctorChatPanel({
  doctor,
  peerId,
  signedIn,
  thread,
  draft,
  setDraft,
  sending,
  onSend,
  onClose,
  onSignIn,
}: {
  doctor: CareTeamDoctor
  peerId: string
  signedIn: boolean
  thread: Array<{ messageid: string; body: string; senderId: string; createdAt: string | Date }>
  draft: string
  setDraft: (v: string) => void
  sending: boolean
  onSend: (e: FormEvent) => void
  onClose: () => void
  onSignIn: () => void
}) {
  const session = useSelector((s: RootState) => s.userInfo)

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-brand-dark">
            Chat with {doctorName(doctor)}
          </h2>
          <p className="text-xs text-muted-foreground">Secure patient messaging · {peerId.slice(0, 8)}…</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      {!signedIn ? (
        <div className="mt-4 rounded-2xl bg-brand-bg p-4 text-sm">
          <p className="text-muted-foreground">Sign in to message this clinician.</p>
          <Button className="mt-3" onClick={onSignIn}>
            Sign in
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-brand-bg p-3">
            {thread.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No messages yet — say hello.
              </p>
            ) : (
              thread.map((msg) => {
                const mine = msg.senderId === session.userId
                return (
                  <div
                    key={msg.messageid}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? 'ml-auto bg-primary text-white'
                        : 'bg-white text-brand-dark shadow-sm'
                    }`}
                  >
                    {msg.body}
                  </div>
                )
              })
            )}
          </div>
          <form onSubmit={onSend} className="mt-3 flex gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a message…"
              className="min-h-[44px] flex-1 resize-none"
              rows={2}
            />
            <Button type="submit" disabled={sending || !draft.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
          </form>
        </>
      )}
    </section>
  )
}
