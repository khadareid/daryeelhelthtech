import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Alert({
  children,
  variant = 'default',
  className,
}: {
  children: ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-md border p-4 [&>svg~div]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
        variant === 'destructive' 
          ? 'border-red-200 bg-red-50 text-brand-danger' 
          : 'border-blue-100 bg-brand-light text-brand-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h5
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('text-sm [&_p]:leading-relaxed', className)}>
      {children}
    </div>
  );
}
