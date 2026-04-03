import { create } from "zustand";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.duration || 5000;

    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, duration);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

// Helper functions for common toast types
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "success",
      title,
      message,
      duration,
    });
  },
  error: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "error",
      title,
      message,
      duration,
    });
  },
  warning: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "warning",
      title,
      message,
      duration,
    });
  },
  info: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast({
      type: "info",
      title,
      message,
      duration,
    });
  },
};
