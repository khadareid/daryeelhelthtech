import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function FormTextarea({ name, label }: { name: string; label: string }) {
  const { register, formState } = useFormContext();
  const err = formState.errors[name]?.message as string | undefined;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} {...register(name)} />
      {err && <p className="text-xs text-brand-danger">{err}</p>}
    </div>
  );
}
