import * as React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

// Global toast state listeners
const listeners = [];
let memoryToasts = [];
let toastIdCounter = 0;

function dispatch(action) {
  if (action.type === "ADD_TOAST") {
    memoryToasts = [...memoryToasts, action.toast];
  } else if (action.type === "DISMISS_TOAST") {
    memoryToasts = memoryToasts.filter((t) => t.id !== action.id);
  } else if (action.type === "CLEAR_ALL") {
    memoryToasts = [];
  }
  listeners.forEach((listener) => listener(memoryToasts));
}

export function toast(options) {
  const id = String(++toastIdCounter);
  const toastObj = typeof options === "string" ? { description: options } : options;
  const duration = toastObj.duration || 4000;

  const item = {
    id,
    title: toastObj.title,
    description: toastObj.description || toastObj.message,
    variant: toastObj.variant || "default",
    duration,
  };

  dispatch({ type: "ADD_TOAST", toast: item });

  if (duration !== Infinity) {
    setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", id });
    }, duration);
  }

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", id }),
  };
}

// Convenience methods
toast.success = (description, title = "Success") =>
  toast({ title, description, variant: "success" });

toast.error = (description, title = "Error") =>
  toast({ title, description, variant: "destructive" });

toast.info = (description, title = "Notice") =>
  toast({ title, description, variant: "info" });

toast.warning = (description, title = "Warning") =>
  toast({ title, description, variant: "warning" });

toast.dismiss = (id) => dispatch({ type: "DISMISS_TOAST", id });

export function useToast() {
  const [toasts, setToasts] = React.useState(memoryToasts);

  React.useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id) => dispatch({ type: "DISMISS_TOAST", id }),
  };
}

const variantStyles = {
  default: "bg-card text-card-foreground border-border",
  success: "bg-card text-card-foreground border-emerald-500/30 dark:border-emerald-500/30",
  destructive: "bg-card text-card-foreground border-destructive/40 dark:border-destructive/40",
  warning: "bg-card text-card-foreground border-amber-500/30 dark:border-amber-500/30",
  info: "bg-card text-card-foreground border-blue-500/30 dark:border-blue-500/30",
};

const iconMap = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  destructive: <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
  info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
  default: null,
};

export const ToastItem = ({ toast: t, onDismiss }) => {
  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 sm:slide-in-from-bottom-2",
        variantStyles[t.variant] || variantStyles.default
      )}
    >
      {iconMap[t.variant]}
      <div className="flex-1 grid gap-1">
        {t.title && <div className="text-xs font-semibold tracking-tight">{t.title}</div>}
        {t.description && (
          <div className="text-xs text-muted-foreground leading-relaxed break-words">
            {t.description}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        className="rounded-xs p-1 text-muted-foreground opacity-70 transition-opacity hover:opacity-100 hover:bg-muted"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
