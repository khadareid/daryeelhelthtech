import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/ownership";
import { optionalString, parseBool, parseNumber, requireString } from "../utils/validation";

const CLINIC_OFFSET_MS = 3 * 60 * 60_000;

function parseMinutes(raw: string): number {
  const [h, m] = String(raw || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function dayOfWeekForDate(date: string): number {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).getUTCDay();
}

function clinicDateTime(date: string, hhmm: string): Date {
  const t = hhmm.length === 5 ? `${hhmm}:00` : hhmm;
  return new Date(`${date}T${t}+03:00`);
}

async function requireMyDoctor(userId: string) {
  const doctor = await prisma.doctor.findUnique({ where: { userId } });
  if (!doctor) throw new HttpError(404, "Doctor profile not found");
  return doctor;
}

export const listMySchedules = async (userId: string) => {
  const doctor = await requireMyDoctor(userId);
  return prisma.doctorSchedule.findMany({
    where: { doctorId: doctor.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
};

export const createMySchedule = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const doctor = await requireMyDoctor(userId);
  const dayOfWeek = parseNumber(body.dayOfWeek, "dayOfWeek");
  const startTime = requireString(body.startTime, "startTime");
  const endTime = requireString(body.endTime, "endTime");
  if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new HttpError(400, "dayOfWeek must be 0–6");
  }
  if (parseMinutes(startTime) >= parseMinutes(endTime)) {
    throw new HttpError(400, "startTime must be before endTime");
  }

  const slotMinutes =
    parseNumber(body.slotMinutes, "slotMinutes") ||
    doctor.appointmentDurationMinutes ||
    30;

  return prisma.doctorSchedule.create({
    data: {
      doctorId: doctor.id,
      dayOfWeek,
      startTime,
      endTime,
      breakStart: optionalString(body.breakStart) ?? null,
      breakEnd: optionalString(body.breakEnd) ?? null,
      slotMinutes,
      label: optionalString(body.label) ?? null,
      isAvailable: parseBool(body.isAvailable, true)!,
    },
  });
};

export const updateMySchedule = async (
  userId: string,
  scheduleId: string,
  body: Record<string, unknown>
) => {
  const doctor = await requireMyDoctor(userId);
  const existing = await prisma.doctorSchedule.findFirst({
    where: { id: scheduleId, doctorId: doctor.id },
  });
  if (!existing) throw new HttpError(404, "Schedule not found");

  const data: Prisma.DoctorScheduleUpdateInput = {};
  if (body.dayOfWeek != null) data.dayOfWeek = Number(body.dayOfWeek);
  if (body.startTime != null) data.startTime = String(body.startTime);
  if (body.endTime != null) data.endTime = String(body.endTime);
  if (body.breakStart !== undefined) {
    data.breakStart = optionalString(body.breakStart) ?? null;
  }
  if (body.breakEnd !== undefined) {
    data.breakEnd = optionalString(body.breakEnd) ?? null;
  }
  if (body.slotMinutes != null) data.slotMinutes = Number(body.slotMinutes) || 30;
  if (body.label !== undefined) data.label = optionalString(body.label) ?? null;
  if (body.isAvailable != null) data.isAvailable = Boolean(body.isAvailable);

  return prisma.doctorSchedule.update({ where: { id: scheduleId }, data });
};

export const deleteMySchedule = async (userId: string, scheduleId: string) => {
  const doctor = await requireMyDoctor(userId);
  const existing = await prisma.doctorSchedule.findFirst({
    where: { id: scheduleId, doctorId: doctor.id },
  });
  if (!existing) throw new HttpError(404, "Schedule not found");
  await prisma.doctorSchedule.delete({ where: { id: scheduleId } });
  return { deleted: true };
};

export const copyMyScheduleDay = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const doctor = await requireMyDoctor(userId);
  const fromDay = Number(body.fromDay);
  const toDays = Array.isArray(body.toDays) ? body.toDays.map(Number) : [];
  if (Number.isNaN(fromDay) || toDays.length === 0) {
    throw new HttpError(400, "fromDay and toDays[] are required");
  }
  const source = await prisma.doctorSchedule.findMany({
    where: { doctorId: doctor.id, dayOfWeek: fromDay },
  });
  if (source.length === 0) {
    throw new HttpError(404, "No shifts on the source day");
  }
  const created = [];
  for (const day of toDays) {
    if (Number.isNaN(day) || day < 0 || day > 6 || day === fromDay) continue;
    await prisma.doctorSchedule.deleteMany({
      where: { doctorId: doctor.id, dayOfWeek: day },
    });
    for (const s of source) {
      created.push(
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: day,
            startTime: s.startTime,
            endTime: s.endTime,
            breakStart: s.breakStart,
            breakEnd: s.breakEnd,
            slotMinutes: s.slotMinutes,
            label: s.label,
            isAvailable: s.isAvailable,
          },
        })
      );
    }
  }
  return created;
};

export const listMyTimeOff = async (userId: string) => {
  const doctor = await requireMyDoctor(userId);
  return prisma.doctorTimeOff.findMany({
    where: { doctorId: doctor.id },
    orderBy: { date: "desc" },
  });
};

export const createMyTimeOff = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const doctor = await requireMyDoctor(userId);
  const date = requireString(body.date, "date");
  return prisma.doctorTimeOff.create({
    data: {
      doctorId: doctor.id,
      date: new Date(date),
      startTime: optionalString(body.startTime) ?? null,
      endTime: optionalString(body.endTime) ?? null,
      kind: optionalString(body.kind) || "OFF_DUTY",
      reason: optionalString(body.reason) ?? null,
    },
  });
};

export const deleteMyTimeOff = async (userId: string, timeOffId: string) => {
  const doctor = await requireMyDoctor(userId);
  const existing = await prisma.doctorTimeOff.findFirst({
    where: { id: timeOffId, doctorId: doctor.id },
  });
  if (!existing) throw new HttpError(404, "Time off not found");
  await prisma.doctorTimeOff.delete({ where: { id: timeOffId } });
  return { deleted: true };
};

export const getDoctorDayAvailability = async (
  doctorId: string,
  date: string
) => {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || !doctor.isActive) {
    throw new HttpError(404, "Doctor not found");
  }

  if (!doctor.isAvailable) {
    return {
      doctorId,
      date,
      status: "UNAVAILABLE",
      reason: "Doctor marked unavailable",
      workingHours: [],
      slots: [],
      nextAvailable: null,
    };
  }

  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const timeOffs = await prisma.doctorTimeOff.findMany({
    where: { doctorId, date: dayStart, isActive: true },
  });
  const fullDay = timeOffs.find((t) => !t.startTime && !t.endTime);
  if (fullDay) {
    return {
      doctorId,
      date,
      status: fullDay.kind === "HOLIDAY" ? "HOLIDAY" : "OFF_DUTY",
      reason: fullDay.reason || "Not available today",
      workingHours: [],
      slots: [],
      nextAvailable: null,
    };
  }

  const dow = dayOfWeekForDate(date);
  let windows = await prisma.doctorSchedule.findMany({
    where: { doctorId, dayOfWeek: dow, isAvailable: true },
    orderBy: { startTime: "asc" },
  });

  // If doctor never configured a schedule, fall back to default clinic hours
  const anySchedule = await prisma.doctorSchedule.count({ where: { doctorId } });
  if (windows.length === 0 && anySchedule === 0) {
    windows = [
      {
        id: "default",
        doctorId,
        dayOfWeek: dow,
        startTime: "08:00",
        endTime: "17:00",
        breakStart: "12:00",
        breakEnd: "13:00",
        slotMinutes: doctor.appointmentDurationMinutes || 30,
        label: "Default",
        isAvailable: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }

  if (windows.length === 0) {
    return {
      doctorId,
      date,
      status: "NOT_SCHEDULED",
      reason: "No working schedule for this day",
      workingHours: [],
      slots: [],
      nextAvailable: null,
    };
  }

  const dayStartIso = clinicDateTime(date, "00:00");
  const dayEndIso = clinicDateTime(date, "23:59");
  const booked = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: {
        in: [
          "PENDING",
          "CONFIRMED",
          "ACCEPTED",
          "CHECKED_IN",
          "IN_PROGRESS",
          "RESCHEDULE_REQUESTED",
        ],
      },
      scheduledAt: { gte: dayStartIso, lte: dayEndIso },
    },
    select: { scheduledAt: true, duration: true },
  });

  const partialBlocks = timeOffs.filter((t) => t.startTime && t.endTime);
  const now = Date.now() + 5 * 60_000;
  const slots: Array<{
    time: string;
    iso: string;
    available: boolean;
    reason?: string | null;
  }> = [];

  for (const w of windows) {
    const slotMin = w.slotMinutes || doctor.appointmentDurationMinutes || 30;
    const start = parseMinutes(w.startTime);
    const end = parseMinutes(w.endTime);
    const bs = w.breakStart ? parseMinutes(w.breakStart) : null;
    const be = w.breakEnd ? parseMinutes(w.breakEnd) : null;
    const segments =
      bs != null && be != null && be > bs && bs >= start && be <= end
        ? [
            ...(bs > start ? [{ start, end: bs }] : []),
            ...(end > be ? [{ start: be, end }] : []),
          ]
        : [{ start, end }];

    for (const seg of segments) {
      let cursor = seg.start;
      while (cursor + slotMin <= seg.end) {
        const hhmm = minutesToHHMM(cursor);
        const slotStart = clinicDateTime(date, hhmm);
        const slotEnd = new Date(slotStart.getTime() + slotMin * 60_000);
        let available = slotStart.getTime() > now;
        let reason: string | null = available ? null : "PAST";

        if (available) {
          const blocked = partialBlocks.some((b) => {
            const bStart = clinicDateTime(date, String(b.startTime));
            const bEnd = clinicDateTime(date, String(b.endTime));
            return slotStart < bEnd && bStart < slotEnd;
          });
          if (blocked) {
            available = false;
            reason = "TEMPORARILY_UNAVAILABLE";
          }
        }

        if (available) {
          const conflict = booked.some((b) => {
            const bEnd = new Date(
              b.scheduledAt.getTime() + (b.duration || 30) * 60_000
            );
            return b.scheduledAt < slotEnd && bEnd > slotStart;
          });
          if (conflict) {
            available = false;
            reason = "BOOKED";
          }
        }

        slots.push({
          time: hhmm,
          iso: slotStart.toISOString(),
          available,
          reason,
        });
        cursor += slotMin;
      }
    }
  }

  const open = slots.filter((s) => s.available);
  let status = "AVAILABLE";
  if (open.length === 0) {
    status = slots.some((s) => s.reason === "BOOKED") ? "BUSY" : "UNAVAILABLE";
  }

  return {
    doctorId,
    date,
    timezone: "Africa/Mogadishu",
    status,
    reason: null,
    workingHours: windows.map((w) => ({
      start: w.startTime,
      end: w.endTime,
      breakStart: w.breakStart,
      breakEnd: w.breakEnd,
      label: w.label,
      slotMinutes: w.slotMinutes,
    })),
    slots,
    nextAvailable: open[0]?.iso || null,
  };
};
