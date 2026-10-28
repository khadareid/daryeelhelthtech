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
// src/index.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_session_1 = __importDefault(require("express-session"));
const dotenv_1 = __importDefault(require("dotenv"));
const PassportRouter_1 = __importDefault(require("./helpers/PassportRouter"));
const PassportConfig_1 = __importDefault(require("./config/PassportConfig"));
const SendCode_1 = __importDefault(require("./helpers/SendCode"));
const UserRouter_1 = __importDefault(require("./Routes/UserRouter"));
const dailyHealthLog_routes_1 = __importDefault(require("./Routes/dailyHealthLog.routes"));
const AppointmentRouter_1 = __importDefault(require("./Routes/AppointmentRouter"));
const MessageRouter_1 = __importDefault(require("./Routes/MessageRouter"));
const AdminRouter_1 = __importDefault(require("./Routes/AdminRouter"));
const NewsRouter_1 = __importDefault(require("./Routes/NewsRouter"));
const ProfessionalApplicationRouter_1 = __importDefault(require("./Routes/ProfessionalApplicationRouter"));
const ConnectionRouter_1 = __importDefault(require("./Routes/ConnectionRouter"));
const ProfessionalsRouter_1 = __importStar(require("./Routes/ProfessionalsRouter"));
const RefreshTokenRouter_1 = __importDefault(require("./helpers/secure/RefreshTokenRouter"));
const auditMiddleware_1 = require("./helpers/middleware/auditMiddleware");
const csrf_1 = require("./helpers/middleware/csrf");
const featureFlag_service_1 = require("./services/featureFlag.service");
const healthId_service_1 = require("./services/healthId.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
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
const isLocalOrigin = (origin) => {
    try {
        const url = new URL(origin);
        return isPrivateHost(url.hostname);
    }
    catch (_a) {
        return false;
    }
};
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isLocalOrigin(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
}));
app.use(express_1.default.json({ limit: "100mb" }));
app.use(express_1.default.urlencoded({ limit: "100mb", extended: true }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(PassportConfig_1.default.initialize());
app.use(PassportConfig_1.default.session());
app.use("/api/v1", csrf_1.csrfProtection);
app.use("/api/v1", auditMiddleware_1.auditMiddleware);
app.get("/api/v1/csrf", (req, res) => {
    const csrfToken = (0, csrf_1.currentOrNewCsrf)(req, res);
    res.json({ isSuccess: true, result: { csrfToken } });
});
// Routes
app.use("/api/v1/auth", PassportRouter_1.default);
app.use("/api/v1/auth/email", SendCode_1.default);
app.use("/api/v1/refresh", RefreshTokenRouter_1.default);
app.use("/api/v1/user", UserRouter_1.default);
app.use("/api/v1/daily-health-log", dailyHealthLog_routes_1.default);
app.use("/api/v1/appointments", AppointmentRouter_1.default);
app.use("/api/v1/messages", MessageRouter_1.default);
app.use("/api/v1/admin", AdminRouter_1.default);
app.use("/api/v1/news", NewsRouter_1.default);
app.use("/api/v1/professional-applications", ProfessionalApplicationRouter_1.default);
app.use("/api/v1/connections", ConnectionRouter_1.default);
app.use("/api/v1/professionals", ProfessionalsRouter_1.default);
app.use("/api/v1/professional", ProfessionalsRouter_1.professionalSelfRouter);
void (0, featureFlag_service_1.ensureDefaultFeatureFlags)().catch((err) => console.error("Feature flag seed skipped:", (err === null || err === void 0 ? void 0 : err.message) || err));
void (0, healthId_service_1.backfillMissingHealthIds)()
    .then((n) => {
    if (n > 0)
        console.log(`Backfilled ${n} missing Patient/Health IDs`);
})
    .catch((err) => console.error("Health ID backfill skipped:", (err === null || err === void 0 ? void 0 : err.message) || err));
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
