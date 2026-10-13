import { FileUpload } from './FileUpload';

export function ImageUpload({ onChange }: { onChange?: (file: File | null) => void }) {
  return <FileUpload onChange={onChange} />;
}
