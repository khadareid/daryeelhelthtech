import { FormField } from './FormField';

export function FormSelect({ name, label }: { name: string; label: string }) {
  return <FormField name={name} label={label} />;
}
