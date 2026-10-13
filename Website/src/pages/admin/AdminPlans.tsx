import { FormEvent, useState } from 'react'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCreatePlanMutation,
  useDeactivatePlanMutation,
  useGetPlansQuery,
  useUpdatePlanMutation,
} from '@/Redex/service/admin/AdminApi'
import type { RootState } from '@/Redex/store/store'

export default function AdminPlans() {
  const role = String(
    useSelector((s: RootState) => s.userInfo.role) || '',
  ).toUpperCase()
  const isSuper = role === 'SUPER_ADMIN'
  const { data: plans = [], isLoading, refetch } = useGetPlansQuery(undefined, {
    skip: !isSuper,
  })
  const [createPlan, { isLoading: creating }] = useCreatePlanMutation()
  const [updatePlan] = useUpdatePlanMutation()
  const [deactivatePlan] = useDeactivatePlanMutation()

  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [price, setPrice] = useState('49')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState('Appointments\nPatient profiles')

  if (!isSuper) {
    return (
      <p className="rounded-3xl border border-blue-100 bg-white p-6 text-sm text-muted-foreground">
        Plans management requires SUPER_ADMIN.
      </p>
    )
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    try {
      await createPlan({
        code,
        name,
        price: Number(price),
        description,
        features: features.split('\n').map((s) => s.trim()).filter(Boolean),
        interval: 'MONTHLY',
        isActive: true,
        isPublic: true,
      }).unwrap()
      toast.success('Plan created')
      setCode('')
      setName('')
      refetch()
    } catch (err: any) {
      toast.error(err?.data?.message || 'Create failed')
    }
  }

  return (
    <div className="space-y-4">
      <header className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-brand-dark">Plans</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Facility / hospital subscription packages shown on Pricing.
        </p>
      </header>

      <form
        onSubmit={onCreate}
        className="space-y-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5"
      >
        <h2 className="font-heading font-semibold text-brand-dark">New plan</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Code (STARTER)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Price USD"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <Textarea
          placeholder="Features (one per line)"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          rows={3}
        />
        <Button type="submit" disabled={creating}>
          {creating ? 'Saving…' : 'Create plan'}
        </Button>
      </form>

      <section className="space-y-2">
        {isLoading ? <Skeleton className="h-32 rounded-2xl" /> : null}
        {plans.map((plan: any) => (
          <article
            key={plan.planid}
            className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading font-semibold text-brand-dark">
                  {plan.name}{' '}
                  <span className="text-sm font-normal text-muted-foreground">
                    ({plan.code})
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {plan.currency} {Number(plan.price).toFixed(2)} /{' '}
                  {String(plan.interval).toLowerCase()}
                  {plan._count?.subscriptions != null
                    ? ` · ${plan._count.subscriptions} subs`
                    : ''}
                </p>
                <p className="mt-1 text-sm text-brand-dark">{plan.description}</p>
              </div>
              <div className="flex gap-1">
                {plan.isActive ? <Badge>Active</Badge> : <Badge variant="secondary">Off</Badge>}
                {plan.isPublic ? <Badge variant="outline">Public</Badge> : null}
              </div>
            </div>
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {(Array.isArray(plan.features) ? plan.features : []).map(
                (f: string) => (
                  <li key={f}>{f}</li>
                ),
              )}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updatePlan({
                    id: plan.planid,
                    body: { isPublic: !plan.isPublic },
                  })
                }
              >
                {plan.isPublic ? 'Hide from pricing' : 'Show on pricing'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  updatePlan({
                    id: plan.planid,
                    body: { isActive: !plan.isActive },
                  })
                }
              >
                {plan.isActive ? 'Disable' : 'Enable'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm('Deactivate this plan?')) {
                    deactivatePlan(plan.planid)
                  }
                }}
              >
                Deactivate
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
