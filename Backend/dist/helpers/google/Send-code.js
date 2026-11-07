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
exports.sendCode = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const prisma_1 = require("../../lib/prisma");
const otp_service_1 = require("../../services/otp.service");
const sendCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email || typeof email !== "string") {
            res.status(400).json({ message: "Email is required", isSuccess: false });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = yield prisma_1.prisma.user.findFirst({
            where: {
                email: normalizedEmail,
                isActive: true,
                deletedAt: null,
            },
        });
        if (!user) {
            res.status(404).json({
                message: "User not found or not active",
                isSuccess: false,
            });
            return;
        }
        const { code, expiresIn } = (0, otp_service_1.createOtp)(normalizedEmail, user.userid);
        if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
            console.error("MAIL_USER or MAIL_PASS is missing");
            console.log(`[OTP] ${normalizedEmail} => ${code}`);
            res.status(200).json(Object.assign({ message: "Verification code generated (email not configured)", isSuccess: true, expiresIn }, (process.env.NODE_ENV !== "production" ? { debugCode: code } : {})));
            return;
        }
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        yield transporter.sendMail({
            from: process.env.MAIL_USER,
            to: normalizedEmail,
            subject: "Verify Your Device - Daryeel Health",
            text: `Hello ${user.fullName},\n\nYour verification code is: ${code}\n\nExpires in 10 minutes.`,
            html: `<p>Hello ${user.fullName},</p><p>Your verification code is:</p><h2>${code}</h2><p>Expires in 10 minutes.</p>`,
        });
        res.status(200).json({
            message: "Verification code sent successfully",
            isSuccess: true,
            expiresIn,
        });
    }
    catch (error) {
        console.error("Send verification code error:", error);
        res.status(500).json({ message: "Server error", isSuccess: false });
    }
});
exports.sendCode = sendCode;
