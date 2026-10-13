import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  hint?: string;
  className?: string;
}

export function StatsCard({ title, value, hint, className }: StatsCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold text-brand-dark">{value}</p>
        {hint && <p className="mt-1 text-xs text-brand-success">{hint}</p>}
      </CardContent>
    </Card>
  );
}
