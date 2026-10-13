import { FormEvent, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCreateSubscriptionMutation,
  useGetPlansQuery,
  useGetSubscriptionsQuery,
  useUpdateSubscriptionMutation,
} from '@/Redex/service/admin/AdminApi'
import type { RootState } from '@/Redex/store/store'

const STATUSES = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']

export default function AdminSubscriptions() {
  const role = String(
    useSelector((s: RootState) => s.userInfo.role) || '',
  ).toUpperCase()
  const isSuper = role === 'SUPER_ADMIN'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useGetSubscriptionsQuery(
    {
      page,
      limit: 20,
      search: search || undefined,
      status: status || undefined,
    },
    { skip: !isSuper },
  )
  const { data: plans = [] } = useGetPlansQuery(undefined, { skip: !isSuper })
  const [createSub, { isLoading: creating }] = useCreateSubscriptionMutation()
  const [updateSub] = useUpdateSubscriptionMutation()

  const [planId, setPlanId] = useState('')
  const [org, setOrg] = useState('')
  const [email, setEmail] = useState('')

  if (!isSuper) {
    return (
      <p className="rounded-3xl border border-blue-100 bg-white p-6 text-sm text-muted-foreground">
        Subscriptions require SUPER_ADMIN.
      </p>
    )
  }

  const rows = data?.data ?? []
  const pagination = data?.pagination

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createSub({
        planId,
        organizationName: org,
        contactEmail: email || undefined,
        status: 'ACTIVE',
      }).unwrap()
      toast.success('Subscription created')
      setOrg('')
      setEmail('')
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || 'Create failed')
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">
          Subscriptions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Facility billing relationships tied to plans.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Search organization or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </header>

      <form
        onSubmit={onCreate}
        className="space-y-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm"
      >
        <h2 className="font-heading font-semibold text-brand-dark">
          New subscription
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            required
          >
            <option value="">Select plan</option>
            {plans.map((p: any) => (
              <option key={p.planid} value={p.planid}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <Input
            placeholder="Organization name"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Billing email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={creating || !planId}>
          {creating ? 'Saving…' : 'Create subscription'}
        </Button>
      </form>

      <section className="space-y-2">
        {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : null}
        {rows.map((sub: any) => (
          <article
            key={sub.subscriptionid}
            className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading font-semibold text-brand-dark">
                  {sub.organizationName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sub.plan?.name} · {sub.contactEmail || 'No email'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sub.startsAt).toLocaleDateString()} →{' '}
                  {sub.endsAt
                    ? new Date(sub.endsAt).toLocaleDateString()
                    : 'open'}
                </p>
              </div>
              <Badge
                variant={
                  sub.status === 'ACTIVE' || sub.status === 'TRIALING'
                    ? 'default'
                    : 'secondary'
                }
              >
                {sub.status}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={sub.status === s ? 'default' : 'outline'}
                  onClick={() =>
                    updateSub({
                      id: sub.subscriptionid,
                      body: { status: s },
                    })
                  }
                >
                  {s}
                </Button>
              ))}
            </div>
          </article>
        ))}
        {rows.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">No subscriptions yet.</p>
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
