import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Layers,
  Send,
  UserCheck,
} from "lucide-react";
import clsx from "clsx";
import { api } from "../../api/client";
import type {
  AdminDispatchResult,
  AdminEmailContentInput,
  AdminNotificationTarget,
  AdminPreviewResponse,
  AdminPushContentInput,
  NotificationChannel,
} from "../../api/types";
import { useAuth } from "../../context/AuthContext";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import EmailComposerSection, {
  type EmailComposerState,
} from "./EmailComposerSection";
import LivePreviewPanel from "./LivePreviewPanel";
import PushComposerSection, {
  deriveLinkedPushContent,
  type PushComposerState,
} from "./PushComposerSection";
import TargetAudienceSelector, {
  type SelectedRecipientEntry,
} from "./TargetAudienceSelector";
import {
  buildEmailTemplateOptions,
  formatTargetSummary,
  isValidHttpUrl,
  PUSH_TEMPLATE_CATALOG,
} from "./templateCatalogMeta";

export type ChannelMode = "email" | "push" | "multi";

type InitialRecipientPrefill = {
  userId?: string;
  email?: string;
  name?: string;
};

type NotificationsComposerProps = {
  initialPrefill?: InitialRecipientPrefill;
  onInspectBatch: (batchId: string) => void;
};

export default function NotificationsComposer({
  initialPrefill,
  onInspectBatch,
}: NotificationsComposerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [channelMode, setChannelMode] = useState<ChannelMode>("email");
  const [deliverySync, setDeliverySync] = useState(false);

  const [target, setTarget] = useState<AdminNotificationTarget>(() => {
    if (initialPrefill?.userId || initialPrefill?.email) {
      return {
        type: "single",
        userId: initialPrefill.userId || undefined,
        email: initialPrefill.email || undefined,
        name: initialPrefill.name || undefined,
      };
    }
    return { type: "single" };
  });

  const [selectedEntries, setSelectedEntries] = useState<
    SelectedRecipientEntry[]
  >(() => {
    if (initialPrefill?.userId || initialPrefill?.email) {
      return [
        {
          key: initialPrefill.userId
            ? `user:${initialPrefill.userId}`
            : `email:${initialPrefill.email}`,
          userId: initialPrefill.userId,
          email: initialPrefill.email,
          name: initialPrefill.name,
          source: "user",
        },
      ];
    }
    return [];
  });

  useEffect(() => {
    if (!initialPrefill?.userId && !initialPrefill?.email) return;
    setTarget({
      type: "single",
      userId: initialPrefill.userId || undefined,
      email: initialPrefill.email || undefined,
      name: initialPrefill.name || undefined,
    });
    setSelectedEntries([
      {
        key: initialPrefill.userId
          ? `user:${initialPrefill.userId}`
          : `email:${initialPrefill.email}`,
        userId: initialPrefill.userId,
        email: initialPrefill.email,
        name: initialPrefill.name,
        source: "user",
      },
    ]);
  }, [initialPrefill?.userId, initialPrefill?.email, initialPrefill?.name]);

  const [emailState, setEmailState] = useState<EmailComposerState>({
    mode: "custom",
    subject: "",
    title: "",
    message: "",
    ctaText: "",
    ctaUrl: "",
    template: "welcome",
    templateData: {},
  });

  const [pushState, setPushState] = useState<PushComposerState>({
    linkedToEmail: true,
    mode: "custom",
    title: "",
    body: "",
    priority: "high",
    template: PUSH_TEMPLATE_CATALOG[0].name,
    templateData: {},
    channelId: "",
    badge: "",
    dataEntries: [],
  });

  const [previewData, setPreviewData] = useState<AdminPreviewResponse | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [dispatchResult, setDispatchResult] =
    useState<AdminDispatchResult | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const templatesQuery = useQuery({
    queryKey: ["notificaciones-email-templates"],
    queryFn: () => api.notificaciones.emailTemplates(),
    staleTime: 5 * 60_000,
  });

  const catalogQuery = useQuery({
    queryKey: ["notificaciones-catalog"],
    queryFn: () => api.notificaciones.catalog(),
    staleTime: 5 * 60_000,
  });

  const templateOptions = useMemo(
    () =>
      buildEmailTemplateOptions(
        templatesQuery.data?.templates,
        catalogQuery.data?.types,
      ),
    [templatesQuery.data?.templates, catalogQuery.data?.types],
  );

  const selectedEmailTpl = useMemo(
    () => templateOptions.find((t) => t.name === emailState.template),
    [templateOptions, emailState.template],
  );

  const activeChannels: NotificationChannel[] = useMemo(() => {
    if (channelMode === "email") return ["email"];
    if (channelMode === "push") return ["push"];
    return ["push", "email"];
  }, [channelMode]);

  const previewMutation = useMutation({
    mutationFn: (payload: {
      target: AdminNotificationTarget;
      channels: NotificationChannel[];
    }) => api.notificaciones.preview(payload),
    onSuccess: (res) => {
      setPreviewError(null);
      setPreviewData(res);
    },
    onError: (err: Error) => {
      setPreviewError(err.message);
    },
  });

  const maxPreviewCount = useMemo(() => {
    if (!previewData) return 0;
    return Math.max(
      previewData.preview.email?.totalRecipients ?? 0,
      previewData.preview.push?.totalDevices ?? 0,
    );
  }, [previewData]);

  const syncExceedsLimit = maxPreviewCount > 50;

  useEffect(() => {
    if (syncExceedsLimit && deliverySync) {
      setDeliverySync(false);
    }
  }, [syncExceedsLimit, deliverySync]);

  // Clear stale preview when target or channels change
  const handleTargetChange = (next: AdminNotificationTarget) => {
    setTarget(next);
    setPreviewData(null);
    setPreviewError(null);
  };

  const handleChannelChange = (next: ChannelMode) => {
    setChannelMode(next);
    setPreviewData(null);
    setPreviewError(null);
  };

  const buildValidatedPayloads = (): {
    email?: AdminEmailContentInput;
    push?: AdminPushContentInput;
  } | null => {
    setValidationError(null);

    let emailPayload: AdminEmailContentInput | undefined;
    if (channelMode === "email" || channelMode === "multi") {
      if (emailState.mode === "custom") {
        if (!emailState.subject.trim()) {
          setValidationError("El asunto del correo electrónico es obligatorio.");
          return null;
        }
        if (!emailState.message.trim()) {
          setValidationError("El cuerpo del correo electrónico es obligatorio.");
          return null;
        }
        if (emailState.ctaUrl.trim() && !isValidHttpUrl(emailState.ctaUrl)) {
          setValidationError(
            "La URL del botón CTA debe comenzar por http:// o https://.",
          );
          return null;
        }
        emailPayload = {
          subject: emailState.subject.trim(),
          title: emailState.title.trim() || undefined,
          message: emailState.message.trim(),
          ctaText: emailState.ctaText.trim() || undefined,
          ctaUrl: emailState.ctaUrl.trim() || undefined,
        };
      } else {
        if (!emailState.template) {
          setValidationError("Selecciona una plantilla de correo.");
          return null;
        }
        const missing = (selectedEmailTpl?.requiredFields ?? []).filter(
          (k) => !String(emailState.templateData[k] ?? "").trim(),
        );
        if (missing.length > 0) {
          setValidationError(
            `Faltan campos obligatorios en la plantilla '${emailState.template}': ${missing.join(", ")}.`,
          );
          return null;
        }
        emailPayload = {
          template: emailState.template,
          data: emailState.templateData,
        };
      }
    }

    let pushPayload: AdminPushContentInput | undefined;
    if (channelMode === "push" || channelMode === "multi") {
      const extraData: Record<string, string> = {};
      for (const pair of pushState.dataEntries) {
        if (pair.key.trim() && pair.value.trim()) {
          extraData[pair.key.trim()] = pair.value.trim();
        }
      }
      const parsedBadge =
        pushState.badge.trim() !== "" && !Number.isNaN(Number(pushState.badge))
          ? Number(pushState.badge)
          : undefined;

      const commonOpts = {
        priority: pushState.priority,
        channelId: pushState.channelId.trim() || undefined,
        badge: parsedBadge,
      };

      if (channelMode === "multi" && pushState.linkedToEmail) {
        const derived = deriveLinkedPushContent(emailState, selectedEmailTpl);
        if (derived.mode === "template" && derived.template) {
          pushPayload = {
            template: derived.template,
            data: { ...derived.templateData, ...extraData },
            ...commonOpts,
          };
        } else {
          if (!derived.title.trim() || !derived.body.trim()) {
            setValidationError(
              "No hay título o cuerpo suficiente para derivar la notificación Push.",
            );
            return null;
          }
          pushPayload = {
            title: derived.title.trim(),
            body: derived.body.trim(),
            data: Object.keys(extraData).length > 0 ? extraData : undefined,
            ...commonOpts,
          };
        }
      } else if (pushState.mode === "template") {
        const tpl = PUSH_TEMPLATE_CATALOG.find(
          (t) => t.name === pushState.template,
        );
        const missing = (tpl?.fields ?? []).filter(
          (k) => !String(pushState.templateData[k] ?? "").trim(),
        );
        if (missing.length > 0) {
          setValidationError(
            `Faltan campos obligatorios en la plantilla Push '${pushState.template}': ${missing.join(", ")}.`,
          );
          return null;
        }
        pushPayload = {
          template: pushState.template,
          data: { ...pushState.templateData, ...extraData },
          ...commonOpts,
        };
      } else {
        if (!pushState.title.trim() || !pushState.body.trim()) {
          setValidationError(
            "El título y el mensaje de la notificación Push son obligatorios.",
          );
          return null;
        }
        pushPayload = {
          title: pushState.title.trim(),
          body: pushState.body.trim(),
          data: Object.keys(extraData).length > 0 ? extraData : undefined,
          ...commonOpts,
        };
      }
    }

    return { email: emailPayload, push: pushPayload };
  };

  const validateTargetSelected = (t: AdminNotificationTarget): boolean => {
    if (t.type === "single") {
      if (!t.userId && !t.email && !t.token) {
        setValidationError(
          "Selecciona o introduce un usuario (email, userId o token) en 'Usuario único'.",
        );
        return false;
      }
    }
    if (t.type === "users") {
      if (
        (t.userIds?.length ?? 0) === 0 &&
        (t.emails?.length ?? 0) === 0 &&
        (t.tokens?.length ?? 0) === 0
      ) {
        setValidationError(
          "Selecciona al menos un usuario o añade algún email en 'Selección múltiple'.",
        );
        return false;
      }
    }
    return true;
  };

  const sendMutation = useMutation({
    mutationFn: async (opts: {
      overrideTarget?: AdminNotificationTarget;
      sync: boolean;
      dryRun: boolean;
      email?: AdminEmailContentInput;
      push?: AdminPushContentInput;
    }) => {
      const effectiveTarget = opts.overrideTarget ?? target;
      if (channelMode === "email") {
        return api.notificaciones.sendEmail({
          ...(opts.email ?? {}),
          target: effectiveTarget,
          sync: opts.sync,
          dryRun: opts.dryRun,
        });
      }
      if (channelMode === "push") {
        return api.notificaciones.sendPush({
          ...(opts.push ?? {}),
          target: effectiveTarget,
          sync: opts.sync,
          dryRun: opts.dryRun,
        });
      }
      return api.notificaciones.sendMulti({
        target: effectiveTarget,
        channels: ["push", "email"],
        email: opts.email,
        push: opts.push,
        sync: opts.sync,
        dryRun: opts.dryRun,
      });
    },
    onSuccess: (res) => {
      setDispatchResult(res);
      setConfirmModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["notificaciones-history"] });
      queryClient.invalidateQueries({ queryKey: ["notificaciones-status"] });
    },
    onError: (err: Error) => {
      setConfirmModalOpen(false);
      setValidationError(err.message);
    },
  });

  const handleDryRun = () => {
    setDispatchResult(null);
    if (!validateTargetSelected(target)) return;
    const payloads = buildValidatedPayloads();
    if (!payloads) return;
    sendMutation.mutate({
      sync: false,
      dryRun: true,
      email: payloads.email,
      push: payloads.push,
    });
  };

  const handleSelfTest = () => {
    setDispatchResult(null);
    if (!user?.email && !user?.userId) {
      setValidationError(
        "No se pudo detectar el email o userId de tu sesión actual.",
      );
      return;
    }
    const payloads = buildValidatedPayloads();
    if (!payloads) return;
    sendMutation.mutate({
      overrideTarget: {
        type: "single",
        userId: user.userId || undefined,
        email: user.email || undefined,
        name: "Admin",
      },
      sync: true,
      dryRun: false,
      email: payloads.email,
      push: payloads.push,
    });
  };

  const handleRequestRealSend = async () => {
    setDispatchResult(null);
    if (!validateTargetSelected(target)) return;
    const payloads = buildValidatedPayloads();
    if (!payloads) return;

    const needsConfirmation =
      target.type === "all" ||
      target.type === "filter" ||
      selectedEntries.length > 10;

    if (needsConfirmation) {
      if (!previewData) {
        try {
          await previewMutation.mutateAsync({
            target,
            channels: activeChannels,
          });
        } catch {
          return;
        }
      }
      setConfirmModalOpen(true);
      return;
    }

    sendMutation.mutate({
      sync: deliverySync,
      dryRun: false,
      email: payloads.email,
      push: payloads.push,
    });
  };

  const handleConfirmBroadcast = () => {
    const payloads = buildValidatedPayloads();
    if (!payloads) return;
    sendMutation.mutate({
      sync: deliverySync && !syncExceedsLimit,
      dryRun: false,
      email: payloads.email,
      push: payloads.push,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left column: Form Controls */}
        <div className="space-y-4 lg:col-span-7">
          {/* Channel Selection Card */}
          <Card>
            <CardTitle>Canal de comunicación</CardTitle>
            <CardSubtitle>
              Elige si deseas enviar un correo electrónico, una notificación push o ambos simultáneamente
            </CardSubtitle>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                {
                  id: "email" as const,
                  label: "Solo Email",
                  desc: "Plantilla corporativa o catálogo",
                },
                {
                  id: "push" as const,
                  label: "Solo Push",
                  desc: "Notificación móvil FCM",
                },
                {
                  id: "multi" as const,
                  label: "Multi-canal",
                  desc: "Email + Push en un envío",
                },
              ].map((opt) => {
                const active = channelMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleChannelChange(opt.id)}
                    className={clsx(
                      "rounded-lg border p-3 text-left transition-colors",
                      active
                        ? "border-panel-700 bg-panel-50 text-panel-950"
                        : "border-panel-200 bg-white text-gray-700 hover:bg-panel-50",
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-semibold">
                      <Layers
                        size={14}
                        className={active ? "text-panel-700" : "text-gray-400"}
                      />
                      {opt.label}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Target Audience */}
          <TargetAudienceSelector
            target={target}
            selectedEntries={selectedEntries}
            onChangeTarget={handleTargetChange}
            onChangeSelectedEntries={setSelectedEntries}
            previewData={previewData}
            previewLoading={previewMutation.isPending}
            previewError={previewError}
            onRequestPreview={() =>
              previewMutation.mutate({ target, channels: activeChannels })
            }
          />

          {/* Email Composer */}
          {(channelMode === "email" || channelMode === "multi") && (
            <EmailComposerSection
              value={emailState}
              onChange={setEmailState}
              templatesMeta={templatesQuery.data?.templates ?? []}
              catalogItems={catalogQuery.data?.types ?? []}
              loadingTemplates={
                templatesQuery.isLoading || catalogQuery.isLoading
              }
            />
          )}

          {/* Push Composer */}
          {(channelMode === "push" || channelMode === "multi") && (
            <PushComposerSection
              value={pushState}
              onChange={setPushState}
              isMultiChannel={channelMode === "multi"}
              emailState={emailState}
              selectedEmailTpl={selectedEmailTpl}
            />
          )}

          {/* Delivery Mode & Actions */}
          <Card>
            <CardTitle>Ejecución y envío</CardTitle>
            <CardSubtitle>
              Puedes simular la validación sin enviar nada, enviarte una prueba inmediata o lanzar el envío definitivo
            </CardSubtitle>

            <div className="mt-3 rounded-lg border border-panel-200 bg-panel-50/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-800">
                  <input
                    type="checkbox"
                    checked={deliverySync}
                    disabled={syncExceedsLimit}
                    onChange={(e) => setDeliverySync(e.target.checked)}
                    className="h-4 w-4 rounded border-panel-300 text-panel-700 disabled:opacity-50"
                  />
                  Envío síncrono inmediato (`sync: true`, máximo 50 destinatarios)
                </label>
                <span className="text-[11px] text-gray-500">
                  {deliverySync
                    ? "Devuelve el resultado exacto de entrega al instante"
                    : "Por defecto usa cola asíncrona recomendada (202 Accepted)"}
                </span>
              </div>
              {syncExceedsLimit && (
                <p className="mt-1.5 text-xs text-amber-700">
                  El alcance previsualizado ({maxPreviewCount}) supera el límite de 50 para modo síncrono. Se usará cola en segundo plano.
                </p>
              )}
            </div>

            {validationError && (
              <div className="mt-3">
                <Alert variant="error" title="Revisa el envío">
                  {validationError}
                </Alert>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDryRun}
                  disabled={sendMutation.isPending}
                  className="border border-panel-200 bg-white"
                >
                  <FlaskConical size={15} />
                  Simular (dryRun)
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSelfTest}
                  disabled={sendMutation.isPending}
                  className="border border-panel-200 bg-white"
                >
                  <UserCheck size={15} />
                  Enviar prueba real a mi cuenta
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleRequestRealSend}
                disabled={sendMutation.isPending || previewMutation.isPending}
              >
                <Send size={15} />
                {sendMutation.isPending
                  ? "Procesando envío…"
                  : "Enviar comunicación"}
              </Button>
            </div>
          </Card>

          {/* Result card */}
          {dispatchResult && (
            <DispatchResultCard
              result={dispatchResult}
              onInspectBatch={onInspectBatch}
            />
          )}
        </div>

        {/* Right column: Live Visual Preview */}
        <div className="lg:col-span-5">
          <LivePreviewPanel
            channelMode={channelMode}
            target={target}
            emailState={emailState}
            pushState={pushState}
            selectedEmailTpl={selectedEmailTpl}
          />
        </div>
      </div>

      {/* Confirmation Modal for Broad / Filter Sends */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-panel-200 bg-white p-5 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  Confirmar envío masivo
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Estás a punto de ejecutar un envío real con la audiencia{" "}
                  <span className="font-semibold text-gray-900">
                    {formatTargetSummary(target)}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-lg border border-panel-200 bg-panel-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Canales:</span>
                <span className="font-semibold uppercase text-gray-900">
                  {activeChannels.join(" + ")}
                </span>
              </div>
              {previewData?.preview.email && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Destinatarios Email:</span>
                  <span className="font-semibold text-gray-900">
                    {previewData.preview.email.totalRecipients}
                  </span>
                </div>
              )}
              {previewData?.preview.push && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Dispositivos Push:</span>
                  <span className="font-semibold text-gray-900">
                    {previewData.preview.push.totalDevices}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Modo de entrega:</span>
                <span className="font-semibold text-gray-900">
                  {deliverySync && !syncExceedsLimit
                    ? "Síncrono (inmediato)"
                    : "Asíncrono (cola en segundo plano)"}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setConfirmModalOpen(false)}
                disabled={sendMutation.isPending}
                className="border border-panel-200"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmBroadcast}
                disabled={sendMutation.isPending}
              >
                <Send size={14} />
                {sendMutation.isPending ? "Enviando…" : "Confirmar y enviar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DispatchResultCard({
  result,
  onInspectBatch,
}: {
  result: AdminDispatchResult;
  onInspectBatch: (batchId: string) => void;
}) {
  const isDryRun = Boolean(result.dryRun || result.mode === "dry_run");
  return (
    <Card className="border-panel-300 bg-panel-50/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-green-600" />
          <div>
            <div className="text-sm font-semibold text-gray-900">
              {isDryRun
                ? "Simulación completada (no se enviaron mensajes reales)"
                : result.message || "Envío procesado"}
            </div>
            {result.batchId && (
              <div className="text-xs text-gray-500">
                Batch ID:{" "}
                <span className="font-mono text-gray-700">{result.batchId}</span>
              </div>
            )}
          </div>
        </div>
        {result.batchId && !isDryRun && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onInspectBatch(result.batchId!)}
            className="border border-panel-200 bg-white text-xs"
          >
            Ver lote en Historial
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
        {result.status && (
          <div className="rounded bg-white p-2 border border-panel-200">
            <div className="text-gray-500">Estado</div>
            <div className="font-semibold uppercase text-gray-900">
              {result.status}
            </div>
          </div>
        )}
        {result.recipientsCount !== undefined && (
          <div className="rounded bg-white p-2 border border-panel-200">
            <div className="text-gray-500">Destinatarios</div>
            <div className="font-semibold text-gray-900">
              {result.recipientsCount}
            </div>
          </div>
        )}
        {result.totalDevices !== undefined && (
          <div className="rounded bg-white p-2 border border-panel-200">
            <div className="text-gray-500">Dispositivos Push</div>
            <div className="font-semibold text-gray-900">
              {result.totalDevices}
            </div>
          </div>
        )}
        {result.succeeded !== undefined && (
          <div className="rounded bg-white p-2 border border-panel-200">
            <div className="text-gray-500">Resultado síncrono</div>
            <div className="font-semibold text-gray-900">
              {result.succeeded} OK / {result.failed ?? 0} fallo(s)
            </div>
          </div>
        )}
        {result.jobsQueued !== undefined && (
          <div className="rounded bg-white p-2 border border-panel-200">
            <div className="text-gray-500">Trabajos encolados</div>
            <div className="font-semibold text-gray-900">
              {result.jobsQueued}
            </div>
          </div>
        )}
      </div>

      {result.channels && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(result.channels).map(([ch, chRes]) => (
            <div
              key={ch}
              className="rounded-lg border border-panel-200 bg-white p-2.5 text-xs"
            >
              <div className="font-semibold uppercase text-panel-800">
                Canal {ch}
              </div>
              {chRes?.error ? (
                <div className="mt-1 text-red-600">{chRes.error}</div>
              ) : (
                <div className="mt-1 space-y-0.5 text-gray-700">
                  {chRes?.recipientsCount !== undefined && (
                    <div>Destinatarios: {chRes.recipientsCount}</div>
                  )}
                  {chRes?.totalDevices !== undefined && (
                    <div>Dispositivos: {chRes.totalDevices}</div>
                  )}
                  {chRes?.jobsQueued !== undefined && (
                    <div>Encolados: {chRes.jobsQueued}</div>
                  )}
                  {chRes?.succeeded !== undefined && (
                    <div>
                      Entregados: {chRes.succeeded} / Fallidos:{" "}
                      {chRes.failed ?? 0}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {result.results && result.results.some((r) => !r.success) && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          <div className="font-semibold">Errores en entrega síncrona:</div>
          <ul className="mt-1 list-disc pl-4">
            {result.results
              .filter((r) => !r.success)
              .slice(0, 10)
              .map((r, i) => (
                <li key={i}>
                  {r.to || r.tokenPreview || "Destino"}: {r.error || r.errorCode}
                </li>
              ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
