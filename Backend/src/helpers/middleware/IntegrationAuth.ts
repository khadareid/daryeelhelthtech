import { NextFunction, Request, RequestHandler, Response } from "express";

/** Must match SaaS HEALTHTECH_INTEGRATION_KEY / SAAS_INTEGRATION_KEY */
const DEFAULT_INTEGRATION_KEY = "daryeel-healthtech-saas-shared-2026";

function envIntegrationKey() {
  const raw = (
    process.env.SAAS_INTEGRATION_KEY ||
    process.env.HEALTHTECH_INTEGRATION_KEY ||
    ""
  ).trim();
  if (
    !raw ||
    raw === "replace-with-shared-integration-key" ||
    raw === "replace-me"
  ) {
    return DEFAULT_INTEGRATION_KEY;
  }
  return raw;
}

/**
 * Authenticate SaaS → Healthtech server calls via:
 *   Authorization: Bearer <key>  or  X-Integration-Key: <key>
 */
export const requireIntegrationKey: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const header =
    req.header("x-integration-key") ||
    (req.header("authorization")?.startsWith("Bearer ")
      ? req.header("authorization")!.slice(7)
      : "");

  if (!header) {
    res.status(401).json({
      isSuccess: false,
      message: "Integration API key required",
    });
    return;
  }

  const expected = envIntegrationKey();
  if (header.trim() !== expected) {
    res.status(401).json({
      isSuccess: false,
      message: "Invalid integration API key",
    });
    return;
  }

  next();
};
