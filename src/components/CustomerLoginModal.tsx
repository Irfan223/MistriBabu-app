import { useState, useRef, useEffect } from "react";
import { Phone, KeyRound, Loader2, X, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

interface CustomerLoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "phone" | "otp";

const OTP_RESEND_COOLDOWN = 30;

export default function CustomerLoginModal({
  open,
  onClose,
}: CustomerLoginModalProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toasts, showToast, dismiss } = useToast();

  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setOtp("");
      setDevOtp(null);
      setCooldown(0);
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    }
  }, [open]);

  const startCooldown = () => {
    setCooldown(OTP_RESEND_COOLDOWN);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      showToast("error", "Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("send-otp", {
        body: { phone, type: "customer" },
      });
      const data = res.data as {
        success?: boolean;
        dev_otp?: string;
        error?: string;
      } | null;
      if (data?.error) throw new Error(data.error);
      if (res.error) throw new Error(res.error.message);
      if (data?.dev_otp) setDevOtp(data.dev_otp);
      setStep("otp");
      startCooldown();
      showToast("success", "OTP sent!");
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to send OTP.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      showToast("error", "Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("verify-otp", {
        body: { phone, otp, type: "customer" },
      });
      const data = res.data as {
        success?: boolean;
        hashed_token?: string;
        error?: string;
      } | null;
      if (data?.error) throw new Error(data.error);
      if (res.error) throw new Error(res.error.message);
      if (!data?.hashed_token)
        throw new Error("Verification failed. Please try again.");
      const { error: sessionErr } = await supabase.auth.verifyOtp({
        token_hash: data.hashed_token,
        type: "magiclink",
      });
      if (sessionErr) throw sessionErr;
      onClose();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Track Your Orders
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {step === "phone"
                ? "Enter the mobile number used while booking"
                : `OTP sent to +91 ${phone}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Mobile Number
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-slate-400"
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || phone.length !== 10}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {devOtp && (
              <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <KeyRound className="h-4 w-4 shrink-0 text-blue-500" />
                <div>
                  <p className="text-xs text-blue-700">Your OTP</p>
                  <p className="text-lg font-bold tracking-widest text-blue-900">
                    {devOtp}
                  </p>
                </div>
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Enter 6-digit OTP
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-200">
                <KeyRound className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="flex-1 bg-transparent py-3 text-center text-xl font-bold tracking-[0.5em] outline-none placeholder:text-slate-300"
                  autoFocus
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                OTP expires in 5 minutes
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "View My Orders"
              )}
            </button>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setDevOtp(null);
                }}
                className="flex items-center gap-1 hover:text-slate-700"
              >
                <X className="h-3 w-3" /> Change number
              </button>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={cooldown > 0 || loading}
                className="flex items-center gap-1 font-medium text-orange-600 hover:text-orange-500 disabled:text-slate-400"
              >
                <RefreshCw className="h-3 w-3" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
