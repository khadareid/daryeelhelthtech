import { BloodType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { generateCardNumber } from "../utils/codes";
import { HttpError } from "../utils/ownership";
import { optionalString } from "../utils/validation";

export const getEmergencyCard = async (userId: string) => {
  return prisma.emergencyCard.findUnique({ where: { userId } });
};

export const upsertEmergencyCard = async (
  userId: string,
  body: Record<string, unknown>
) => {
  const existing = await prisma.emergencyCard.findUnique({ where: { userId } });

  const data: Prisma.EmergencyCardUpdateInput = {
    lastUpdatedAt: new Date(),
  };

  if (body.bloodType !== undefined) {
    const bt = String(body.bloodType) as BloodType;
    if (!Object.values(BloodType).includes(bt)) {
      throw new HttpError(400, "Invalid bloodType");
    }
    data.bloodType = bt;
  }
  if (body.emergencyContactName !== undefined) {
    data.emergencyContactName =
      optionalString(body.emergencyContactName) ?? null;
  }
  if (body.emergencyContactPhone !== undefined) {
    data.emergencyContactPhone =
      optionalString(body.emergencyContactPhone) ?? null;
  }
  if (body.allergiesSummary !== undefined) {
    data.allergiesSummary = optionalString(body.allergiesSummary) ?? null;
  }
  if (body.conditionsSummary !== undefined) {
    data.conditionsSummary = optionalString(body.conditionsSummary) ?? null;
  }
  if (body.medicationsSummary !== undefined) {
    data.medicationsSummary = optionalString(body.medicationsSummary) ?? null;
  }
  if (body.doctorNotes !== undefined) {
    data.doctorNotes = optionalString(body.doctorNotes) ?? null;
  }
  if (body.qrCode !== undefined) {
    data.qrCode = optionalString(body.qrCode) ?? null;
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  if (existing) {
    return prisma.emergencyCard.update({
      where: { userId },
      data,
    });
  }

  return prisma.emergencyCard.create({
    data: {
      userId,
      cardNumber:
        optionalString(body.cardNumber) || generateCardNumber(),
      bloodType: (data.bloodType as BloodType) || BloodType.UNKNOWN,
      emergencyContactName:
        (data.emergencyContactName as string) ?? null,
      emergencyContactPhone:
        (data.emergencyContactPhone as string) ?? null,
      allergiesSummary: (data.allergiesSummary as string) ?? null,
      conditionsSummary: (data.conditionsSummary as string) ?? null,
      medicationsSummary: (data.medicationsSummary as string) ?? null,
      doctorNotes: (data.doctorNotes as string) ?? null,
      qrCode: (data.qrCode as string) ?? null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    },
  });
};
