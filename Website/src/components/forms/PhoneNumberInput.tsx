import { Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  PHONE_COUNTRIES,
  joinPhone,
  splitPhone,
} from "@/lib/phone"
import { cn } from "@/lib/utils"

type Props = {
  id?: string
  label?: string
  value: string
  onChange: (e164: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
  helperText?: string
}

/**
 * Country-code phone input. Emits E.164-style value (e.g. +252634000100).
 * No OTP / verification — collect only.
 */
export function PhoneNumberInput({
  id = "phone",
  label = "Phone Number",
  value,
  onChange,
  required,
  disabled,
  className,
  helperText = "Example: +252 63 XXX XXXX",
}: Props) {
  const { dial, national } = splitPhone(value)

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? " *" : ""}
        </Label>
      ) : null}
      <div className="flex gap-2">
        <select
          aria-label="Country code"
          value={dial}
          disabled={disabled}
          onChange={(e) => onChange(joinPhone(e.target.value, national))}
          className="h-11 w-[7.5rem] shrink-0 rounded-md border border-blue-100 bg-brand-bg px-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code} value={c.dial}>
              {c.dial}
            </option>
          ))}
          {!PHONE_COUNTRIES.some((c) => c.dial === dial) ? (
            <option value={dial}>{dial}</option>
          ) : null}
        </select>
        <div className="relative min-w-0 flex-1">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            required={required}
            disabled={disabled}
            value={national}
            placeholder="63 XXX XXXX"
            onChange={(e) =>
              onChange(joinPhone(dial, e.target.value.replace(/[^\d]/g, "")))
            }
            className="h-11 border-blue-100 bg-brand-bg pl-10 focus-visible:ring-primary"
          />
        </div>
      </div>
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  )
}
