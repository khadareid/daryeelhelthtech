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
import { csrfProtection, currentOrNewCsrf } from "./helpers/middleware/csrf";
import { ensureDefaultFeatureFlags } from "./services/featureFlag.service";
import { backfillMissingHealthIds } from "./services/healthId.service";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing from .env file");
}

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
 "http://localhost:8081",
 "http://localhost:8082",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://daryeel-healthtech.vercel.app"
];

const isPrivateHost = (hostname: string) => {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  return false;
};

const isLocalOrigin = (origin: string) => {
  try {
    const url = new URL(origin);
    return isPrivateHost(url.hostname);
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  })
);

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/v1", csrfProtection);
app.use("/api/v1", auditMiddleware);

app.get("/api/v1/csrf", (req, res) => {
  const csrfToken = currentOrNewCsrf(req, res);
  res.json({ isSuccess: true, result: { csrfToken } });
});

// Routes
app.use("/api/v1/auth", googleAuth);
app.use("/api/v1/auth/email", email);
app.use("/api/v1/refresh", refreshTokenRouter);
app.use("/api/v1/user", UserRoute);
app.use("/api/v1/daily-health-log", dailyHealthLogRouter);
app.use("/api/v1/appointments", appointmentRouter);
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

app.get("/", (req, res) => {
  res.send("Hello World");
});

 
app.all("/{*splat}", (req, res) => {
  res.status(404).json({
    message: "API Not Found",
    status: 404,
  });
});

app.listen(PORT, () => console.log(`🚀 Server is running on PORT ${PORT}`));