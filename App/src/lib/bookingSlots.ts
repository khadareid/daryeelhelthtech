/** Doctor booking times — every 20 minutes (e.g. 8:00, 8:20, 8:40…) */

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

export function nextBookingDays(count = 7): Date[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function slotToHours(slot: string): { h: number; m: number } {
  const match = slot.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return { h: 8, m: 0 };
  let h = Number(match[1]);
  const m = Number(match[2]);
  const ampm = (match[3] || '').toUpperCase();
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return { h, m };
}

export function combineDayAndSlot(day: Date, slot: string): Date {
  const { h, m } = slotToHours(slot);
  const when = new Date(day);
  when.setHours(h, m, 0, 0);
  return when;
}

/** True when the slot start is at or before now (cannot book). */
export function isSlotInPast(
  day: Date,
  slot: string,
  now: Date = new Date(),
): boolean {
  return combineDayAndSlot(day, slot).getTime() <= now.getTime();
}

export function firstAvailableSlot(
  day: Date,
  slots: string[] = BOOKING_TIME_SLOTS,
  now: Date = new Date(),
): string | null {
  return slots.find((s) => !isSlotInPast(day, s, now)) ?? null;
}
