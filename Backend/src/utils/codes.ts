import { prisma } from "../lib/prisma";

export const randomCode = (prefix: string, length = 8) => {
  const body = Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .toUpperCase();
  return `${prefix}-${body}`;
};

export const generateHealthId = () => {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `DYL-${n}`;
};

export const generateUniqueHealthId = async () => {
  for (let i = 0; i < 12; i++) {
    const healthId = generateHealthId();
    const exists = await prisma.user.findUnique({ where: { healthId } });
    if (!exists) return healthId;
  }
  return `DYL-${Date.now().toString().slice(-6)}`;
};

export const generateAppointmentCode = () => randomCode("APT");
export const generateConsultationCode = () => randomCode("CON");
export const generatePrescriptionNumber = () => randomCode("RX");
export const generatePaymentReference = () => randomCode("PAY");
export const generateCardNumber = () => randomCode("EMG", 10);
