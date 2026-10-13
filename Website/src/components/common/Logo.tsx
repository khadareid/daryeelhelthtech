import { Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  compact?: boolean;
}

export function Logo({ className, compact }: LogoProps) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)} aria-label={siteConfig.name}>
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-primary text-white">
        <Activity className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="font-heading text-lg font-semibold text-brand-dark">{siteConfig.name}</span>
      )}
    </Link>
  );
}
