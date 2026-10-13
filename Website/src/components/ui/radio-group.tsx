import * as React from 'react';
import { Label } from './label';

export function RadioGroup({ children }: { children: React.ReactNode }) {
  return <div role="radiogroup">{children}</div>;
}
export function RadioGroupItem({ value, name }: { value: string; name?: string }) {
  return (
    <Label className="flex items-center gap-2">
      <input type="radio" name={name} value={value} />
      {value}
    </Label>
  );
}
