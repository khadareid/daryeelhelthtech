import { cn } from "@/lib/utils"
import type { EnumOption } from "@/lib/enums"

export function EnumSelect({
  label,
  value,
  onChange,
  options,
  required,
  placeholder = "Select…",
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: EnumOption[]
  required?: boolean
  placeholder?: string
  className?: string
}) {
  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-brand-dark">
        {label}
        {required ? " *" : ""}
      </span>
      <select
        className="h-10 w-full rounded-xl border border-blue-100 bg-white px-3 text-sm text-brand-dark outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function FormField({
  label,
  children,
  className,
  required,
}: {
  label: string
  children: React.ReactNode
  className?: string
  required?: boolean
}) {
  return (
    <label className={cn("block space-y-1.5 text-sm", className)}>
      <span className="font-medium text-brand-dark">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  )
}
