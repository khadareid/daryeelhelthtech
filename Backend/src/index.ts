// src/index.ts
import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import googleAuth from "./helpers/PassportRouter";
import passport from "./config/PassportConfig";
import email from "./helpers/SendCode";
import UserRoute from "./Routes/UserRouter";
import dailyHealthLogRouter from "./Routes/dailyHealthLog.routes";
import appointmentRouter from "./Routes/AppointmentRouter";
import healthcareRouter from "./Routes/HealthcareRouter";
import messageRouter from "./Routes/MessageRouter";
import adminRouter from "./Routes/AdminRouter";
import newsRouter from "./Routes/NewsRouter";
import professionalApplicationRouter from "./Routes/ProfessionalApplicationRouter";
import connectionRouter from "./Routes/ConnectionRouter";
import professionalsRouter, {
  professionalSelfRouter,
} from "./Routes/ProfessionalsRouter";
import refreshTokenRouter from "./helpers/secure/RefreshTokenRouter";
import { auditMiddleware } from "./helpers/middleware/auditMiddleware";
import {
  createSignedCsrfToken,
  csrfProtection,
  currentOrNewCsrf,
} from "./helpers/middleware/csrf";
import { ensureDefaultFeatureFlags } from "./services/featureFlag.service";
import { backfillMissingHealthIds } from "./services/healthId.service";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";
// done 
const sessionSecret =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  process.env.JWT_SECRET_TOKEN ||
  process.env.CSRF_SECRET ||
  "daryeel-healthtech-session-fallback";

if (!process.env.SESSION_SECRET) {
  if (isProd || process.env.VERCEL) {
    console.error(
      "[Daryeel Healthtech] SESSION_SECRET is missing — using fallback (set SESSION_SECRET in Vercel)"
    );
  } else {
    console.warn(
      "[Daryeel Healthtech] SESSION_SECRET missing — using local fallback"
    );
  }
}

function normalizeOrigin(value: string): string {
  return value.trim().replace(/\/$/, "");
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://daryeel-healthtech.vercel.app",
  "https://daryeel-healthtech-gamma.vercel.app",
  "https://daryeel-saas-healthtech.vercel.app",
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
]
  .filter(Boolean)
  .map((o) => normalizeOrigin(String(o)));

const isPrivateHost = (hostname: string) => {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
};

const isAllowedVercelPreview = (hostname: string) => {
  // Allow this project's Vercel production + preview / alias hosts
  return (
    hostname === "daryeel-healthtech.vercel.app" ||
    hostname === "daryeel-healthtech-gamma.vercel.app" ||
    hostname.endsWith(".daryeel-healthtech.vercel.app") ||
    hostname.endsWith(".daryeel-healthtech-gamma.vercel.app") ||
    /^daryeel-healthtech(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(hostname)
  );
};

const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return true; // same-origin / server / mobile
  try {
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return true;
    const url = new URL(normalized);
    if (isPrivateHost(url.hostname)) return true;
    if (isAllowedVercelPreview(url.hostname)) return true;
    return false;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Never pass Error here — that turns browser OPTIONS preflight into HTTP 500
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn("[CORS] blocked origin:", origin);
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
      "Idempotency-Key",
    ],
    optionsSuccessStatus: 204,
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProd || Boolean(process.env.VERCEL),
      sameSite: isProd || process.env.VERCEL ? "none" : "lax",
      httpOnly: true,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", csrfProtection);
app.use("/api/v1", auditMiddleware);

app.get("/api/v1/csrf", (req, res) => {
  try {
    const csrfToken = currentOrNewCsrf(req, res);
    res.status(200).json({ isSuccess: true, result: { csrfToken } });
  } catch (error: any) {
    console.error("[csrf]", error?.message || error);
    // Still return a usable signed token so the SPA can sign in
    try {
      const csrfToken = createSignedCsrfToken();
      res.status(200).json({ isSuccess: true, result: { csrfToken } });
    } catch {
      res.status(500).json({
        isSuccess: false,
        message: "Could not issue CSRF token",
      });
    }
  }
});

// Routes
app.use("/api/v1/auth", googleAuth);
app.use("/api/v1/auth/email", email);
app.use("/api/v1/refresh", refreshTokenRouter);
app.use("/api/v1/user", UserRoute);
app.use("/api/v1/daily-health-log", dailyHealthLogRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/healthcare", healthcareRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/news", newsRouter);
app.use("/api/v1/professional-applications", professionalApplicationRouter);
app.use("/api/v1/connections", connectionRouter);
app.use("/api/v1/professionals", professionalsRouter);
app.use("/api/v1/professional", professionalSelfRouter);

void ensureDefaultFeatureFlags().catch((err) =>
  console.error("Feature flag seed skipped:", err?.message || err)
);

void backfillMissingHealthIds()
  .then((n) => {
    if (n > 0) console.log(`Backfilled ${n} missing Patient/Health IDs`);
  })
  .catch((err) =>
    console.error("Health ID backfill skipped:", err?.message || err)
  );

app.get("/", (_req, res) => {
  res.send("Daryeel Healthtech API");
});

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "daryeel-healthtech-api" });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[API Error]", err?.message || err);
    const status = err?.status || err?.statusCode || 500;
    if (res.headersSent) return;
    res.status(status).json({
      isSuccess: false,
      message: isProd ? "Internal server error" : err?.message || "Internal server error",
      status,
    });
  }
);

app.all("/{*splat}", (_req, res) => {
  res.status(404).json({
    message: "API Not Found",
    status: 404,
  });
});

// Vercel serverless needs the exported app; listen only for local/dev.
export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`🚀 Server is running on PORT ${PORT}`));
}