import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AdminPageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  meta,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <header className="rounded-xl border border-blue-100 bg-white px-4 py-3.5 shadow-sm sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading text-xl font-bold text-brand-dark sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
          {meta ? (
            <div className="mt-1 text-[11px] text-muted-foreground">{meta}</div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

export function AdminPanel({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-blue-100 bg-white p-3.5 shadow-sm sm:p-4",
        className
      )}
    >
      {title ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-heading text-sm font-bold text-brand-dark sm:text-base">
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
      {children}
    </div>
  )
}

export function AdminFilterChips({
  items,
  value,
  onChange,
}: {
  items: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <button
          key={item.id || "all"}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
            value === item.id
              ? "bg-primary text-white"
              : "border border-blue-100 bg-brand-light text-primary hover:border-primary/40"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

export function AdminTable({
  columns,
  children,
  empty,
  loading,
  minWidth = "720px",
}: {
  columns: string[]
  children: ReactNode
  empty?: string
  loading?: boolean
  minWidth?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-blue-50 bg-brand-light/50 text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {loading ? (
        <p className="p-4 text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {!loading && empty ? (
        <p className="p-4 text-center text-sm text-muted-foreground">{empty}</p>
      ) : null}
    </div>
  )
}

export function AdminPagination({
  page,
  totalPages,
  onPage,
  total,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
  total?: number
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 shadow-sm">
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-lg border-blue-100"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Prev
      </Button>
      <span className="text-[11px] text-muted-foreground">
        Page {page} / {Math.max(1, totalPages)}
        {typeof total === "number" ? ` · ${total.toLocaleString()} total` : ""}
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-lg border-blue-100"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}

export function AdminDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <aside
        className={cn(
          "relative z-10 flex h-full w-full flex-col border-l border-blue-100 bg-white shadow-xl",
          wide ? "max-w-xl" : "max-w-md"
        )}
      >
        <div className="border-b border-blue-50 px-4 py-3.5 sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            Manage
          </p>
          <h2 className="mt-0.5 font-heading text-lg font-bold text-brand-dark">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-blue-50 px-4 py-3 sm:px-5">
            {footer}
          </div>
        ) : null}
      </aside>
    </div>
  )
}

export function AdminField({
  label,
  children,
  required,
  className,
}: {
  label: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="text-[13px] font-medium text-brand-dark">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  )
}

export function AdminStatusPill({
  label,
  tone = "neutral",
}: {
  label: string
  tone?: "ok" | "warn" | "danger" | "neutral"
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "ok" && "bg-primary/10 text-primary",
        tone === "warn" && "bg-amber-100 text-amber-800",
        tone === "danger" && "bg-rose-100 text-rose-700",
        tone === "neutral" && "bg-brand-light text-brand-dark"
      )}
    >
      {label}
    </span>
  )
}

export const adminInputClass =
  "h-9 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm outline-none focus:border-primary"

export const adminSelectClass =
  "h-9 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm outline-none focus:border-primary"
