import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 sm:top-6 sm:right-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === "success";

  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 shadow-lg ring-1 animate-in-toast max-w-sm ${
        isSuccess
          ? "bg-orange-50 text-orange-800 ring-orange-200"
          : "bg-red-50 text-red-800 ring-red-200"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      )}
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="rounded p-0.5 text-current opacity-60 transition hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
