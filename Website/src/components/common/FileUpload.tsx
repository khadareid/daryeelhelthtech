import { Input } from '@/components/ui/input';

export function FileUpload({ onChange }: { onChange?: (file: File | null) => void }) {
  return <Input type="file" onChange={(e) => onChange?.(e.target.files?.[0] ?? null)} />;
}
