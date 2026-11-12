import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Activity, History, Send } from "lucide-react";
import clsx from "clsx";
import { api } from "../api/client";
import NotificationsComposer from "../components/notifications/NotificationsComposer";
import NotificationsHistoryTab from "../components/notifications/NotificationsHistoryTab";
import NotificationsStatusTab from "../components/notifications/NotificationsStatusTab";

type NotificationsTab = "composer" | "history" | "status";

export default function NotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as NotificationsTab) || "composer";
  const [activeTab, setActiveTab] = useState<NotificationsTab>(
    initialTab === "history" || initialTab === "status" ? initialTab : "composer",
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(
    searchParams.get("batchId"),
  );

  const initialPrefill = useMemo(() => {
    const userId = searchParams.get("userId") || undefined;
    const email = searchParams.get("email") || undefined;
    const name = searchParams.get("name") || undefined;
    return userId || email ? { userId, email, name } : undefined;
  }, [searchParams]);

  const statusQuery = useQuery({
    queryKey: ["notificaciones-status-pill"],
    queryFn: () => api.notificaciones.status(false),
    staleTime: 30_000,
  });

  const overall = statusQuery.data?.overallStatus;
  const pillStyle =
    overall === "healthy"
      ? "bg-green-100 text-green-700"
      : overall === "degraded"
        ? "bg-amber-100 text-amber-800"
        : statusQuery.isError || overall === "unhealthy"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-600";

  const switchTab = (next: NotificationsTab, batchId?: string | null) => {
    setActiveTab(next);
    if (batchId !== undefined) setSelectedBatchId(batchId);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", next);
    if (batchId) nextParams.set("batchId", batchId);
    else if (batchId === null) nextParams.delete("batchId");
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Notificaciones y Correos
          </h1>
          <p className="text-sm text-gray-600">
            Envía comunicados YouConnext, plantillas del sistema y notificaciones push segmentadas
          </p>
        </div>

        <button
          type="button"
          onClick={() => switchTab("status")}
          className={clsx(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80",
            pillStyle,
          )}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {statusQuery.isLoading
            ? "Comprobando servicio…"
            : statusQuery.isError
              ? "API Notificaciones sin conexión"
              : `Servicio ${overall?.toUpperCase() ?? "OK"}`}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-panel-200 pb-3">
        {[
          { id: "composer" as const, label: "Enviar comunicación", icon: Send },
          { id: "history" as const, label: "Historial y lotes", icon: History },
          {
            id: "status" as const,
            label: "Estado del servicio",
            icon: Activity,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-panel-800 text-white"
                  : "border border-panel-200 bg-white text-gray-700 hover:bg-panel-50",
              )}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "composer" && (
        <NotificationsComposer
          initialPrefill={initialPrefill}
          onInspectBatch={(batchId) => switchTab("history", batchId)}
        />
      )}

      {activeTab === "history" && (
        <NotificationsHistoryTab
          selectedBatchId={selectedBatchId}
          onSelectBatchId={(id) => {
            setSelectedBatchId(id);
            const nextParams = new URLSearchParams(searchParams);
            nextParams.set("tab", "history");
            if (id) nextParams.set("batchId", id);
            else nextParams.delete("batchId");
            setSearchParams(nextParams, { replace: true });
          }}
        />
      )}

      {activeTab === "status" && <NotificationsStatusTab />}
    </div>
  );
}
