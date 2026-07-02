import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Mail, ArrowLeft, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { userApi } from "../../api/userApi";
import { useProfile } from "../../hooks/useUsers";

const formatTime = (seconds) => {
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
};

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { data: profileData, isLoading } = useProfile();
  const userEmail = profileData?.user?.email || "";

  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const inputs = useRef([]);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const otpValue = otp.join("");

  const { mutate: verifyOtp, isPending } = useMutation({
    mutationFn: () => userApi.verifyEmailOtp(otpValue),
    onSuccess: () => {
      toast.success("Email verified successfully!");
      navigate("/profile");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Invalid OTP");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputs.current[0]?.focus();
    },
  });

  const { mutate: resendOtp, isPending: resendLoading } = useMutation({
    mutationFn: userApi.resendEmailOtp,
    onSuccess: () => {
      toast.success("OTP sent successfully.");
      setCooldown(60);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to resend OTP");
    },
  });

  useEffect(() => {
    if (otpValue.length === OTP_LENGTH) {
      verifyOtp();
    }
  }, [otpValue]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const updated = [...otp];
        updated[index] = "";
        setOtp(updated);
      } else if (index > 0) {
        inputs.current[index - 1]?.focus();
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const updated = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, i) => {
      updated[i] = digit;
    });

    setOtp(updated);
    inputs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-indigo-500/10">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">

        {/* Workspace-consistent Friendly Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200/60 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600">
              <Sparkles size={14} className="animate-pulse" />
              <span>Account Security</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Verify Your Email Address
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Please finalize your authentication context to unblock workspace directories.
            </p>
          </div>
        </div>

        {/* Focused Card Structure centered in the standard workspace grid */}
        <div className="flex justify-center py-4">
          <div className="bg-white border border-slate-200/80 shadow-xs rounded-2xl w-full max-w-md p-8 relative overflow-hidden">

            {/* Decorative Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />

            {/* Inner Content Header */}
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-xl text-blue-600 bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 transition-transform duration-300 hover:scale-105">
                <Mail size={24} strokeWidth={2} />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-600">
                <ShieldCheck size={14} className={isPending ? "animate-spin" : ""} />
                <span>Security Token</span>
              </div>

              <p className="mt-3 text-sm text-slate-500 max-w-xs mx-auto">
                We sent a 6-digit confirmation code to{" "}
                <span className="font-medium text-slate-700 block truncate mt-0.5">
                  {isLoading ? "your email..." : userEmail || "your registered email"}
                </span>
              </p>
            </div>

            {/* Input Matrix */}
            <div className="flex justify-center gap-2.5 mt-8" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputs.current[index] = el)}
                  type="text"
                  value={digit}
                  maxLength={1}
                  disabled={isPending}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 sm:w-13 sm:h-14 rounded-xl bg-slate-50 border border-slate-200 text-center text-xl font-bold text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all disabled:opacity-50"
                />
              ))}
            </div>

            {/* Verification State Banner */}
            {isPending && (
              <p className="text-xs text-blue-600 text-center mt-4 font-medium animate-pulse">
                Evaluating authentication string...
              </p>
            )}

            {/* Bottom Actions Frame */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
              <button
                type="button"
                disabled={cooldown > 0 || resendLoading}
                onClick={() => resendOtp()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:no-underline transition-all hover:underline"
              >
                <RefreshCw size={13} className={resendLoading ? "animate-spin" : ""} />
                {cooldown > 0 ? `Resend code in ${formatTime(cooldown)}` : "Resend Verification Code"}
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-98"
              >
                <ArrowLeft size={14} />
                <span>Return to Dashboard</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}