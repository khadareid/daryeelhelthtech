import { cn } from '@/lib/utils';

export function Switch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn('h-6 w-11 rounded-full transition-colors', checked ? 'bg-brand-primary' : 'bg-slate-300')}
    >
      <span className={cn('block h-5 w-5 translate-x-0.5 rounded-full bg-white transition', checked && 'translate-x-5')} />
    </button>
  );
}
