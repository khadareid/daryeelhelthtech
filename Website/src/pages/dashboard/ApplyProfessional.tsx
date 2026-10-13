import { FormEvent, useState } from 'react'
import {
  useGetMyProfessionalApplicationsQuery,
  useSubmitProfessionalApplicationMutation,
} from '@/Redex/service/news/NewsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const ROLES = ['DOCTOR', 'NURSE', 'MIDWIFE', 'LAB_TECH', 'PHARMACIST'] as const

export default function ApplyProfessional() {
  const [requestedRole, setRequestedRole] =
    useState<(typeof ROLES)[number]>('DOCTOR')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [yearsOfExperience, setYears] = useState('1')
  const [facilityName, setFacility] = useState('')
  const [qualifications, setQualifications] = useState('')
  const [notes, setNotes] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [submit, { isLoading }] = useSubmitProfessionalApplicationMutation()
  const { data: mine = [], refetch } = useGetMyProfessionalApplicationsQuery()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    try {
      await submit({
        requestedRole,
        licenseNumber,
        specialization,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        facilityName,
        qualifications,
        notes,
      }).unwrap()
      setMessage('Application submitted for Super Admin review.')
      refetch()
    } catch (err: any) {
      setMessage(err?.data?.message || err?.message || 'Submission failed')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Apply as a healthcare professional
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          You will not receive clinical privileges until a Super Admin approves
          your application. License verification is recorded as admin-reviewed,
          not independently verified by a third party.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"
      >
        <label className="block text-sm font-medium">
          Professional type
          <select
            className="mt-1 w-full rounded-xl border border-blue-100 px-3 py-2"
            value={requestedRole}
            onChange={(e) =>
              setRequestedRole(e.target.value as (typeof ROLES)[number])
            }
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
        <Input
          placeholder="License / registration number"
          value={licenseNumber}
          onChange={(e) => setLicenseNumber(e.target.value)}
          required
        />
        <Input
          placeholder="Specialization"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        />
        <Input
          placeholder="Years of experience"
          type="number"
          min={0}
          value={yearsOfExperience}
          onChange={(e) => setYears(e.target.value)}
        />
        <Input
          placeholder="Facility / workplace"
          value={facilityName}
          onChange={(e) => setFacility(e.target.value)}
        />
        <Textarea
          placeholder="Qualifications"
          value={qualifications}
          onChange={(e) => setQualifications(e.target.value)}
        />
        <Textarea
          placeholder="Notes for reviewers"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {message ? (
          <p className="rounded-xl bg-brand-bg px-3 py-2 text-sm">{message}</p>
        ) : null}
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Submitting…' : 'Submit application'}
        </Button>
      </form>

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h2 className="font-heading font-semibold text-brand-dark">
          Your applications
        </h2>
        <div className="mt-3 space-y-2">
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            mine.map((app: any) => (
              <div
                key={app.professionalapplicationid}
                className="rounded-xl border border-blue-50 p-3 text-sm"
              >
                <p className="font-medium">
                  {app.requestedRole} · {app.status}
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(app.submittedAt).toLocaleString()}
                </p>
                {app.rejectionReason ? (
                  <p className="mt-1 text-xs text-red-600">{app.rejectionReason}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
