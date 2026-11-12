import { Bell, Mail } from "lucide-react";
import type { AdminNotificationTarget } from "../../api/types";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import type { EmailComposerState } from "./EmailComposerSection";
import {
  deriveLinkedPushContent,
  type PushComposerState,
} from "./PushComposerSection";
import {
  formatTargetSummary,
  interpolateText,
  isValidHttpUrl,
  PUSH_TEMPLATE_CATALOG,
  type MergedEmailTemplateOption,
} from "./templateCatalogMeta";

type LivePreviewPanelProps = {
  channelMode: "email" | "push" | "multi";
  target: AdminNotificationTarget;
  emailState: EmailComposerState;
  pushState: PushComposerState;
  selectedEmailTpl?: MergedEmailTemplateOption;
};

export default function LivePreviewPanel({
  channelMode,
  target,
  emailState,
  pushState,
  selectedEmailTpl,
}: LivePreviewPanelProps) {
  const showEmail = channelMode === "email" || channelMode === "multi";
  const showPush = channelMode === "push" || channelMode === "multi";

  const recipientGreeting =
    target.type === "single" && target.name?.trim()
      ? ` ${target.name.trim()}`
      : "";

  const emailSubjectPreview =
    emailState.mode === "custom"
      ? emailState.subject.trim() || "(Sin asunto todavía)"
      : selectedEmailTpl?.subjectHint || selectedEmailTpl?.label || "Plantilla";

  const emailTitlePreview =
    emailState.title.trim() ||
    emailState.subject.trim() ||
    "Comunicado YouConnext";

  const paragraphs = emailState.message
    .split(/\r?\n\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const validCta =
    Boolean(emailState.ctaText.trim()) && isValidHttpUrl(emailState.ctaUrl);

  // Push preview values
  const effectivePush = (() => {
    if (channelMode === "multi" && pushState.linkedToEmail) {
      const derived = deriveLinkedPushContent(emailState, selectedEmailTpl);
      return {
        title: interpolateText(derived.title, derived.templateData),
        body: interpolateText(derived.body, derived.templateData),
        priority: pushState.priority,
      };
    }

    if (pushState.mode === "template") {
      const tpl = PUSH_TEMPLATE_CATALOG.find(
        (t) => t.name === pushState.template,
      );
      return {
        title: tpl
          ? interpolateText(tpl.titleTemplate, pushState.templateData)
          : pushState.template,
        body: tpl
          ? interpolateText(tpl.bodyTemplate, pushState.templateData)
          : "",
        priority: pushState.priority,
      };
    }

    return {
      title: pushState.title.trim() || "Título de la notificación",
      body:
        pushState.body.trim() ||
        "Aquí aparecerá el cuerpo de la notificación en la pantalla del móvil.",
      priority: pushState.priority,
    };
  })();

  const pushExtraPairs = pushState.dataEntries.filter(
    (d) => d.key.trim() && d.value.trim(),
  );

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <Card>
        <CardTitle>Vista previa en vivo</CardTitle>
        <CardSubtitle>
          Destinatarios:{" "}
          <span className="font-medium text-panel-900">
            {formatTargetSummary(target)}
          </span>
        </CardSubtitle>

        {showEmail && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Mail size={13} /> Correo electrónico
              </span>
              <span className="truncate max-w-[200px] text-gray-500">
                {emailSubjectPreview}
              </span>
            </div>

            {emailState.mode === "custom" ? (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-[#f4f7fa] p-3">
                <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                  <div className="bg-[#2563eb] px-5 py-4 text-center">
                    <div className="text-base font-bold text-white">
                      YouConnext
                    </div>
                  </div>
                  <div className="space-y-3 p-5 text-sm">
                    <div className="text-base font-bold text-[#1e293b]">
                      {emailTitlePreview}
                    </div>
                    <p className="text-xs text-[#334155]">
                      Hola{recipientGreeting},
                    </p>
                    {paragraphs.length > 0 ? (
                      paragraphs.map((p, idx) => (
                        <p
                          key={idx}
                          className="whitespace-pre-line text-xs leading-relaxed text-[#475569]"
                        >
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs italic text-gray-400">
                        Escribe un mensaje para previsualizar el contenido…
                      </p>
                    )}

                    {validCta && (
                      <div className="pt-2 text-center">
                        <span className="inline-block rounded-lg bg-[#2563eb] px-4 py-2 text-xs font-semibold text-white">
                          {emailState.ctaText}
                        </span>
                      </div>
                    )}

                    <p className="pt-2 text-[11px] text-[#94a3b8]">
                      Comunicado enviado por el equipo de administración de
                      YouConnext.
                    </p>
                  </div>
                  <div className="bg-[#f8fafc] px-5 py-2.5 text-center text-[11px] text-[#94a3b8]">
                    © 2026 YouConnext. Todos los derechos reservados.
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-panel-200 bg-panel-50/70 p-3.5 text-xs">
                <div className="font-semibold text-panel-900">
                  Plantilla: {selectedEmailTpl?.label ?? emailState.template}
                </div>
                <p className="mt-0.5 text-gray-600">
                  {selectedEmailTpl?.description}
                </p>
                {selectedEmailTpl &&
                  selectedEmailTpl.requiredFields.length > 0 && (
                    <div className="mt-3 space-y-1 rounded-lg border border-panel-200 bg-white p-2.5">
                      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
                        Variables inyectadas
                      </div>
                      {selectedEmailTpl.requiredFields.map((k) => (
                        <div
                          key={k}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-mono text-gray-500">{k}</span>
                          <span className="truncate font-medium text-gray-900">
                            {emailState.templateData[k] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {showPush && (
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-gray-600">
              <span className="inline-flex items-center gap-1">
                <Bell size={13} /> Banner Móvil Push
              </span>
              <span className="rounded bg-panel-100 px-1.5 py-0.5 text-[10px] uppercase text-panel-800">
                {effectivePush.priority}
              </span>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-slate-900 p-3 shadow-sm">
              <div className="rounded-xl bg-white/95 p-3 shadow">
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-800">
                    <img
                      src="/logo.png"
                      alt="YouConnext"
                      className="h-4 w-4 rounded object-contain"
                    />
                    YouConnext
                  </div>
                  <span>ahora</span>
                </div>
                <div className="mt-1 text-xs font-semibold text-gray-900">
                  {effectivePush.title}
                </div>
                <div className="mt-0.5 whitespace-pre-line text-xs text-gray-700">
                  {effectivePush.body || "…"}
                </div>
              </div>

              {pushExtraPairs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1 px-1">
                  {pushExtraPairs.map((pair) => (
                    <span
                      key={pair.id}
                      className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200"
                    >
                      {pair.key}={pair.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
