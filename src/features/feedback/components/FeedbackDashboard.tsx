import { Inbox, AlertCircle, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import type { FeedbackItem } from "../types/feedback.types";

interface FeedbackDashboardProps {
  items: FeedbackItem[];
  totalCount: number;
}

export default function FeedbackDashboard({
  items,
  totalCount,
}: FeedbackDashboardProps) {
  const pendingCount = items.filter(
    (item) => item.status === "submitted" || item.status === "received",
  ).length;

  const inProgressCount = items.filter(
    (item) =>
      item.status === "in_progress" || item.status === "pending_verification",
  ).length;

  const resolvedCount = items.filter((item) => item.status === "resolved").length;

  const resolutionRate =
    items.length > 0
      ? Math.round((resolvedCount / items.length) * 100)
      : totalCount > 0
        ? Math.round((resolvedCount / Math.max(1, totalCount)) * 100)
        : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Recibidos */}
      <div className="flex items-center gap-4 rounded-xl border border-panel-200 bg-white p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-panel-100 text-panel-800">
          <Inbox size={24} />
        </div>
        <div>
          <div className="text-xs font-medium text-gray-500">Total Reportes</div>
          <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
          <div className="text-xs text-gray-400">Total registrados</div>
        </div>
      </div>

      {/* 2. Pendientes de Triage */}
      <div className="flex items-center gap-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <AlertCircle size={24} />
        </div>
        <div>
          <div className="text-xs font-medium text-amber-800">
            Pendientes de Triage
          </div>
          <div className="text-2xl font-bold text-amber-900">{pendingCount}</div>
          <div className="text-xs text-amber-700">Enviados / Recibidos</div>
        </div>
      </div>

      {/* 3. En Curso / Verificación */}
      <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
          <Clock size={24} />
        </div>
        <div>
          <div className="text-xs font-medium text-blue-800">
            En Curso / Verificación
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {inProgressCount}
          </div>
          <div className="text-xs text-blue-700">Desarrollo y pruebas</div>
        </div>
      </div>

      {/* 4. Tasa de Resolución */}
      <div className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-emerald-800">
              Tasa Resolución
            </span>
            <TrendingUp size={12} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900">
            {resolutionRate}%
          </div>
          <div className="text-xs text-emerald-700">
            {resolvedCount} de {items.length} resueltos
          </div>
        </div>
      </div>
    </div>
  );
}
