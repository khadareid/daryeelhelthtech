import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import googleAuth from "./helpers/PassportRouter";
import passport from "./config/PassportConfig";
import email from "./helpers/SendCode";
import refreshTokenRouter from "./helpers/secure/RefreshTokenRouter";
import { auditMiddleware } from "./helpers/middleware/auditMiddleware";
import {
  createSignedCsrfToken,
  csrfProtection,
  currentOrNewCsrf,
} from "./helpers/middleware/csrf";

import authRouter from "./Routes/AuthRouter";
import userRouter from "./Routes/UserRouter";
import medicalProfileRouter from "./Routes/MedicalProfileRouter";
import emergencyContactRouter from "./Routes/EmergencyContactRouter";
import emergencyCardRouter from "./Routes/EmergencyCardRouter";
import familyMemberRouter from "./Routes/FamilyMemberRouter";
import allergyRouter from "./Routes/AllergyRouter";
import chronicConditionRouter from "./Routes/ChronicConditionRouter";
import medicationRouter from "./Routes/MedicationRouter";
import medicalRecordRouter from "./Routes/MedicalRecordRouter";
import medicalDocumentRouter from "./Routes/MedicalDocumentRouter";
import diagnosisRouter from "./Routes/DiagnosisRouter";
import vitalSignRouter from "./Routes/VitalSignRouter";
import labResultRouter from "./Routes/LabResultRouter";
import prescriptionRouter from "./Routes/PrescriptionRouter";
import dailyHealthLogRouter from "./Routes/DailyHealthLogRouter";
import healthDeviceRouter from "./Routes/HealthDeviceRouter";
import publicDoctorRouter, { doctorSelfRouter } from "./Routes/DoctorRouter";
import appointmentRouter from "./Routes/AppointmentRouter";
import consultationRouter from "./Routes/ConsultationRouter";
import doctorReviewRouter from "./Routes/DoctorReviewRouter";
import paymentRouter from "./Routes/PaymentRouter";
import notificationRouter from "./Routes/NotificationRouter";
import consentRouter from "./Routes/ConsentRouter";
import accessRequestRouter from "./Routes/AccessRequestRouter";
import adminRouter from "./Routes/AdminRouter";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";

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
  // "http://localhost:5173",
  // "http://localhost:5174",
  // "http://localhost:5175",
  // "http://localhost:8081",
  // "http://localhost:8082",
  // "http://localhost:3000",
  // "http://localhost:3001",
  "https://daryeelhelthtech.vercel.app",
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

const isAllowedVercelPreview = (hostname: string) =>
  hostname === "daryeel-healthtech.vercel.app" ||
  hostname === "daryeel-healthtech-gamma.vercel.app" ||
  hostname.endsWith(".daryeel-healthtech.vercel.app") ||
  hostname.endsWith(".daryeel-healthtech-gamma.vercel.app") ||
  /^daryeel-healthtech(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(hostname);

const isAllowedOrigin = (origin?: string | null) => {
  if (!origin) return true;
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
      if (isAllowedOrigin(origin)) callback(null, true);
      else {
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

// Auth
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/auth", googleAuth);
app.use("/api/v1/auth/email", email);
app.use("/api/v1/refresh", refreshTokenRouter);

// Core
app.use("/api/v1/users", userRouter);
app.use("/api/v1/user", userRouter); // backward-compatible alias
app.use("/api/v1/medical-profile", medicalProfileRouter);
app.use("/api/v1/emergency-contacts", emergencyContactRouter);
app.use("/api/v1/emergency-card", emergencyCardRouter);
app.use("/api/v1/family-members", familyMemberRouter);
app.use("/api/v1/allergies", allergyRouter);
app.use("/api/v1/chronic-conditions", chronicConditionRouter);
app.use("/api/v1/medications", medicationRouter);
app.use("/api/v1/medical-records", medicalRecordRouter);
app.use("/api/v1/medical-documents", medicalDocumentRouter);
app.use("/api/v1/diagnoses", diagnosisRouter);
app.use("/api/v1/vital-signs", vitalSignRouter);
app.use("/api/v1/lab-results", labResultRouter);
app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/daily-health-logs", dailyHealthLogRouter);
app.use("/api/v1/health-devices", healthDeviceRouter);

// Care delivery
app.use("/api/v1/doctors", publicDoctorRouter);
app.use("/api/v1/doctor", doctorSelfRouter);
app.use("/api/v1/appointments", appointmentRouter);
app.use("/api/v1/consultations", consultationRouter);
app.use("/api/v1/doctor-reviews", doctorReviewRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/consents", consentRouter);
app.use("/api/v1/access-requests", accessRequestRouter);

// Admin
app.use("/api/v1/admin", adminRouter);

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
      message: isProd
        ? "Internal server error"
        : err?.message || "Internal server error",
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

export default app;

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () =>
    console.log(`🚀 Server is running on PORT ${PORT}`)
  );

  const shutdown = async (signal: string) => {
    console.log(`${signal} received — closing server & Prisma…`);
    server.close(async () => {
      try {
        const { disconnectPrisma } = await import("./lib/prisma");
        await disconnectPrisma();
      } catch {
        /* ignore */
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
