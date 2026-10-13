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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../src/lib/prisma");
const featureFlag_service_1 = require("../src/services/featureFlag.service");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Seeding Daryeel Health…");
        yield (0, featureFlag_service_1.ensureDefaultFeatureFlags)();
        const passwordHash = yield bcryptjs_1.default.hash("Daryeel@123", 10);
        const admin = yield prisma_1.prisma.user.upsert({
            where: { email: "admin@daryeel.so" },
            update: {
                role: client_1.Role.SUPER_ADMIN,
                isActive: true,
                isSuspended: false,
                emailVerified: true,
                passwordHash,
            },
            create: {
                email: "admin@daryeel.so",
                fullName: "Daryeel Super Admin",
                role: client_1.Role.SUPER_ADMIN,
                passwordHash,
                emailVerified: true,
                isActive: true,
            },
        });
        const patient = yield prisma_1.prisma.user.upsert({
            where: { email: "patient@daryeel.so" },
            update: { role: client_1.Role.PATIENT, passwordHash, emailVerified: true },
            create: {
                email: "patient@daryeel.so",
                fullName: "Fadumo Patient",
                role: client_1.Role.PATIENT,
                passwordHash,
                emailVerified: true,
                phone: "+252634000101",
            },
        });
        const doctorUser = yield prisma_1.prisma.user.upsert({
            where: { email: "doctor@daryeel.so" },
            update: { role: client_1.Role.DOCTOR, passwordHash, emailVerified: true },
            create: {
                email: "doctor@daryeel.so",
                fullName: "Dr. Ayaan Warsame",
                role: client_1.Role.DOCTOR,
                passwordHash,
                emailVerified: true,
                phone: "+252634000102",
            },
        });
        yield prisma_1.prisma.professionalProfile.upsert({
            where: { userId: doctorUser.userid },
            update: {
                isVerified: true,
                isActive: true,
                isPubliclyVisible: true,
                specialization: "Cardiologist",
                yearsOfExperience: 12,
                publicBio: "Heart specialist focused on clear, calm care for families across Somaliland.",
            },
            create: {
                userId: doctorUser.userid,
                professionalType: client_1.Role.DOCTOR,
                specialization: "Cardiologist",
                yearsOfExperience: 12,
                isVerified: true,
                isActive: true,
                isPubliclyVisible: true,
                consultationFee: 25,
                publicBio: "Heart specialist focused on clear, calm care for families across Somaliland.",
            },
        });
        yield prisma_1.prisma.userProfile.upsert({
            where: { userId: patient.userid },
            update: { city: "Hargeisa", country: "Somaliland", bloodType: "O_POSITIVE" },
            create: {
                userId: patient.userid,
                city: "Hargeisa",
                country: "Somaliland",
                bloodType: "O_POSITIVE",
                healthId: "DYL-PAT-001",
            },
        });
        const newsSeed = [
            {
                title: "Stay hydrated during hot days in Hargeisa",
                content: "Drink water regularly, especially outdoors. Aim for clear urine as a simple hydration check. This is general advice — not a personal diagnosis.",
                category: client_1.NewsCategory.PUBLIC_HEALTH,
                isOfficial: true,
            },
            {
                title: "When to book a blood-pressure check",
                content: "Adults with a family history of heart disease should check blood pressure at least yearly. Bring a list of medicines to your visit.",
                category: client_1.NewsCategory.HEALTH_NEWS,
                isOfficial: true,
            },
            {
                title: "Child fever: home care basics",
                content: "Keep the child cool, offer fluids, and seek care if fever lasts more than three days, breathing is hard, or the child is unusually sleepy.",
                category: client_1.NewsCategory.COMMUNITY_HEALTH,
                isOfficial: false,
            },
            {
                title: "Daryeel clinics: evening appointment slots",
                content: "Selected facilities now offer evening visits. Book from Doctors in the app or website after you sign in.",
                category: client_1.NewsCategory.HOSPITAL_UPDATES,
                isOfficial: true,
            },
            {
                title: "Verified clinicians on Daryeel",
                content: "Clinicians with a Verified badge completed Super Admin review of their professional application. Always confirm identity at the facility.",
                category: client_1.NewsCategory.PROFESSIONAL_NEWS,
                isOfficial: true,
            },
        ];
        for (const item of newsSeed) {
            const exists = yield prisma_1.prisma.newsPost.findFirst({
                where: { title: item.title, authorId: admin.userid },
            });
            if (exists)
                continue;
            yield prisma_1.prisma.newsPost.create({
                data: {
                    authorId: admin.userid,
                    title: item.title,
                    content: item.content,
                    category: item.category,
                    status: client_1.NewsPostStatus.PUBLISHED,
                    visibility: client_1.NewsVisibility.PUBLIC,
                    isOfficial: item.isOfficial,
                    publishedAt: new Date(),
                },
            });
        }
        // Minimal today health log for demo patient (real DB row, not UI fake)
        const today = new Date();
        const dateOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        yield prisma_1.prisma.dailyHealthLog.upsert({
            where: {
                userId_date: { userId: patient.userid, date: dateOnly },
            },
            update: {
                steps: 4200,
                waterIntakeMl: 1200,
                sleepHours: 7,
                mood: "GOOD",
                source: "MANUAL",
            },
            create: {
                userId: patient.userid,
                date: dateOnly,
                steps: 4200,
                waterIntakeMl: 1200,
                sleepHours: 7,
                mood: "GOOD",
                source: "MANUAL",
            },
        });
        console.log("Seed complete.");
        console.log("  Super Admin: admin@daryeel.so / Daryeel@123");
        console.log("  Patient:     patient@daryeel.so / Daryeel@123");
        console.log("  Doctor:      doctor@daryeel.so / Daryeel@123");
        console.log(`  Admin id: ${admin.userid}`);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.prisma.$disconnect();
}));
