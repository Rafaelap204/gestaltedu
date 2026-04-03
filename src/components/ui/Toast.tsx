"use client";

import { useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore } from "@/lib/stores/toast-store";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItemProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  onClose: () => void;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <AlertCircle size={20} className="text-red-500" />,
  warning: <AlertTriangle size={20} className="text-yellow-500" />,
  info: <Info size={20} className="text-blue-500" />,
};

const toastStyles: Record<ToastType, string> = {
  success: "border-l-4 border-l-green-500",
  error: "border-l-4 border-l-red-500",
  warning: "border-l-4 border-l-yellow-500",
  info: "border-l-4 border-l-blue-500",
};

function ToastItem({ id, type, title, message, onClose }: ToastItemProps) {
  useEffect(() => {
    // Animation entry
    const timer = setTimeout(() => {
      // Auto-close handled by store, this is just for animation if needed
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`flex items-start gap-3 w-full max-w-sm p-4 bg-white rounded-lg shadow-lg border border-brand-gray-200 ${toastStyles[type]} animate-in slide-in-from-right-full duration-300`}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{toastIcons[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-brand-gray-900">{title}</p>
        {message && (
          <p className="text-sm text-brand-gray-500 mt-0.5">{message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 text-brand-gray-400 hover:text-brand-gray-600 hover:bg-brand-gray-100 rounded transition-colors duration-200"
        aria-label="Fechar notificação"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
