// lib/GlobalToastManager.ts
import { Dimensions } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface ToastData {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

class GlobalToastManager {
  private toasts: ToastData[] = [];
  private listeners: ((toasts: ToastData[]) => void)[] = [];
  private toastContainer: any = null;

  // Register the toast container component
  setToastContainer(container: any) {
    this.toastContainer = container;
  }

  // Subscribe to toast changes
  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach((listener) => listener([...this.toasts]));
  }

  // Add a new toast
  showToast(toast: Omit<ToastData, "id">) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      ...toast,
      id,
    };

    this.toasts.push(newToast);
    this.notify();

    // Auto remove after duration
    setTimeout(() => {
      this.hideToast(id);
    }, toast.duration || 4000);
  }

  // Remove a toast
  hideToast(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notify();
  }

  // Convenience methods
  showSuccess(title: string, message?: string, duration?: number) {
    this.showToast({ type: "success", title, message, duration });
  }

  showError(title: string, message?: string, duration?: number) {
    this.showToast({ type: "error", title, message, duration });
  }

  showInfo(title: string, message?: string, duration?: number) {
    this.showToast({ type: "info", title, message, duration });
  }

  showWarning(title: string, message?: string, duration?: number) {
    this.showToast({ type: "warning", title, message, duration });
  }

  // Get current toasts
  getToasts(): ToastData[] {
    return [...this.toasts];
  }
}

// Create singleton instance
export const globalToastManager = new GlobalToastManager();

// Export convenience functions
export const showSuccess = (
  title: string,
  message?: string,
  duration?: number
) => globalToastManager.showSuccess(title, message, duration);

export const showError = (title: string, message?: string, duration?: number) =>
  globalToastManager.showError(title, message, duration);

export const showInfo = (title: string, message?: string, duration?: number) =>
  globalToastManager.showInfo(title, message, duration);

export const showWarning = (
  title: string,
  message?: string,
  duration?: number
) => globalToastManager.showWarning(title, message, duration);
