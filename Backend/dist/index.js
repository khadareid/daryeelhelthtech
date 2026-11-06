"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const PassportRouter_1 = __importDefault(require("./helpers/PassportRouter"));
const PassportConfig_1 = __importDefault(require("./config/PassportConfig"));
const SendCode_1 = __importDefault(require("./helpers/SendCode"));
const RefreshTokenRouter_1 = __importDefault(require("./helpers/secure/RefreshTokenRouter"));
const auditMiddleware_1 = require("./helpers/middleware/auditMiddleware");
const csrf_1 = require("./helpers/middleware/csrf");
const AuthRouter_1 = __importDefault(require("./Routes/AuthRouter"));
const UserRouter_1 = __importDefault(require("./Routes/UserRouter"));
const MedicalProfileRouter_1 = __importDefault(require("./Routes/MedicalProfileRouter"));
const EmergencyContactRouter_1 = __importDefault(require("./Routes/EmergencyContactRouter"));
const EmergencyCardRouter_1 = __importDefault(require("./Routes/EmergencyCardRouter"));
const FamilyMemberRouter_1 = __importDefault(require("./Routes/FamilyMemberRouter"));
const AllergyRouter_1 = __importDefault(require("./Routes/AllergyRouter"));
const ChronicConditionRouter_1 = __importDefault(require("./Routes/ChronicConditionRouter"));
const MedicationRouter_1 = __importDefault(require("./Routes/MedicationRouter"));
const MedicalRecordRouter_1 = __importDefault(require("./Routes/MedicalRecordRouter"));
const MedicalDocumentRouter_1 = __importDefault(require("./Routes/MedicalDocumentRouter"));
const DiagnosisRouter_1 = __importDefault(require("./Routes/DiagnosisRouter"));
const VitalSignRouter_1 = __importDefault(require("./Routes/VitalSignRouter"));
const LabResultRouter_1 = __importDefault(require("./Routes/LabResultRouter"));
const PrescriptionRouter_1 = __importDefault(require("./Routes/PrescriptionRouter"));
const DailyHealthLogRouter_1 = __importDefault(require("./Routes/DailyHealthLogRouter"));
const HealthDeviceRouter_1 = __importDefault(require("./Routes/HealthDeviceRouter"));
const DoctorRouter_1 = __importStar(require("./Routes/DoctorRouter"));
const AppointmentRouter_1 = __importDefault(require("./Routes/AppointmentRouter"));
const ConsultationRouter_1 = __importDefault(require("./Routes/ConsultationRouter"));
const DoctorReviewRouter_1 = __importDefault(require("./Routes/DoctorReviewRouter"));
const PaymentRouter_1 = __importDefault(require("./Routes/PaymentRouter"));
const NotificationRouter_1 = __importDefault(require("./Routes/NotificationRouter"));
const ConsentRouter_1 = __importDefault(require("./Routes/ConsentRouter"));
const AccessRequestRouter_1 = __importDefault(require("./Routes/AccessRequestRouter"));
const AdminRouter_1 = __importDefault(require("./Routes/AdminRouter"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET ||
    process.env.JWT_SECRET ||
    process.env.JWT_SECRET_TOKEN ||
    process.env.CSRF_SECRET ||
    "daryeel-healthtech-session-fallback";
if (!process.env.SESSION_SECRET) {
    if (isProd || process.env.VERCEL) {
        console.error("[Daryeel Healthtech] SESSION_SECRET is missing — using fallback (set SESSION_SECRET in Vercel)");
    }
    else {
        console.warn("[Daryeel Healthtech] SESSION_SECRET missing — using local fallback");
    }
}
function normalizeOrigin(value) {
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
const isPrivateHost = (hostname) => {
    if (hostname === "localhost" || hostname === "127.0.0.1")
        return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname))
        return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname))
        return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname))
        return true;
    return false;
};
const isAllowedVercelPreview = (hostname) => hostname === "daryeel-healthtech.vercel.app" ||
    hostname === "daryeel-healthtech-gamma.vercel.app" ||
    hostname.endsWith(".daryeel-healthtech.vercel.app") ||
    hostname.endsWith(".daryeel-healthtech-gamma.vercel.app") ||
    /^daryeel-healthtech(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(hostname);
const isAllowedOrigin = (origin) => {
    if (!origin)
        return true;
    try {
        const normalized = normalizeOrigin(origin);
        if (allowedOrigins.includes(normalized))
            return true;
        const url = new URL(normalized);
        if (isPrivateHost(url.hostname))
            return true;
        if (isAllowedVercelPreview(url.hostname))
            return true;
        return false;
    }
    catch (_a) {
        return false;
    }
};
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin))
            callback(null, true);
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
}));
app.use(express_1.default.json({ limit: "100mb" }));
app.use(express_1.default.urlencoded({ limit: "100mb", extended: true }));
app.use((0, express_session_1.default)({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProd || Boolean(process.env.VERCEL),
        sameSite: isProd || process.env.VERCEL ? "none" : "lax",
        httpOnly: true,
    },
}));
app.use(PassportConfig_1.default.initialize());
app.use(PassportConfig_1.default.session());
app.use("/api/v1", csrf_1.csrfProtection);
app.use("/api/v1", auditMiddleware_1.auditMiddleware);
app.get("/api/v1/csrf", (req, res) => {
    try {
        const csrfToken = (0, csrf_1.currentOrNewCsrf)(req, res);
        res.status(200).json({ isSuccess: true, result: { csrfToken } });
    }
    catch (error) {
        console.error("[csrf]", (error === null || error === void 0 ? void 0 : error.message) || error);
        try {
            const csrfToken = (0, csrf_1.createSignedCsrfToken)();
            res.status(200).json({ isSuccess: true, result: { csrfToken } });
        }
        catch (_a) {
            res.status(500).json({
                isSuccess: false,
                message: "Could not issue CSRF token",
            });
        }
    }
});
// Auth
app.use("/api/v1/auth", AuthRouter_1.default);
app.use("/api/v1/auth", PassportRouter_1.default);
app.use("/api/v1/auth/email", SendCode_1.default);
app.use("/api/v1/refresh", RefreshTokenRouter_1.default);
// Core
app.use("/api/v1/users", UserRouter_1.default);
app.use("/api/v1/user", UserRouter_1.default); // backward-compatible alias
app.use("/api/v1/medical-profile", MedicalProfileRouter_1.default);
app.use("/api/v1/emergency-contacts", EmergencyContactRouter_1.default);
app.use("/api/v1/emergency-card", EmergencyCardRouter_1.default);
app.use("/api/v1/family-members", FamilyMemberRouter_1.default);
app.use("/api/v1/allergies", AllergyRouter_1.default);
app.use("/api/v1/chronic-conditions", ChronicConditionRouter_1.default);
app.use("/api/v1/medications", MedicationRouter_1.default);
app.use("/api/v1/medical-records", MedicalRecordRouter_1.default);
app.use("/api/v1/medical-documents", MedicalDocumentRouter_1.default);
app.use("/api/v1/diagnoses", DiagnosisRouter_1.default);
app.use("/api/v1/vital-signs", VitalSignRouter_1.default);
app.use("/api/v1/lab-results", LabResultRouter_1.default);
app.use("/api/v1/prescriptions", PrescriptionRouter_1.default);
app.use("/api/v1/daily-health-logs", DailyHealthLogRouter_1.default);
app.use("/api/v1/health-devices", HealthDeviceRouter_1.default);
// Care delivery
app.use("/api/v1/doctors", DoctorRouter_1.default);
app.use("/api/v1/doctor", DoctorRouter_1.doctorSelfRouter);
app.use("/api/v1/appointments", AppointmentRouter_1.default);
app.use("/api/v1/consultations", ConsultationRouter_1.default);
app.use("/api/v1/doctor-reviews", DoctorReviewRouter_1.default);
app.use("/api/v1/payments", PaymentRouter_1.default);
app.use("/api/v1/notifications", NotificationRouter_1.default);
app.use("/api/v1/consents", ConsentRouter_1.default);
app.use("/api/v1/access-requests", AccessRequestRouter_1.default);
// Admin
app.use("/api/v1/admin", AdminRouter_1.default);
app.get("/", (_req, res) => {
    res.send("Daryeel Healthtech API");
});
app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "daryeel-healthtech-api" });
});
app.use((err, _req, res, _next) => {
    console.error("[API Error]", (err === null || err === void 0 ? void 0 : err.message) || err);
    const status = (err === null || err === void 0 ? void 0 : err.status) || (err === null || err === void 0 ? void 0 : err.statusCode) || 500;
    if (res.headersSent)
        return;
    res.status(status).json({
        isSuccess: false,
        message: isProd
            ? "Internal server error"
            : (err === null || err === void 0 ? void 0 : err.message) || "Internal server error",
        status,
    });
});
app.all("/{*splat}", (_req, res) => {
    res.status(404).json({
        message: "API Not Found",
        status: 404,
    });
});
exports.default = app;
if (!process.env.VERCEL) {
    app.listen(PORT, () => console.log(`🚀 Server is running on PORT ${PORT}`));
}
