import {
  Bug,
  Lightbulb,
  Sparkles,
  Gauge,
  Car,
  Building2,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";
import type { FeedbackCategoryKey } from "../types/feedback.types";

interface FeedbackCategoryBadgeProps {
  category: FeedbackCategoryKey | string;
  label?: string;
  className?: string;
}

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: LucideIcon; color: string }
> = {
  bug: {
    label: "Fallo técnico",
    icon: Bug,
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
  improvement: {
    label: "Propuesta de mejora",
    icon: Lightbulb,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  usability: {
    label: "Experiencia / UI",
    icon: Sparkles,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  performance: {
    label: "Rendimiento",
    icon: Gauge,
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  service: {
    label: "Servicio de viaje",
    icon: Car,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  organization: {
    label: "Organización",
    icon: Building2,
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  other: {
    label: "Otros comentarios",
    icon: MessageSquare,
    color: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

export default function FeedbackCategoryBadge({
  category,
  label,
  className,
}: FeedbackCategoryBadgeProps) {
  const meta = CATEGORY_MAP[category] || {
    label: category,
    icon: MessageSquare,
    color: "bg-gray-50 text-gray-700 border-gray-200",
  };

  const Icon = meta.icon;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        meta.color,
        className,
      )}
    >
      <Icon size={12} className="shrink-0" />
      <span>{label || meta.label}</span>
    </span>
  );
}
