import * as React from 'react';
import { cn } from '@/lib/utils';

export const Badge = ({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'success' | 'danger' | 'secondary' }) => (
  <div
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      variant === 'default' && 'bg-brand-light text-brand-dark',
      variant === 'success' && 'bg-emerald-100 text-emerald-700',
      variant === 'danger' && 'bg-red-100 text-red-700',
      variant === 'secondary' && 'bg-slate-100 text-slate-700',
      className,
    )}
    {...props}
  />
);
