export const DEFAULT_DIAL = '+252';

export const PHONE_DIALS = [
  '+252',
  '+251',
  '+254',
  '+253',
  '+256',
  '+255',
  '+44',
  '+1',
] as const;

export function normalizePhone(value: string): string {
  let digits = value.trim().replace(/[^\d+]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (!digits.startsWith('+')) digits = `+${digits.replace(/\D/g, '')}`;
  return `+${digits.slice(1).replace(/\D/g, '')}`;
}

export function isValidPhone(value: string): boolean {
  return /^\+\d{8,15}$/.test(normalizePhone(value));
}

export function formatPhoneDisplay(value?: string | null): string {
  if (!value) return '';
  const phone = normalizePhone(value);
  if (!/^\+\d{8,15}$/.test(phone)) return value;
  if (phone.startsWith('+252') && phone.length >= 12) {
    const rest = phone.slice(4);
    return `+252 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5)}`.trim();
  }
  return phone;
}

export function splitPhone(value?: string | null): {
  dial: string;
  national: string;
} {
  const phone = value ? normalizePhone(value) : '';
  if (!phone || phone === '+') return { dial: DEFAULT_DIAL, national: '' };
  const match = PHONE_DIALS.find((d) => phone.startsWith(d));
  if (match) return { dial: match, national: phone.slice(match.length) };
  const m = phone.match(/^\+(\d{1,3})(\d*)$/);
  if (m) return { dial: `+${m[1]}`, national: m[2] };
  return { dial: DEFAULT_DIAL, national: phone.replace(/\D/g, '') };
}

export function joinPhone(dial: string, national: string): string {
  return normalizePhone(`${dial}${national.replace(/\D/g, '')}`);
}
