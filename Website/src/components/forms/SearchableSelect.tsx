import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Props = {
  label: string
  value: string
  options: string[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  onChange: (value: string) => void
}

/** Dropdown with type-to-filter search (used for Country). */
export function SearchableSelect({
  label,
  value,
  options,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  return (
    <div className="space-y-1.5" ref={rootRef}>
      <Label>{label}</Label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 text-left text-sm",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          <span className={cn(!value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>

        {open ? (
          <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-blue-50 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-8 w-full bg-transparent text-sm outline-none"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No countries found
                </li>
              ) : (
                filtered.map((opt) => (
                  <li key={opt}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full px-3 py-2 text-left text-sm hover:bg-brand-light",
                        opt === value && "bg-brand-light font-semibold text-primary",
                      )}
                      onClick={() => {
                        onChange(opt)
                        setOpen(false)
                      }}
                    >
                      {opt}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}
