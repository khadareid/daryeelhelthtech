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
  Ticket,
  Video,
} from 'lucide-react'
import {
  doctorName,
  doctorPhoto,
  saasDoctorId,
  useGetPublicCareTeamQuery,
  useGetPublicDoctorAvailabilityQuery,
  useGetPublicHospitalQuery,
  type CareTeamDoctor,
  type PublicHospitalDoctor,
} from '@/Redex/service/hospitals/HospitalsApi'
import {
  useCreateHealthcareAppointmentMutation,
  useGetHealthcareDoctorQuery,
} from '@/Redex/service/healthcare/HealthcareApi'
import {
  useCreateMessageMutation,
  useGetThreadQuery,
} from '@/Redex/service/messages/MessagesApi'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { VisitTicketCard } from '@/components/healthcare/VisitTicketCard'
import { siteConfig } from '@/config/site'
import type { RootState } from '@/Redex/store/store'

function nextDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
}

function dayIso(day: Date) {
  const y = day.getFullYear()
  const m = String(day.getMonth() + 1).padStart(2, '0')
  const d = String(day.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Local clinic hours when SaaS schedule is empty / unreachable */
function buildFallbackSlots(dateStr: string) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  if (!y || !mo || !d) return []
  const out: string[] = []
  const lead = Date.now() + 5 * 60_000
  for (let h = 8; h < 20; h++) {
    for (const minute of [0, 30]) {
      const start = new Date(y, mo - 1, d, h, minute, 0, 0)
      if (start.getTime() > lead) out.push(start.toISOString())
    }
  }
  return out
}

function matchesDoctor(d: PublicHospitalDoctor, id: string) {
  return (
    d.doctorId === id ||
    d.user?.userId === id ||
    d.professionalProfileId === id
  )
}

function toCareDoctor(
  doctor: PublicHospitalDoctor,
  hospitalId: string,
  hospitalName: string,
  city?: string | null,
): CareTeamDoctor {
  return {
    ...doctor,
    doctorId: saasDoctorId(doctor),
    hospitalId,
    hospitalName,
    city: city ?? null,
  }
}

export default function DoctorDetailPage() {
  const { doctorId = '' } = useParams()
  const [search] = useSearchParams()
  const hospitalParam = search.get('hospital') || ''
  const navigate = useNavigate()
  const session = useSelector((s: RootState) => s.userInfo)
  const signedIn = Boolean(session.isAuthenticated && session.userId)

  const hospitalQ = useGetPublicHospitalQuery(hospitalParam, {
    skip: !hospitalParam,
  })
  const careTeamQ = useGetPublicCareTeamQuery(undefined, {
    skip: Boolean(hospitalParam),
  })
  const healthcareDoctorQ = useGetHealthcareDoctorQuery(doctorId, {
    skip: !doctorId,
  })

  const doctor = useMemo((): CareTeamDoctor | null => {
    if (!doctorId) return null

    if (hospitalQ.data) {
      const found = (hospitalQ.data.doctors || []).find((d) =>
        matchesDoctor(d, doctorId),
      )
      if (found) {
        return toCareDoctor(
          found,
          hospitalQ.data.tenantId,
          hospitalQ.data.companyName,
          hospitalQ.data.city,
        )
      }
    }

    const fromTeam = (careTeamQ.data || []).find((d) => matchesDoctor(d, doctorId))
    if (fromTeam) return fromTeam

    const remote = healthcareDoctorQ.data
    if (remote) {
      const mapped: PublicHospitalDoctor = {
        professionalProfileId:
          remote.professionalProfileId ||
          remote.professionalProfile?.professionalProfileId ||
          doctorId,
        doctorId: remote.doctorId || remote.userId || doctorId,
        facilityId: remote.facilityId || remote.professionalProfile?.facilityId,
        specialization:
          remote.specialization || remote.professionalProfile?.specialization,
        publicBio: remote.publicBio || remote.professionalProfile?.publicBio,
        publicPhotoUrl:
          remote.publicPhotoUrl ||
          remote.professionalProfile?.publicPhotoUrl ||
          remote.picture,
        yearsOfExperience:
          remote.yearsOfExperience ||
          remote.professionalProfile?.yearsOfExperience,
        consultationFee:
          remote.consultationFee || remote.professionalProfile?.consultationFee,
        currency: remote.currency || remote.professionalProfile?.currency || 'USD',
        averageRating:
          remote.averageRating || remote.professionalProfile?.averageRating,
        totalReviews:
          remote.totalReviews || remote.professionalProfile?.totalReviews,
        user: remote.user || {
          name: remote.name,
          picture: remote.picture,
          userId: remote.doctorId || remote.userId,
        },
        isVerified: true,
      }
      return toCareDoctor(
        mapped,
        remote.hospitalId || remote.tenantId || remote.tenant?.tenantId || '',
        remote.hospitalName ||
          remote.tenant?.companyName ||
          'Hospital',
        remote.city || remote.tenant?.city,
      )
    }

    return null
  }, [doctorId, hospitalQ.data, careTeamQ.data, healthcareDoctorQ.data])

  const days = useMemo(() => nextDays(7), [])
  const [dayIndex, setDayIndex] = useState(0)
  const [slotIso, setSlotIso] = useState('')
  const [visitType, setVisitType] = useState<'In-Person' | 'Video Call'>(
    search.get('visit') === 'Video Call' ? 'Video Call' : 'In-Person',
  )
  const [consent, setConsent] = useState(false)
  const [reason, setReason] = useState('')
  const [chatOpen, setChatOpen] = useState(search.get('chat') === '1')
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const bookingDoctorId = doctor ? saasDoctorId(doctor) : doctorId
  const selectedDay = days[dayIndex]
  const selectedDate = dayIso(selectedDay)
  const { data: availability, isFetching: loadingSlots } =
    useGetPublicDoctorAvailabilityQuery(
      { doctorId: bookingDoctorId, date: selectedDate },
      { skip: !bookingDoctorId },
    )
  const slots = useMemo(() => {
    const remote = availability?.slots || []
    if (remote.length > 0) return remote
    return buildFallbackSlots(selectedDate)
  }, [availability?.slots, selectedDate])

  const peerId = doctor?.professionalProfileId || bookingDoctorId
  const [book, { isLoading: booking }] = useCreateHealthcareAppointmentMutation()
  const [sendMessage, { isLoading: sending }] = useCreateMessageMutation()
  const { data: thread = [], refetch: refetchThread } = useGetThreadQuery(peerId, {
    skip: !signedIn || !peerId || !chatOpen,
  })

  const loading =
    (!!hospitalParam && hospitalQ.isLoading) ||
    (!hospitalParam && careTeamQ.isLoading) ||
    (healthcareDoctorQ.isLoading && !doctor)

  const backHospital = doctor?.hospitalId || hospitalParam
  const backHref = backHospital
    ? `/hospitals/${encodeURIComponent(backHospital)}`
    : '/hospitals'

  function requireSignIn(next: string) {
    navigate(`/signin?next=${encodeURIComponent(next)}`)
  }

  async function onBook(e?: FormEvent) {
    e?.preventDefault()
    if (!doctor?.hospitalId) {
      setStatus('Hospital context missing — open this doctor from the hospital page.')
      return
    }
    if (!signedIn) {
      requireSignIn(
        `/doctors/${bookingDoctorId}?hospital=${encodeURIComponent(doctor.hospitalId)}`,
      )
      return
    }
    if (!consent) {
      setStatus('Please consent to share booking details with the hospital.')
      return
    }
    if (!slotIso) {
      setStatus('Select an available time slot from the hospital schedule.')
      return
    }
    setStatus(null)
    try {
      const when = new Date(slotIso)
      const appt = await book({
        tenantId: doctor.hospitalId,
        hospitalId: doctor.hospitalId,
        doctorId: bookingDoctorId,
        doctorName: doctorName(doctor),
        specialty: doctor.specialization || 'General Physician',
        facilityName: doctor.hospitalName,
        facilityId: doctor.facilityId || undefined,
        scheduledAt: when.toISOString(),
        reason: reason || `${visitType} visit`,
        type: visitType === 'Video Call' ? 'TELECONSULTATION' : 'IN_PERSON',
        consentGranted: true,
        consultationFee: doctor.consultationFee || undefined,
        currency: doctor.currency || 'USD',
        idempotencyKey: `web-${session.userId}-${bookingDoctorId}-${slotIso}`,
      }).unwrap()
      setStatus(
        `Request sent for ${when.toLocaleString()}. Status: ${appt.status}. Track appointments & tickets in My Healthcare.`,
      )
      navigate('/dashboard?section=healthcare')
    } catch (err: any) {
      setStatus(
        err?.data?.message ||
          err?.message ||
          'We could not complete your appointment request. It was not confirmed. Please try again.',
      )
    }
  }

  async function onSendChat(e: FormEvent) {
    e.preventDefault()
    if (!signedIn) {
      requireSignIn(`/doctors/${bookingDoctorId}?chat=1&hospital=${hospitalParam}`)
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

  if (loading) {
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
        <p className="mt-2 text-sm text-muted-foreground">
          Open the hospital page and choose a clinician to book.
        </p>
        <Button asChild className="mt-6">
          <Link to={backHref}>Back to hospital</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-brand-bg pb-16">
      <div className="container-page space-y-6 py-8">
        <Link
          to={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {doctor.hospitalName || 'Hospital'}
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
                  {typeof doctor.averageRating === 'number' && doctor.totalReviews
                    ? `${doctor.averageRating.toFixed(1)} · ${doctor.totalReviews} reviews`
                    : 'Trusted clinician'}
                  {doctor.consultationFee
                    ? ` · ${doctor.currency || 'USD'} ${doctor.consultationFee}`
                    : ''}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {doctor.publicBio ||
                'Book a visit with live hospital slots. When the hospital accepts, your OPD ticket appears in My Healthcare and in the hospital SaaS console.'}
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
              Pick a date and time, then request. The hospital sees it in SaaS;
              when they accept, your OPD ticket syncs here automatically.
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
                      onClick={() => {
                        setDayIndex(i)
                        setSlotIso('')
                      }}
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
                  Available times
                </p>
                <div className="flex flex-wrap gap-2">
                  {loadingSlots && (availability?.slots?.length || 0) === 0 ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading hospital schedule…
                    </p>
                  ) : slots.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No open times left today — choose tomorrow or a later day.
                    </p>
                  ) : (
                    slots.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSlotIso(item)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          slotIso === item
                            ? 'border-primary bg-primary text-white'
                            : 'border-blue-100 text-brand-dark'
                        }`}
                      >
                        {new Date(item).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </button>
                    ))
                  )}
                </div>
                {slotIso ? (
                  <p className="mt-2 text-xs font-medium text-primary">
                    Selected:{' '}
                    {new Date(slotIso).toLocaleString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                ) : null}
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

              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for visit (optional)"
                rows={2}
              />

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  I consent to share my booking and contact details with{' '}
                  <strong>{doctor.hospitalName}</strong> for this appointment.
                </span>
              </label>

              {status ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800">
                  {status}
                </p>
              ) : null}

              <VisitTicketCard
                preview
                ticket={{
                  doctorName: doctorName(doctor),
                  facilityName: doctor.hospitalName,
                  specialty: doctor.specialization,
                  scheduledAt: slotIso || undefined,
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                <Ticket className="mr-1 inline h-3.5 w-3.5 text-primary" />
                Your real visit ticket number appears in My Healthcare after the
                hospital accepts this booking in SaaS.
              </p>

              <Button
                type="submit"
                className="w-full"
                disabled={booking || (signedIn && (!slotIso || !consent))}
              >
                {booking ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {signedIn ? 'Request appointment' : 'Sign in to book'}
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
            onSignIn={() =>
              requireSignIn(
                `/doctors/${bookingDoctorId}?chat=1&hospital=${doctor.hospitalId}`,
              )
            }
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
  thread: Array<{
    messageid: string
    body: string
    senderId: string
    createdAt: string | Date
  }>
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
          <p className="text-xs text-muted-foreground">
            Secure patient messaging · {peerId.slice(0, 8)}…
          </p>
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
