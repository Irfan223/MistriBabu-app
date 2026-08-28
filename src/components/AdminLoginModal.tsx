import { useState } from "react";
import { ArrowLeft, LockKeyhole, Loader2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/Toast";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onAuthorized: () => void;
}

export default function AdminLoginModal({ open, onClose, onAuthorized }: AdminLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toasts, showToast, dismiss } = useToast();

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password) {
      showToast("error", "Enter your admin email and password.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      showToast("error", error?.message ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();

    if (adminError || !admin) {
      await supabase.auth.signOut();
      showToast("error", "Access Denied: Not an authorized admin.");
      setLoading(false);
      return;
    }

    setLoading(false);
    onAuthorized();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <Toast toasts={toasts} onDismiss={dismiss} />
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 animate-in">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Admin Portal</h2>
            <p className="mt-1 text-sm text-slate-500">Sign in to manage leads and partners.</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input className="form-input mt-1.5" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Password
            <input className="form-input mt-1.5" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
          </label>
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Verifying access..." : "Sign In"}
          </button>
          <button type="button" onClick={onClose} className="flex w-full items-center justify-center gap-1.5 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </button>
        </form>
      </div>
    </div>
  );
}