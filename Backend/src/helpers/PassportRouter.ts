import { NextFunction, Router, Request, Response } from "express";
import passport from "../config/PassportConfig";
import { Role } from "@prisma/client";

const router = Router();

const frontendBase = () => {
  const fromEnv = (process.env.FRONTEND_URL || "").replace(/"/g, "").trim();
  return (
    fromEnv ||
    "https://daryeel-healthtech-gamma.vercel.app"
  ).replace(/\/$/, "");
};

function isAllowedAppRedirect(value: string): boolean {
  try {
    const url = new URL(value);
    const protocol = url.protocol.replace(":", "");
    if (protocol === "daryeelhealth") return true;
    if (protocol === "exp") return true;
    if (protocol === "exps") return true;
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") return true;
    return false;
  } catch {
    return false;
  }
}

function encodeState(payload: Record<string, string>): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeState(raw?: string): Record<string, string> {
  if (!raw) return {};
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ============================================================
// GOOGLE OAUTH
// ============================================================

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  const appRedirect = String(req.query.app_redirect || "").trim();
  const statePayload: Record<string, string> = {};

  if (appRedirect && isAllowedAppRedirect(appRedirect)) {
    statePayload.app_redirect = appRedirect;
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: encodeState(statePayload),
  })(req, res, next);
});

// ============================================================
// GOOGLE CALLBACK
// ============================================================

router.get("/google/callback", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    "google",
    { session: false },
    (
      err: Error | null,
      user?: {
        userId: string;
        email: string;
        picture?: string;
        name: string;
        accessToken: string;
        refreshToken: string;
        role: Role;
      }
    ) => {
      const frontend = frontendBase();
      const state = decodeState(typeof req.query.state === "string" ? req.query.state : undefined);
      const appRedirect = state.app_redirect || "";

      const targetBase =
        appRedirect && isAllowedAppRedirect(appRedirect)
          ? appRedirect
          : `${frontend}/auth/google/callback`;

      if (err || !user) {
        const message = encodeURIComponent(err?.message || "Google sign-in failed");
        const joiner = targetBase.includes("?") ? "&" : "?";
        res.redirect(`${targetBase}${joiner}error=${message}`);
        return;
      }

      const joiner = targetBase.includes("?") ? "&" : "?";
      const redirectUrl =
        `${targetBase}${joiner}` +
        `accessToken=${encodeURIComponent(user.accessToken)}` +
        `&refreshToken=${encodeURIComponent(user.refreshToken)}` +
        `&userId=${encodeURIComponent(user.userId)}` +
        `&name=${encodeURIComponent(user.name)}` +
        `&email=${encodeURIComponent(user.email)}` +
        `&image=${encodeURIComponent(user.picture || "")}` +
        `&role=${encodeURIComponent(user.role)}`;

      res.redirect(redirectUrl);
    }
  )(req, res, next);
});

export default router;
