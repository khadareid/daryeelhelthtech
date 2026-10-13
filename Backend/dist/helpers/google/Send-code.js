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
const client_1 = require("@prisma/client");
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = require("crypto");
const prisma = new client_1.PrismaClient();
const sendCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // --------------------------------------------------------
        // Validate email
        // --------------------------------------------------------
        if (!email || typeof email !== 'string') {
            res.status(400).json({
                message: 'Email is required',
                isSuccess: false,
            });
            return;
        }
        const normalizedEmail = email.trim().toLowerCase();
        // --------------------------------------------------------
        // Find active user
        // --------------------------------------------------------
        const user = yield prisma.user.findFirst({
            where: {
                email: normalizedEmail,
                isActive: true,
                isDeleted: false,
            },
        });
        if (!user) {
            res.status(404).json({
                message: 'User not found or not active',
                isSuccess: false,
            });
            return;
        }
        // --------------------------------------------------------
        // Generate 6-digit OTP
        // --------------------------------------------------------
        const code = (0, crypto_1.randomInt)(100000, 1000000).toString();
        // 10 minutes
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        // --------------------------------------------------------
        // Invalidate previous unused email verification codes
        // --------------------------------------------------------
        yield prisma.verificationCode.updateMany({
            where: {
                userId: user.userid,
                purpose: client_1.VerificationPurpose.EMAIL_VERIFICATION,
                isUsed: false,
            },
            data: {
                isUsed: true,
            },
        });
        // --------------------------------------------------------
        // Create new verification code
        // --------------------------------------------------------
        yield prisma.verificationCode.create({
            data: {
                userId: user.userid,
                email: normalizedEmail,
                code,
                purpose: client_1.VerificationPurpose.EMAIL_VERIFICATION,
                expiresAt,
                isUsed: false,
            },
        });
        // --------------------------------------------------------
        // Email transporter
        // --------------------------------------------------------
        const transporter = nodemailer_1.default.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
        // --------------------------------------------------------
        // Verify email configuration
        // --------------------------------------------------------
        if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
            console.error('MAIL_USER or MAIL_PASS is missing');
            res.status(500).json({
                message: 'Email service is not configured',
                isSuccess: false,
            });
            return;
        }
        // --------------------------------------------------------
        // Email template
        // --------------------------------------------------------
        const currentYear = new Date().getFullYear();
        const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >
  <title>Verify Your Device - Daryeel Health</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f8fafc;
    font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;
  "
>
  <div
    style="
      max-width:600px;
      margin:0 auto;
      background-color:#ffffff;
    "
  >

    <!-- Header -->
    <div
      style="
        background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
        padding:40px 30px;
        text-align:center;
        border-radius:12px 12px 0 0;
      "
    >
      <h1
        style="
          color:#ffffff;
          font-size:32px;
          margin:0;
          font-weight:700;
        "
      >
        💪 DARYEEL HEALTH
      </h1>

      <p
        style="
          color:#e2e8f0;
          font-size:14px;
          margin:5px 0 0;
        "
      >
        Your Fitness Journey Starts Here
      </p>

      <h2
        style="
          color:#ffffff;
          font-size:24px;
          margin:20px 0 0;
        "
      >
        🔐 Device Verification Required
      </h2>
    </div>

    <!-- Main -->
    <div style="padding:40px 30px;">

      <h3
        style="
          color:#1a202c;
          font-size:20px;
          margin:0 0 15px;
        "
      >
        Hello ${user.fullName} 👋
      </h3>

      <p
        style="
          color:#4a5568;
          font-size:16px;
          line-height:1.6;
        "
      >
        We received a request to verify your device
        for your <strong>Daryeel Health</strong> account:
      </p>

      <p
        style="
          color:#667eea;
          font-weight:600;
        "
      >
        ${normalizedEmail}
      </p>

      <!-- Instruction -->
      <div
        style="
          background-color:#f7fafc;
          border-left:4px solid #667eea;
          padding:20px;
          margin:25px 0;
          border-radius:0 8px 8px 0;
        "
      >
        <p
          style="
            color:#2d3748;
            font-size:16px;
            line-height:1.6;
            margin:0;
          "
        >
          <strong>📱 Next Step:</strong>
          Enter the verification code below in your app
          to complete the security check.
        </p>
      </div>

      <!-- OTP -->
      <div
        style="
          text-align:center;
          margin:35px 0;
        "
      >
        <p
          style="
            color:#4a5568;
            font-size:14px;
            margin:0 0 15px;
            text-transform:uppercase;
            letter-spacing:1px;
            font-weight:600;
          "
        >
          Your Verification Code
        </p>

        <div
          style="
            background:linear-gradient(
              135deg,
              #f093fb 0%,
              #f5576c 100%
            );
            padding:3px;
            border-radius:16px;
            display:inline-block;
          "
        >
          <div
            style="
              background-color:#ffffff;
              border-radius:13px;
              padding:25px 40px;
            "
          >
            <span
              style="
                font-size:36px;
                font-weight:800;
                color:#2d3748;
                letter-spacing:8px;
                font-family:Courier New,monospace;
              "
            >
              ${code}
            </span>
          </div>
        </div>

        <p
          style="
            color:#718096;
            font-size:12px;
            margin:15px 0 0;
          "
        >
          This code expires in 10 minutes.
        </p>
      </div>

      <!-- Security -->
      <div
        style="
          background:#fff7ed;
          border-radius:12px;
          padding:25px;
          margin:30px 0;
        "
      >
        <h4
          style="
            color:#744210;
            margin:0 0 8px;
          "
        >
          ⏰ Time Sensitive
        </h4>

        <p
          style="
            color:#975a16;
            font-size:14px;
            line-height:1.5;
          "
        >
          This verification code will expire in
          <strong>10 minutes</strong>.
        </p>

        <h4
          style="
            color:#744210;
            margin:20px 0 8px;
          "
        >
          🛡️ Keep It Private
        </h4>

        <p
          style="
            color:#975a16;
            font-size:14px;
            line-height:1.5;
          "
        >
          Never share this code with anyone.
          DaryeelHealth will never ask for your
          verification code.
        </p>
      </div>

      <!-- Warning -->
      <div
        style="
          background:#fed7d7;
          border:1px solid #feb2b2;
          border-radius:8px;
          padding:20px;
        "
      >
        <p
          style="
            color:#742a2a;
            font-size:14px;
            line-height:1.5;
            margin:0;
          "
        >
          <strong>🚨 Didn't request this?</strong>
          Ignore this email or contact
          support@daryeelhelthtech.com.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div
      style="
        background-color:#2d3748;
        padding:30px;
        text-align:center;
        border-radius:0 0 12px 12px;
      "
    >
      <h3
        style="
          color:#ffffff;
          margin:0 0 5px;
        "
      >
        💪 DARYEEL HEALTH TECH
      </h3>

      <p
        style="
          color:#a0aec0;
          font-size:12px;
        "
      >
        Transform Your Body, Transform Your Life
      </p>

      <p
        style="
          color:#a0aec0;
          font-size:12px;
          margin-top:20px;
        "
      >
        📧 support@daryeelhelthtech.com
        |
        📞 (252) 63 8313219
      </p>

      <p
        style="
          color:#718096;
          font-size:11px;
          margin-top:20px;
        "
      >
        © ${currentYear} Daryeel Health Tech.
        All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
`;
        // --------------------------------------------------------
        // Send email
        // --------------------------------------------------------
        yield transporter.sendMail({
            from: process.env.MAIL_USER,
            to: normalizedEmail,
            subject: 'Verify Your Device - Daryeel Health',
            text: `
Hello ${user.fullName},

Your Daryeel Health verification code is:

${code}

This code will expire in 10 minutes.

Never share this code with anyone.
`,
            html: htmlTemplate,
        });
        // --------------------------------------------------------
        // Success
        // --------------------------------------------------------
        res.status(200).json({
            message: 'Verification code sent successfully',
            isSuccess: true,
            expiresIn: 600,
        });
    }
    catch (error) {
        console.error('Send verification code error:', error);
        res.status(500).json({
            message: 'Server error',
            isSuccess: false,
        });
    }
});
exports.sendCode = sendCode;
