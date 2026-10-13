import { FormField } from './FormField';

export function FormPhoneInput({ name, label }: { name: string; label: string }) {
  return <FormField name={name} label={label} placeholder="+2526XXXXXXX" />;
}
