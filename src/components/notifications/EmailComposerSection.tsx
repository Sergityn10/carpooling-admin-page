import { useMemo } from "react";
import { Mail, Sparkles, Wand2 } from "lucide-react";
import clsx from "clsx";
import type { EmailTemplateMeta, NotificationCatalogItem } from "../../api/types";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import Input from "../ui/Input";
import {
  buildEmailTemplateOptions,
  buildExampleDataForFields,
  getFieldDescriptor,
  isValidHttpUrl,
  type MergedEmailTemplateOption,
} from "./templateCatalogMeta";

export type EmailComposerMode = "custom" | "template";

export type EmailComposerState = {
  mode: EmailComposerMode;
  subject: string;
  title: string;
  message: string;
  ctaText: string;
  ctaUrl: string;
  template: string;
  templateData: Record<string, string>;
};

type EmailComposerSectionProps = {
  value: EmailComposerState;
  onChange: (next: EmailComposerState) => void;
  templatesMeta: EmailTemplateMeta[];
  catalogItems: NotificationCatalogItem[];
  loadingTemplates: boolean;
};

export default function EmailComposerSection({
  value,
  onChange,
  templatesMeta,
  catalogItems,
  loadingTemplates,
}: EmailComposerSectionProps) {
  const templateOptions = useMemo(
    () => buildEmailTemplateOptions(templatesMeta, catalogItems),
    [templatesMeta, catalogItems],
  );

  const accountTemplates = useMemo(
    () => templateOptions.filter((t) => t.category === "account"),
    [templateOptions],
  );
  const tripTemplates = useMemo(
    () => templateOptions.filter((t) => t.category === "trips"),
    [templateOptions],
  );

  const selectedTemplateMeta: MergedEmailTemplateOption | undefined = useMemo(
    () => templateOptions.find((t) => t.name === value.template),
    [templateOptions, value.template],
  );

  const handleSelectTemplate = (tplName: string) => {
    const meta = templateOptions.find((t) => t.name === tplName);
    const nextData: Record<string, string> = {};
    if (meta) {
      for (const field of meta.requiredFields) {
        if (value.templateData[field]) {
          nextData[field] = value.templateData[field];
        }
      }
    }
    onChange({
      ...value,
      mode: "template",
      template: tplName,
      templateData: nextData,
    });
  };

  const handleFillExampleData = () => {
    if (!selectedTemplateMeta) return;
    onChange({
      ...value,
      templateData: {
        ...value.templateData,
        ...buildExampleDataForFields(selectedTemplateMeta.requiredFields),
      },
    });
  };

  const ctaUrlInvalid =
    Boolean(value.ctaUrl.trim()) && !isValidHttpUrl(value.ctaUrl);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-panel-700" />
            <CardTitle>Contenido del Correo Electrónico</CardTitle>
          </div>
          <CardSubtitle>
            Redacta un comunicado corporativo YouConnext o usa una plantilla del sistema
          </CardSubtitle>
        </div>

        {/* Mode toggle: Personalizado vs Plantilla */}
        <div className="inline-flex rounded-lg border border-panel-200 bg-panel-50 p-0.5">
          <button
            type="button"
            onClick={() => onChange({ ...value, mode: "custom" })}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              value.mode === "custom"
                ? "bg-white text-panel-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            Personalizado YouConnext
          </button>
          <button
            type="button"
            onClick={() => {
              const fallbackTpl =
                value.template || templateOptions[0]?.name || "welcome";
              onChange({
                ...value,
                mode: "template",
                template: fallbackTpl,
              });
            }}
            className={clsx(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              value.mode === "template"
                ? "bg-white text-panel-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900",
            )}
          >
            Plantilla del catálogo
          </button>
        </div>
      </div>

      {value.mode === "custom" ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Asunto del correo *
              </label>
              <Input
                value={value.subject}
                onChange={(e) => onChange({ ...value, subject: e.target.value })}
                placeholder="Ej. Novedades importantes en YouConnext"
                maxLength={300}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Título visible dentro del correo (opcional)
              </label>
              <Input
                value={value.title}
                onChange={(e) => onChange({ ...value, title: e.target.value })}
                placeholder="Si se omite, se usa el asunto"
                maxLength={200}
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">
                Cuerpo del mensaje *
              </label>
              <span className="text-[11px] text-gray-500">
                Saludo automático &quot;Hola [Nombre],&quot; · {value.message.length}/8000
              </span>
            </div>
            <textarea
              rows={6}
              maxLength={8000}
              value={value.message}
              onChange={(e) => onChange({ ...value, message: e.target.value })}
              placeholder="Escribe aquí el comunicado para los usuarios. Los saltos de línea se formatean automáticamente en párrafos seguros."
              className="w-full rounded-lg border border-panel-200 px-3 py-2 text-sm outline-none focus:border-panel-500"
            />
          </div>

          <div className="rounded-lg border border-panel-200 bg-panel-50/50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-700">
              <Sparkles size={13} className="text-panel-700" />
              Botón de acción / CTA (opcional)
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  Texto del botón
                </label>
                <Input
                  value={value.ctaText}
                  onChange={(e) => onChange({ ...value, ctaText: e.target.value })}
                  placeholder="Ej. Abrir YouConnext"
                  maxLength={80}
                  className="bg-white"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  URL de destino (http:// o https://)
                </label>
                <Input
                  type="url"
                  value={value.ctaUrl}
                  onChange={(e) => onChange({ ...value, ctaUrl: e.target.value })}
                  placeholder="https://youconnext.com"
                  className={clsx("bg-white", ctaUrlInvalid && "border-red-500")}
                />
                {ctaUrlInvalid && (
                  <p className="mt-1 text-xs text-red-600">
                    La URL debe empezar por http:// o https://
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {loadingTemplates && templateOptions.length === 0 ? (
            <div className="text-xs text-gray-500">
              Cargando catálogo de plantillas desde el servidor…
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Plantilla del catálogo *
                </label>
                <select
                  value={value.template}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none focus:border-panel-500"
                >
                  {accountTemplates.length > 0 && (
                    <optgroup label="Cuenta y Organización">
                      {accountTemplates.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.label} ({t.name})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {tripTemplates.length > 0 && (
                    <optgroup label="Viajes y Reservas">
                      {tripTemplates.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.label} ({t.name})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {selectedTemplateMeta && (
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-panel-200 bg-panel-50 px-3 py-2 text-xs">
                    <div>
                      <div className="font-medium text-panel-900">
                        {selectedTemplateMeta.description}
                      </div>
                      {selectedTemplateMeta.subjectHint && (
                        <div className="text-gray-500">
                          Asunto de plantilla: {selectedTemplateMeta.subjectHint}
                        </div>
                      )}
                    </div>
                    {selectedTemplateMeta.requiredFields.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleFillExampleData}
                        className="border border-panel-200 bg-white px-2.5 py-1 text-xs"
                      >
                        <Wand2 size={13} />
                        Rellenar ejemplo
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {selectedTemplateMeta &&
              selectedTemplateMeta.requiredFields.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-700">
                    Variables requeridas por la plantilla
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedTemplateMeta.requiredFields.map((fieldKey) => {
                      const desc = getFieldDescriptor(fieldKey);
                      return (
                        <div key={fieldKey}>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            {desc.label} *{" "}
                            <span className="font-normal text-gray-400">
                              ({`{{${fieldKey}}}`})
                            </span>
                          </label>
                          <Input
                            type={desc.type ?? "text"}
                            value={value.templateData[fieldKey] ?? ""}
                            onChange={(e) =>
                              onChange({
                                ...value,
                                templateData: {
                                  ...value.templateData,
                                  [fieldKey]: e.target.value,
                                },
                              })
                            }
                            placeholder={desc.placeholder}
                          />
                          {desc.helper && (
                            <p className="mt-0.5 text-[11px] text-gray-500">
                              {desc.helper}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-500">
                  Esta plantilla no requiere variables adicionales.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
