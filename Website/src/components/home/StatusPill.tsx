import { cn } from "@/lib/utils"

type Status = "Available" | "Coming Soon" | "Planned" | "Long-Term Vision"

const styles: Record<Status, string> = {
  Available: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  "Coming Soon": "bg-amber-50 text-amber-800 ring-amber-100",
  Planned: "bg-slate-100 text-slate-600 ring-slate-200",
  "Long-Term Vision": "bg-blue-50 text-blue-700 ring-blue-100",
}

export function StatusPill({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        styles[status],
        className,
      )}
    >
      {status}
    </span>
  )
}
