import { RequestHandler, Response } from "express";
import { findPatientByHealthId } from "../services/healthcare/hospitalPatientRequest.service";

function httpError(res: Response, error: any, fallback: string) {
  const status = error?.status || 500;
  console.error(fallback, error?.message || error);
  res.status(status).json({
    isSuccess: false,
    message:
      process.env.NODE_ENV === "production" && status >= 500
        ? fallback
        : error?.message || fallback,
  });
}

/** GET /integrations/patients/by-health-id?healthId= — SaaS verify only; never creates users */
export const lookupPatientByHealthId: RequestHandler = async (req, res) => {
  try {
    const healthId = String(req.query.healthId || req.query.q || "").trim();
    const outcome = await findPatientByHealthId(healthId);
    const patient = outcome.patient;
    const result = outcome.result;

    // Canonical contract for SaaS:
    // isSuccess + result.healthId  (and patient summary for convenience)
    res.status(200).json({
      isSuccess: true,
      found: outcome.found,
      message: outcome.found ? "OK" : outcome.message,
      patient,
      result: result ?? patient,
      data: {
        found: outcome.found,
        patient,
        result,
      },
    });
  } catch (error) {
    httpError(res, error, "Failed to look up patient by Health ID");
  }
};
