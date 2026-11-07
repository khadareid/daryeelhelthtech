/** Local Somali / regional money options for Pay now + invoices */

export type LocalPayMethod = {
  id: string;
  label: string;
  method: 'MOBILE_MONEY' | 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'WALLET' | 'OTHER';
  provider: string;
  hint: string;
};

export const LOCAL_PAY_METHODS: LocalPayMethod[] = [
  {
    id: 'zaad',
    label: 'Zaad',
    method: 'MOBILE_MONEY',
    provider: 'ZAAD',
    hint: 'Telesom Zaad — enter your Zaad number',
  },
  {
    id: 'edahab',
    label: 'eDahab',
    method: 'MOBILE_MONEY',
    provider: 'EDAHAB',
    hint: 'Hormuud eDahab — enter your eDahab number',
  },
  {
    id: 'sahal',
    label: 'Sahal',
    method: 'MOBILE_MONEY',
    provider: 'SAHAL',
    hint: 'Somtel Sahal — enter your Sahal number',
  },
  {
    id: 'evc',
    label: 'EVC Plus',
    method: 'MOBILE_MONEY',
    provider: 'EVC_PLUS',
    hint: 'Hormuud EVC Plus wallet',
  },
  {
    id: 'premier',
    label: 'Premier Wallet',
    method: 'WALLET',
    provider: 'PREMIER_WALLET',
    hint: 'Premier Bank wallet',
  },
  {
    id: 'cash',
    label: 'Cash',
    method: 'CASH',
    provider: 'CASH',
    hint: 'Pay at clinic in cash',
  },
  {
    id: 'bank',
    label: 'Bank transfer',
    method: 'BANK_TRANSFER',
    provider: 'BANK',
    hint: 'Bank deposit / transfer',
  },
  {
    id: 'card',
    label: 'Card',
    method: 'CARD',
    provider: 'CARD',
    hint: 'Visa / Mastercard',
  },
];

export function localPayLabel(provider?: string | null, method?: string | null) {
  if (provider) {
    const hit = LOCAL_PAY_METHODS.find(
      (m) => m.provider === String(provider).toUpperCase(),
    );
    if (hit) return hit.label;
  }
  if (!method) return '—';
  return String(method).replace(/_/g, ' ');
}

export type InvoiceDraft = {
  appointmentId: string;
  paymentId?: string;
  appointmentCode?: string;
  doctorName?: string;
  patientName?: string;
  scheduledAt?: string;
  amount: number;
  currency: string;
  reason?: string | null;
};

export function buildTimeSlots(
  startHour = 8,
  endHour = 20,
  stepMinutes = 20,
): string[] {
  const slots: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      if (h === endHour && m > 0) break;
      const hour12 = ((h + 11) % 12) + 1;
      const ampm = h < 12 ? 'AM' : 'PM';
      slots.push(
        `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`,
      );
    }
  }
  return slots;
}

export const BOOKING_TIME_SLOTS = buildTimeSlots(8, 20, 20);
