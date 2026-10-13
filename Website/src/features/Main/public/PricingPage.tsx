import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetPublicPlansQuery } from '@/Redex/service/admin/AdminApi'
import { siteConfig } from '@/config/site'

export function PricingPage() {
  const { data: plans = [], isLoading, isError } = useGetPublicPlansQuery()

  return (
    <section className="bg-brand-bg py-12 sm:py-16">
      <div className="container-page">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {siteConfig.appName}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-bold text-brand-dark sm:text-4xl">
          Facility plans
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Free for patients. Hospitals and clinics choose a monthly plan managed
          by Super Admin.
        </p>

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        ) : null}

        {isError || (!isLoading && plans.length === 0) ? (
          <p className="mt-8 rounded-3xl border border-blue-100 bg-white p-6 text-sm text-muted-foreground">
            No public plans published yet.
          </p>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {plans.map((plan: any) => (
            <article
              key={plan.planid}
              className="flex flex-col rounded-3xl border border-blue-100 bg-white p-6 shadow-sm"
            >
              <h2 className="font-heading text-xl font-bold text-brand-dark">
                {plan.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
              <p className="mt-4 font-heading text-3xl font-bold text-primary">
                {plan.currency} {Number(plan.price).toFixed(0)}
                <span className="text-sm font-medium text-muted-foreground">
                  /{String(plan.interval || 'MONTHLY').toLowerCase()}
                </span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {(Array.isArray(plan.features) ? plan.features : []).map(
                  (f: string) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-brand-dark"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <Button asChild className="mt-6">
                <Link to="/signin">Talk to sales</Link>
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
