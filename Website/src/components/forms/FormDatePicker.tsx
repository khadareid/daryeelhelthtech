import { FormField } from './FormField';

export function FormDatePicker({ name, label }: { name: string; label: string }) {
  return <FormField name={name} label={label} type="datetime-local" />;
}
