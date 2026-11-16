import { useCountUp } from "@/hooks/useCountUp"

export function NetworkStat({
  label,
  value,
  loading,
}: {
  label: string
  value: number | null
  loading?: boolean
}) {
  const animated = useCountUp(value && value > 0 ? value : 0)

  if (!loading && (value == null || value <= 0)) return null

  return (
    <div className="rounded-2xl border border-blue-100 bg-white px-4 py-5 text-center shadow-sm">
      <p className="font-heading text-3xl font-bold text-brand-dark tabular-nums">
        {loading ? "—" : animated}
      </p>
      <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  )
}
