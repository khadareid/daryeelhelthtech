import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Props = {
  healthId?: string | null
  className?: string
  compact?: boolean
}

export function PatientIdCard({ healthId, className, compact }: Props) {
  if (!healthId) return null

  if (compact) {
    return (
      <Badge
        variant="outline"
        className={cn('font-mono text-xs tracking-wide', className)}
      >
        Patient ID · {healthId}
      </Badge>
    )
  }

  return (
    <Card className={cn('border-blue-100 bg-white shadow-sm', className)}>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Daryeel Health ID
          </p>
          <p className="mt-1 font-mono text-lg font-bold tracking-wide text-brand-dark">
            {healthId}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Permanent patient identity — never changes with professional roles.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
