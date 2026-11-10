export const HealthcareErrorCodes = {
  HOSPITAL_NOT_FOUND: "HOSPITAL_NOT_FOUND",
  DOCTOR_NOT_FOUND: "DOCTOR_NOT_FOUND",
  SLOT_NOT_AVAILABLE: "SLOT_NOT_AVAILABLE",
  BOOKING_ALREADY_EXISTS: "BOOKING_ALREADY_EXISTS",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  INVALID_INTEGRATION_KEY: "INVALID_INTEGRATION_KEY",
  SAAS_UNAVAILABLE: "SAAS_UNAVAILABLE",
  BOOKING_FAILED: "BOOKING_FAILED",
  APPOINTMENT_NOT_FOUND: "APPOINTMENT_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export type HealthcareErrorCode =
  (typeof HealthcareErrorCodes)[keyof typeof HealthcareErrorCodes];

export class HealthcareError extends Error {
  status: number;
  code: HealthcareErrorCode;

  constructor(
    message: string,
    status = 400,
    code: HealthcareErrorCode = HealthcareErrorCodes.VALIDATION_ERROR
  ) {
    super(message);
    this.name = "HealthcareError";
    this.status = status;
    this.code = code;
  }
}

export function sendHealthcareError(res: any, error: any, fallback: string) {
  if (error instanceof HealthcareError) {
    return res.status(error.status).json({
      success: false,
      isSuccess: false,
      message: error.message,
      code: error.code,
    });
  }

  const status = error?.status || 500;
  const code =
    error?.code ||
    (status === 503
      ? HealthcareErrorCodes.SAAS_UNAVAILABLE
      : HealthcareErrorCodes.BOOKING_FAILED);

  // Prefer a clear integration message over a generic 503 fallback
  const rawMessage = String(error?.message || "");
  const message =
    code === HealthcareErrorCodes.INVALID_INTEGRATION_KEY
      ? "Hospital integration key is invalid. Set matching SAAS_INTEGRATION_KEY / HEALTHTECH_INTEGRATION_KEY on both APIs."
      : status >= 500 &&
          process.env.NODE_ENV === "production" &&
          !/hospital system|integration|reach|timeout|unavailable/i.test(
            rawMessage
          )
        ? fallback
        : rawMessage || fallback;

  return res.status(status >= 500 ? (status === 503 ? 503 : 500) : status).json({
    success: false,
    isSuccess: false,
    message,
    code,
  });
}

export function sendHealthcareSuccess(
  res: any,
  data: unknown,
  message = "OK",
  status = 200,
  extra: Record<string, unknown> = {}
) {
  return res.status(status).json({
    success: true,
    isSuccess: true,
    message,
    data,
    result: data,
    ...extra,
  });
}
