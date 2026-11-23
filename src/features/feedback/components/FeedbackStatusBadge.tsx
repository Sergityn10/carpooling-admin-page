import clsx from "clsx";
import type { FeedbackStatusKey } from "../types/feedback.types";

interface FeedbackStatusBadgeProps {
  status: FeedbackStatusKey;
  label?: string;
  className?: string;
}

export const STATUS_CONFIG: Record<
  FeedbackStatusKey,
  { label: string; bg: string; text: string; dot: string }
> = {
  submitted: {
    label: "Enviado",
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
  received: {
    label: "Recibido",
    bg: "bg-sky-50 border border-sky-200",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
  in_progress: {
    label: "En progreso",
    bg: "bg-amber-50 border border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  pending_verification: {
    label: "En verificación",
    bg: "bg-orange-50 border border-orange-200",
    text: "text-orange-800",
    dot: "bg-orange-500",
  },
  resolved: {
    label: "Resuelto",
    bg: "bg-emerald-50 border border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  discarded: {
    label: "Descartado",
    bg: "bg-rose-50 border border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
};

export default function FeedbackStatusBadge({
  status,
  label,
  className,
}: FeedbackStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-700",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.text,
        className,
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", config.dot)} />
      {label || config.label}
    </span>
  );
}
