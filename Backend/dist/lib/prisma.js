"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.disconnectPrisma = disconnectPrisma;
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
/**
 * Neon pooler + many parallel queries exhaust Prisma's default pool (limit 5).
 * Ensure pooler-friendly params without requiring every developer to edit .env.
 */
function databaseUrlWithPool() {
    const raw = process.env.DATABASE_URL;
    if (!raw)
        return undefined;
    try {
        const url = new URL(raw);
        const isPooler = url.hostname.includes("-pooler") || url.hostname.includes("pooler");
        if (isPooler && !url.searchParams.has("pgbouncer")) {
            url.searchParams.set("pgbouncer", "true");
        }
        if (!url.searchParams.has("connection_limit")) {
            // Keep modest with Neon pooler; dashboard queries are batched to match.
            url.searchParams.set("connection_limit", isPooler ? "8" : "15");
        }
        if (!url.searchParams.has("pool_timeout")) {
            url.searchParams.set("pool_timeout", "30");
        }
        if (!url.searchParams.has("connect_timeout")) {
            url.searchParams.set("connect_timeout", "20");
        }
        return url.toString();
    }
    catch (_a) {
        return raw;
    }
}
function createPrismaClient() {
    const url = databaseUrlWithPool();
    return new client_1.PrismaClient(Object.assign({ log: process.env.NODE_ENV === "development"
            ? ["warn", "error"]
            : ["error"] }, (url ? { datasources: { db: { url } } } : {})));
}
exports.prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : createPrismaClient();
// Always reuse one client in this process (dev hot-reload + production).
globalForPrisma.prisma = exports.prisma;
function disconnectPrisma() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.prisma.$disconnect();
    });
}
