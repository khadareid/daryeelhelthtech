import { Link, useParams } from 'react-router-dom'
import { BadgeCheck, Calendar, MessageSquare, Star, UserPlus } from 'lucide-react'
import {
  professionalPhoto,
  useGetProfessionalQuery,
  useRequestConnectionMutation,
} from '@/Redex/service/professionals/ProfessionalsApi'
import { useCreateAppointmentMutation } from '@/Redex/service/appointments/AppointmentsApi'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'
import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function ProfessionalDetailPage() {
  const { slug = '' } = useParams()
  const { isAuthenticated } = useAuth()
  const { data: pro, isLoading, isError } = useGetProfessionalQuery(slug, {
    skip: !slug,
  })
  const [requestConnection, { isLoading: connecting }] =
    useRequestConnectionMutation()
  const [createAppointment, { isLoading: booking }] =
    useCreateAppointmentMutation()
  const [when, setWhen] = useState('')

  if (isLoading) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !pro) {
    return (
      <div className="container-page py-10">
        <h1 className="font-heading text-2xl font-bold">Professional not found</h1>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/doctors">Back to doctors</Link>
        </Button>
      </div>
    )
  }

  const verified = pro.verified || pro.isVerified

  const onConnect = async () => {
    if (!isAuthenticated) {
      toast.message('Sign in to connect')
      return
    }
    try {
      await requestConnection({
        professionalUserId: pro.userId,
        reason: 'Patient connection request',
      }).unwrap()
      toast.success('Connection request sent')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Could not send request')
    }
  }

  const onBook = async () => {
    if (!isAuthenticated) {
      toast.message('Sign in to book')
      return
    }
    if (!when) {
      toast.message('Choose a date and time')
      return
    }
    try {
      await createAppointment({
        doctorId: pro.id,
        professionalUserId: pro.userId,
        doctorName: pro.name,
        specialty: pro.specialization || pro.specialty,
        scheduledAt: new Date(when).toISOString(),
        reason: 'Consultation',
      }).unwrap()
      toast.success('Appointment booked')
    } catch (e: any) {
      toast.error(e?.data?.message || 'Booking failed')
    }
  }

  return (
    <div className="min-h-[70vh] bg-brand-bg">
      <div className="container-page py-10 sm:py-12">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-8">
            <img
              src={professionalPhoto(pro)}
              alt={pro.name}
              className="mx-auto h-36 w-36 rounded-3xl object-cover sm:h-40 sm:w-40"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-3xl font-bold text-brand-dark">
                  {pro.name}
                </h1>
                {verified ? (
                  <Badge className="gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified {pro.professionalType?.replace(/_/g, ' ') || 'Doctor'}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-primary">
                {pro.specialization || pro.specialty}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {pro.city}
                {pro.yearsOfExperience
                  ? ` · ${pro.yearsOfExperience} years experience`
                  : ''}
                {pro.rating > 0 ? (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {pro.rating.toFixed(1)} ({pro.reviews})
                  </span>
                ) : null}
              </p>
              {pro.languages?.length ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Languages: {pro.languages.join(' · ')}
                </p>
              ) : null}
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600">
                {pro.bio}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button onClick={onConnect} disabled={connecting} className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Connect
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/dashboard?section=messages">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Link>
                </Button>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-[#F8FAFC] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-brand-dark">
                  <Calendar className="h-4 w-4 text-primary" />
                  Book appointment
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    type="datetime-local"
                    value={when}
                    onChange={(e) => setWhen(e.target.value)}
                    className="h-10 rounded-xl border border-blue-100 bg-white px-3 text-sm"
                  />
                  <Button onClick={onBook} disabled={booking}>
                    Confirm booking
                  </Button>
                </div>
                {pro.availability?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pro.availability.map((slot) => (
                      <Badge key={slot.id} variant="outline" className="font-normal">
                        {DAYS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
