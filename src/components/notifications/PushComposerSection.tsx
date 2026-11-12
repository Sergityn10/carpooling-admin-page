import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Link2,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import clsx from "clsx";
import type { NotificationPriority } from "../../api/types";
import Button from "../ui/Button";
import { Card, CardSubtitle, CardTitle } from "../ui/Card";
import Input from "../ui/Input";
import type { EmailComposerState } from "./EmailComposerSection";
import {
  buildExampleDataForFields,
  getFieldDescriptor,
  PUSH_DEEP_LINK_PRESETS,
  PUSH_TEMPLATE_CATALOG,
  type MergedEmailTemplateOption,
} from "./templateCatalogMeta";

export type PushKeyValueEntry = {
  id: string;
  key: string;
  value: string;
};

export type PushComposerState = {
  linkedToEmail: boolean;
  mode: "custom" | "template";
  title: string;
  body: string;
  priority: NotificationPriority;
  template: string;
  templateData: Record<string, string>;
  channelId: string;
  badge: string;
  dataEntries: PushKeyValueEntry[];
};

export function deriveLinkedPushContent(
  emailState: EmailComposerState,
  selectedEmailTpl?: MergedEmailTemplateOption,
): {
  mode: "custom" | "template";
  template?: string;
  title: string;
  body: string;
  templateData: Record<string, string>;
} {
  if (emailState.mode === "template") {
    const matchingPush = PUSH_TEMPLATE_CATALOG.find(
      (p) => p.name === emailState.template,
    );
    if (matchingPush) {
      return {
        mode: "template",
        template: matchingPush.name,
        title: matchingPush.titleTemplate,
        body: matchingPush.bodyTemplate,
        templateData: emailState.templateData,
      };
    }

    return {
      mode: "custom",
      title: selectedEmailTpl?.label || "Comunicado YouConnext",
      body:
        selectedEmailTpl?.description ||
        "Tienes una nueva notificación importante en tu correo.",
      templateData: {},
    };
  }

  return {
    mode: "custom",
    title:
      emailState.title.trim() ||
      emailState.subject.trim() ||
      "Comunicado YouConnext",
    body: emailState.message.trim(),
    templateData: {},
  };
}

type PushComposerSectionProps = {
  value: PushComposerState;
  onChange: (next: PushComposerState) => void;
  isMultiChannel: boolean;
  emailState?: EmailComposerState;
  selectedEmailTpl?: MergedEmailTemplateOption;
};

export default function PushComposerSection({
  value,
  onChange,
  isMultiChannel,
  emailState,
  selectedEmailTpl,
}: PushComposerSectionProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const selectedPushTpl = useMemo(
    () => PUSH_TEMPLATE_CATALOG.find((t) => t.name === value.template),
    [value.template],
  );

  const linkedPreview = useMemo(() => {
    if (!isMultiChannel || !value.linkedToEmail || !emailState) return null;
    return deriveLinkedPushContent(emailState, selectedEmailTpl);
  }, [isMultiChannel, value.linkedToEmail, emailState, selectedEmailTpl]);

  const showCustomEditor = !isMultiChannel || !value.linkedToEmail;

  const upsertDataEntry = (key: string, val: string) => {
    const existingIdx = value.dataEntries.findIndex(
      (item) => item.key.trim() === key,
    );
    if (existingIdx >= 0) {
      const next = [...value.dataEntries];
      next[existingIdx] = { ...next[existingIdx], value: val };
      onChange({ ...value, dataEntries: next });
      return;
    }
    onChange({
      ...value,
      dataEntries: [
        ...value.dataEntries,
        { id: `${key}-${Date.now()}`, key, value: val },
      ],
    });
  };

  const addEmptyDataRow = () => {
    onChange({
      ...value,
      dataEntries: [
        ...value.dataEntries,
        { id: `row-${Date.now()}-${Math.random()}`, key: "", value: "" },
      ],
    });
  };

  const updateDataRow = (id: string, field: "key" | "value", nextVal: string) => {
    onChange({
      ...value,
      dataEntries: value.dataEntries.map((row) =>
        row.id === id ? { ...row, [field]: nextVal } : row,
      ),
    });
  };

  const removeDataRow = (id: string) => {
    onChange({
      ...value,
      dataEntries: value.dataEntries.filter((row) => row.id !== id),
    });
  };

  const handleFillPushExample = () => {
    if (!selectedPushTpl) return;
    onChange({
      ...value,
      templateData: {
        ...value.templateData,
        ...buildExampleDataForFields(selectedPushTpl.fields),
      },
    });
  };

  const currentScreen =
    value.dataEntries.find((e) => e.key.trim() === "screen")?.value ?? "";

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-panel-700" />
            <CardTitle>Notificación Push (FCM)</CardTitle>
          </div>
          <CardSubtitle>
            Envío a dispositivos Android, iOS y Web registrados con Firebase Cloud Messaging
          </CardSubtitle>
        </div>

        {showCustomEditor && (
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
              Push personalizado
            </button>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  mode: "template",
                  template: value.template || PUSH_TEMPLATE_CATALOG[0].name,
                })
              }
              className={clsx(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                value.mode === "template"
                  ? "bg-white text-panel-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              Plantilla Push
            </button>
          </div>
        )}
      </div>

      {/* Multi-channel sync banner */}
      {isMultiChannel && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-panel-200 bg-panel-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-xs text-panel-900">
            <Link2 size={14} className="shrink-0 text-panel-700" />
            <span>
              {value.linkedToEmail
                ? "Push vinculado al contenido del Email automáticamente."
                : "Push independiente: puedes personalizar título, cuerpo o usar plantilla Push."}
            </span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-panel-900">
            <input
              type="checkbox"
              checked={!value.linkedToEmail}
              onChange={(e) => {
                const separate = e.target.checked;
                if (separate && linkedPreview && !value.title && !value.body) {
                  onChange({
                    ...value,
                    linkedToEmail: false,
                    mode: linkedPreview.mode,
                    template: linkedPreview.template ?? value.template,
                    title: linkedPreview.title,
                    body: linkedPreview.body,
                    templateData: linkedPreview.templateData,
                  });
                } else {
                  onChange({ ...value, linkedToEmail: !separate });
                }
              }}
              className="h-4 w-4 rounded border-panel-300 text-panel-700"
            />
            Personalizar Push por separado
          </label>
        </div>
      )}

      {!showCustomEditor && linkedPreview ? (
        <div className="mt-3 space-y-2 rounded-lg border border-panel-200 bg-white p-3 text-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span>Texto Push derivado automáticamente del correo</span>
            <span className="rounded bg-panel-100 px-2 py-0.5 text-[11px] font-medium text-panel-800">
              {linkedPreview.mode === "template"
                ? `Plantilla: ${linkedPreview.template}`
                : "Personalizado"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Título: </span>
            <span className="text-gray-700">{linkedPreview.title || "-"}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Cuerpo: </span>
            <span className="line-clamp-3 text-gray-700">
              {linkedPreview.body || "(Escribe un mensaje en Email)"}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {value.mode === "custom" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Título de la notificación *
                  </label>
                  <Input
                    value={value.title}
                    onChange={(e) =>
                      onChange({ ...value, title: e.target.value })
                    }
                    placeholder="Ej. Actualización disponible"
                    maxLength={150}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Prioridad
                  </label>
                  <select
                    value={value.priority}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        priority: e.target.value as NotificationPriority,
                      })
                    }
                    className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none focus:border-panel-500"
                  >
                    <option value="high">Alta (high)</option>
                    <option value="normal">Normal (normal)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
                    Mensaje de la notificación *
                  </label>
                  <span className="text-[11px] text-gray-500">
                    {value.body.length} caracteres
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={value.body}
                  onChange={(e) => onChange({ ...value, body: e.target.value })}
                  placeholder="Mensaje breve y directo para la pantalla bloqueada del dispositivo…"
                  className="w-full rounded-lg border border-panel-200 px-3 py-2 text-sm outline-none focus:border-panel-500"
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-[240px] flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Plantilla Push *
                  </label>
                  <select
                    value={value.template}
                    onChange={(e) =>
                      onChange({ ...value, template: e.target.value })
                    }
                    className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none focus:border-panel-500"
                  >
                    {PUSH_TEMPLATE_CATALOG.map((tpl) => (
                      <option key={tpl.name} value={tpl.name}>
                        {tpl.label} ({tpl.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-40">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Prioridad
                  </label>
                  <select
                    value={value.priority}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        priority: e.target.value as NotificationPriority,
                      })
                    }
                    className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none focus:border-panel-500"
                  >
                    <option value="high">Alta (high)</option>
                    <option value="normal">Normal (normal)</option>
                  </select>
                </div>
              </div>

              {selectedPushTpl && (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-panel-200 bg-panel-50 px-3 py-2 text-xs">
                    <span className="text-gray-700">
                      {selectedPushTpl.description}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleFillPushExample}
                      className="border border-panel-200 bg-white px-2.5 py-1 text-xs"
                    >
                      <Wand2 size={13} />
                      Rellenar ejemplo
                    </Button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {selectedPushTpl.fields.map((fieldKey) => {
                      const desc = getFieldDescriptor(fieldKey);
                      return (
                        <div key={fieldKey}>
                          <label className="mb-1 block text-xs font-medium text-gray-700">
                            {desc.label} *
                          </label>
                          <Input
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
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Collapsible Advanced Push Data Section */}
          <div className="rounded-lg border border-panel-200 bg-panel-50/40">
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex w-full items-center justify-between px-3 py-2.5 text-left text-xs font-medium text-gray-700 hover:bg-panel-50"
            >
              <span>
                Datos avanzados (Push data, deep links, channelId, badge)
              </span>
              {advancedOpen ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>

            {advancedOpen && (
              <div className="space-y-3 border-t border-panel-200 p-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Acceso rápido de pantalla (`screen`)
                    </label>
                    <select
                      value={currentScreen}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        upsertDataEntry("screen", e.target.value);
                      }}
                      className="w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-xs outline-none focus:border-panel-500"
                    >
                      <option value="">Seleccionar ruta de app…</option>
                      {PUSH_DEEP_LINK_PRESETS.map((p) => (
                        <option key={p.screen} value={p.screen}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Channel ID (Android)
                    </label>
                    <Input
                      value={value.channelId}
                      onChange={(e) =>
                        onChange({ ...value, channelId: e.target.value })
                      }
                      placeholder="default"
                      className="bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Badge (iOS opcional)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={value.badge}
                      onChange={(e) =>
                        onChange({ ...value, badge: e.target.value })
                      }
                      placeholder="Ej. 1"
                      className="bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">
                      Pares clave-valor extra (`data`)
                    </span>
                    <button
                      type="button"
                      onClick={addEmptyDataRow}
                      className="inline-flex items-center gap-1 rounded border border-panel-200 bg-white px-2 py-1 text-xs font-medium text-panel-800 hover:bg-panel-50"
                    >
                      <Plus size={12} />
                      Añadir parámetro
                    </button>
                  </div>

                  {value.dataEntries.length === 0 ? (
                    <div className="text-xs text-gray-500">
                      Sin parámetros adicionales configurados.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {value.dataEntries.map((row) => (
                        <div key={row.id} className="flex items-center gap-2">
                          <Input
                            value={row.key}
                            onChange={(e) =>
                              updateDataRow(row.id, "key", e.target.value)
                            }
                            placeholder="clave (ej. tripId)"
                            className="bg-white text-xs"
                          />
                          <Input
                            value={row.value}
                            onChange={(e) =>
                              updateDataRow(row.id, "value", e.target.value)
                            }
                            placeholder="valor"
                            className="bg-white text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => removeDataRow(row.id)}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            aria-label="Eliminar parámetro"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
