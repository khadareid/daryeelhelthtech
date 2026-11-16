import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Props = {
  healthId?: string | null
  className?: string
  compact?: boolean
}

function maskHealthId(id: string) {
  if (id.length <= 4) return "••••"
  return `${"•".repeat(Math.min(10, id.length - 4))}${id.slice(-4)}`
}

export function PatientIdCard({ healthId, className, compact }: Props) {
  const [visible, setVisible] = useState(false)

  if (!healthId) return null

  const display = visible ? healthId : maskHealthId(healthId)

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-xs tracking-wide",
          className,
        )}
      >
        Patient ID · {display}
        <button
          type="button"
          className="rounded p-0.5 text-muted-foreground hover:text-primary"
          aria-label={visible ? "Hide Health ID" : "Show Health ID"}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setVisible((v) => !v)
          }}
        >
          {visible ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </button>
      </Badge>
    )
  }

  return (
    <Card className={cn("border-blue-100 bg-white shadow-sm", className)}>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Daryeel Health ID
          </p>
          <p className="mt-1 font-mono text-lg font-bold tracking-wide text-brand-dark">
            {display}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Permanent patient identity — never changes with professional roles.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 border-primary/20"
          aria-label={visible ? "Hide Health ID" : "Show Health ID"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
