import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  useSendEmailCodeMutation,
  useVerifyEmailCodeMutation,
} from "@/Redex/service/auth/authApi";
import { setUser } from "@/Redex/service/auth/Userinfo";

type EmailStep = "email-input" | "otp-verification" | "success";

interface EmailVerificationProps {
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  onBack: () => void;
}

interface Tenant {
  name: string;
  address: string;
  phone: string;
  logo: string;
  email: string;
}

interface User {
  userId: string;
  name: string;
  email: string;
  image: string;
  refreshToken: string;
  accessToken: string;
  role: string; 
  company: Tenant;
}

interface VerifyEmailResponse {
  message: string;
  user: User;
}

export default function EmailVerification({
  onError,
  onSuccess,
  onBack,
}: EmailVerificationProps) {
  const [currentStep, setCurrentStep] = useState<EmailStep>("email-input");
  const [email, setEmail] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // Individual refs for each input - this is more reliable
  const input0 = useRef<HTMLInputElement>(null);
  const input1 = useRef<HTMLInputElement>(null);
  const input2 = useRef<HTMLInputElement>(null);
  const input3 = useRef<HTMLInputElement>(null);
  const input4 = useRef<HTMLInputElement>(null);
  const input5 = useRef<HTMLInputElement>(null);

  const inputRefs = [input0, input1, input2, input3, input4, input5];

  const router = useNavigate();
  const dispatch = useDispatch();

  const [sendEmailCode, { isLoading: isSendingCode }] =
    useSendEmailCodeMutation();
  const [verifyEmailCode, { isLoading: isVerifyingCode }] =
    useVerifyEmailCodeMutation();

  // Focus first input when OTP step loads
  useEffect(() => {
    if (currentStep === "otp-verification") {
      setTimeout(() => {
        input0.current?.focus();
      }, 100);
    }
  }, [currentStep]);

  // Auto verify when all digits are entered
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 6 && !isVerifyingCode) {
      setTimeout(() => {
        handleOtpVerification(code);
      }, 300);
    }
  }, [otp]);

  const handleEmailSubmit = async () => {
    if (!email || !email.includes("@")) {
      onError("Please enter a valid email address");
      return;
    }
    onError("");
    try {
      const result = await sendEmailCode({ email }).unwrap();
      setCurrentStep("otp-verification");
      onSuccess(result.message || `Verification code sent to ${email}`);
      setOtpTimer(300);
      setOtp(["", "", "", "", "", ""]);
      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to send verification code";
      onError(errorMessage);
    }
  };

  // KEY FUNCTION: Handle digit input and auto-focus next
  const handleDigitChange = (index: number, value: string) => {
    // Extract only the last numeric digit
    const digit = value.replace(/\D/g, "").slice(-1);

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // IMPORTANT: Move focus to next input if a digit was entered
    // Using setTimeout ensures state updates before focus change
    if (digit !== "" && index < 5) {
      setTimeout(() => {
        inputRefs[index + 1].current?.focus();
      }, 0);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace - clear current and go to previous input
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // If current input is empty, go to previous
        setTimeout(() => {
          inputRefs[index - 1].current?.focus();
        }, 0);
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }

    // Arrow Left - go to previous input
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs[index - 1].current?.focus();
    }

    // Arrow Right - go to next input
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs[index + 1].current?.focus();
    }

    // Enter - verify if complete
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 6) {
        handleOtpVerification(code);
      }
    }
  };

  // Handle paste - fill all inputs from pasted code
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const digits = pastedText.replace(/\D/g, "").slice(0, 6).split("");

    if (digits.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      digits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);

      // Focus the next empty input or the last one
      const focusIndex = Math.min(digits.length, 5);
      setTimeout(() => {
        inputRefs[focusIndex].current?.focus();
      }, 0);
    }
  };

  const handleOtpVerification = async (otpToVerify?: string) => {
    const currentOtp = otpToVerify || otp.join("");
    if (!currentOtp || currentOtp.length !== 6) {
      onError("Please enter a valid 6-digit OTP");
      return;
    }
    if (otpTimer <= 0) {
      onError("OTP has expired. Please request a new one.");
      return;
    }
    onError("");
    try {
      //@ts-ignore
      const result: VerifyEmailResponse = await verifyEmailCode({
        email,
        code: currentOtp,
      }).unwrap();

      const userInfo = {
        userId: result.user.userId,
        name: result.user.name,
        email: result.user.email,
        image: result.user.image,
        refreshToken: result.user.refreshToken,
        accessToken: result.user.accessToken,
        role: result.user.role, 
        company: {
          name: result.user.company.name,
          address: result.user.company.address,
          phone: result.user.company.phone,
          logo: result.user.company.logo,
          email: result.user.company.email,
        },
      };

      dispatch(setUser(userInfo));
      setCurrentStep("success");
      onSuccess(result.message || "Email verified successfully!");

      setTimeout(() => {
        router("/dashboard");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || "Invalid verification code";
      onError(errorMessage);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        input0.current?.focus();
      }, 100);
    }
  };

  const resendOtp = async () => {
    onError("");
    try {
      const result = await sendEmailCode({ email }).unwrap();
      setOtpTimer(300);
      setOtp(["", "", "", "", "", ""]);
      onSuccess(result.message || "New verification code sent!");

      const timer = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        input0.current?.focus();
      }, 100);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        "Failed to resend verification code";
      onError(errorMessage);
    }
  };

  const goBackToEmail = () => {
    setCurrentStep("email-input");
    onError("");
    onSuccess("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLoading = isSendingCode || isVerifyingCode;
  const isOtpComplete = otp.join("").length === 6;

  // OTP Input Styles
  const getInputStyle = (index: number): React.CSSProperties => ({
    width: "48px",
    height: "56px",
    fontSize: "22px",
    fontWeight: 600,
    textAlign: "center",
    border: otp[index] ? "1px solid #34d399" : "1px solid rgba(255,255,255,0.2)",
    borderRadius: "10px",
    outline: "none",
    backgroundColor: otp[index] ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)",
    color: "white",
    transition: "all 0.2s ease",
    caretColor: "transparent",
  });

  const renderEmailInput = () => (
    <div className="space-y-6">
      <div className="space-y-1 pb-6">
        <h2 className="text-2xl text-center font-semibold">
          Email Verification
        </h2>
        <p className="text-center text-white/60">
          Enter your email address to receive a verification code
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="email" className="text-sm font-medium text-white/80">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-12 border-white/15 bg-white/5 text-white placeholder:text-white/35"
            disabled={isLoading}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
          />
        </div>
        <Button
          onClick={handleEmailSubmit}
          disabled={isLoading || !email}
          className="w-full h-12 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
        >
          {isSendingCode ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Sending verification...</span>
            </div>
          ) : (
            <div className="flex items-center">
              <Mail className="mr-2 h-4 w-4" />
              <span>Send Verification Code</span>
            </div>
          )}
        </Button>
        <Button onClick={onBack} className="w-full h-12 text-white/70 hover:bg-white/5 hover:text-white" variant="ghost">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Sign In Options
        </Button>
      </div>
    </div>
  );

  const renderOtpVerification = () => (
    <div className="space-y-6">
      <div className="space-y-1 pb-6">
        <h2 className="text-2xl text-center font-semibold">
          Enter Verification Code
        </h2>
        <p className="text-center text-white/60">
          We've sent a 6-digit code to {email}
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-white/80 block text-center">
            Enter 6-Digit Code
          </Label>

          {/* OTP INPUT BOXES */}
          <div className="flex justify-center gap-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={otp[index]}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={(e) => {
                  e.target.select();
                  e.target.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.35)";
                  e.target.style.borderColor = "#34d399";
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = "none";
                  if (!otp[index]) {
                    e.target.style.borderColor = "rgba(255,255,255,0.2)";
                  }
                }}
                disabled={isLoading}
                style={getInputStyle(index)}
              />
            ))}
          </div>

          <p className="text-xs text-white/45 text-center mt-3">
            Digits move automatically
          </p>
        </div>

        {/* Timer Display */}
        {otpTimer > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/15 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm text-emerald-300 font-medium">
                Code expires in: {formatTime(otpTimer)}
              </span>
            </div>
          </div>
        )}

        {/* Expired Timer */}
        {otpTimer === 0 && currentStep === "otp-verification" && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-red-500/15 px-4 py-2 rounded-full">
              <span className="text-sm text-red-300 font-medium">
                Code expired. Please request a new one.
              </span>
            </div>
          </div>
        )}

        {/* Verifying Indicator */}
        {isOtpComplete && isVerifyingCode && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/15 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <span className="text-sm text-emerald-300 font-medium">
                Verifying code...
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={resendOtp}
            className="flex-1 h-12 border-white/20 bg-white/5 text-white hover:bg-white/10"
            variant="outline"
            disabled={otpTimer > 240 || isSendingCode}
          >
            {isSendingCode ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : otpTimer > 240 ? (
              <span className="text-sm">
                Resend in {formatTime(otpTimer - 240)}
              </span>
            ) : (
              <span>Resend Code</span>
            )}
          </Button>
          <Button
            onClick={goBackToEmail}
            className="flex-1 h-12 text-white/70 hover:bg-white/5 hover:text-white"
            variant="ghost"
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Manual Verify Button */}
        {isOtpComplete && !isVerifyingCode && (
          <Button
            onClick={() => handleOtpVerification()}
            className="w-full h-12 bg-emerald-500 text-slate-950 hover:bg-emerald-400"
          >
            Verify Code
          </Button>
        )}
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="p-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Email Verified Successfully!
          </h3>
          <p className="text-white/60">
            Your email {email} has been verified. Redirecting to dashboard...
          </p>
        </div>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentStep === "email-input" && renderEmailInput()}
      {currentStep === "otp-verification" && renderOtpVerification()}
      {currentStep === "success" && renderSuccess()}
    </>
  );
}