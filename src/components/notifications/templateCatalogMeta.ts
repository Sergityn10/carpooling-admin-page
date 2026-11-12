import type {
  AdminNotificationTarget,
  EmailTemplateMeta,
  NotificationCatalogItem,
} from "../../api/types";

export type TemplateCategory = "account" | "trips";

export type FieldDescriptor = {
  key: string;
  label: string;
  placeholder: string;
  example: string;
  helper?: string;
  type?: "text" | "url" | "email";
};

export const FIELD_DESCRIPTORS: Record<string, FieldDescriptor> = {
  name: {
    key: "name",
    label: "Nombre del usuario",
    placeholder: "Ej. Carlos",
    example: "Carlos",
    helper: "Si el destinatario tiene nombre, se usará como saludo.",
  },
  userName: {
    key: "userName",
    label: "Nombre del destinatario",
    placeholder: "Ej. Laura Gómez",
    example: "Usuario YouConnext",
    helper: "Respaldo si el destinatario no tiene nombre propio.",
  },
  driverName: {
    key: "driverName",
    label: "Nombre del conductor",
    placeholder: "Ej. Marta Ruiz",
    example: "Marta Ruiz",
  },
  passengerName: {
    key: "passengerName",
    label: "Nombre del pasajero",
    placeholder: "Ej. Javier López",
    example: "Javier López",
  },
  origin: {
    key: "origin",
    label: "Origen",
    placeholder: "Ej. Madrid",
    example: "Madrid",
  },
  destination: {
    key: "destination",
    label: "Destino",
    placeholder: "Ej. Valencia",
    example: "Valencia",
  },
  date: {
    key: "date",
    label: "Fecha",
    placeholder: "Ej. 15/11/2026",
    example: "15/11/2026",
  },
  time: {
    key: "time",
    label: "Hora",
    placeholder: "Ej. 08:30",
    example: "08:30",
  },
  seats: {
    key: "seats",
    label: "Plazas",
    placeholder: "Ej. 3",
    example: "3",
  },
  seatsRequested: {
    key: "seatsRequested",
    label: "Plazas solicitadas",
    placeholder: "Ej. 2",
    example: "2",
  },
  seatsBooked: {
    key: "seatsBooked",
    label: "Plazas reservadas",
    placeholder: "Ej. 1",
    example: "1",
  },
  seatsRemaining: {
    key: "seatsRemaining",
    label: "Plazas restantes",
    placeholder: "Ej. 2",
    example: "2",
  },
  price: {
    key: "price",
    label: "Precio",
    placeholder: "Ej. 14.50 €",
    example: "14.50 €",
  },
  passengers: {
    key: "passengers",
    label: "Pasajeros",
    placeholder: "Ej. 2",
    example: "2",
  },
  earnings: {
    key: "earnings",
    label: "Ingresos estimados",
    placeholder: "Ej. 29.00 €",
    example: "29.00 €",
  },
  tripId: {
    key: "tripId",
    label: "ID del trayecto",
    placeholder: "Ej. trip_12345",
    example: "trip_demo_001",
  },
  reason: {
    key: "reason",
    label: "Motivo de cancelación",
    placeholder: "Ej. Cambio de horario del conductor",
    example: "Reprogramación operativa",
  },
  resetUrl: {
    key: "resetUrl",
    label: "URL de restablecimiento",
    placeholder: "https://app.youconnext.com/reset-password?token=...",
    example: "https://youconnext.com/reset-password?token=demo",
    type: "url",
  },
  enterpriseName: {
    key: "enterpriseName",
    label: "Nombre de la organización",
    placeholder: "Ej. Universidad Politécnica",
    example: "Organización Demo",
  },
  roleTitle: {
    key: "roleTitle",
    label: "Rol asignado",
    placeholder: "Ej. Miembro / Conductor",
    example: "Miembro verificado",
  },
  invitationLink: {
    key: "invitationLink",
    label: "Enlace de invitación",
    placeholder: "https://app.youconnext.com/invite/...",
    example: "https://youconnext.com/invite/demo",
    type: "url",
  },
  companyName: {
    key: "companyName",
    label: "Nombre de la empresa",
    placeholder: "Ej. Acme Mobility",
    example: "Acme Mobility",
  },
  companyEmail: {
    key: "companyEmail",
    label: "Email de contacto de empresa",
    placeholder: "contacto@empresa.com",
    example: "contacto@empresa.com",
    type: "email",
  },
  userEmail: {
    key: "userEmail",
    label: "Email del usuario solicitante",
    placeholder: "usuario@youconnext.com",
    example: "usuario@youconnext.com",
    type: "email",
  },
  adminUrl: {
    key: "adminUrl",
    label: "URL del panel admin",
    placeholder: "https://admin.youconnext.com/sugerencias",
    example: "https://admin.youconnext.com/sugerencias",
    type: "url",
  },
};

const TEMPLATE_CATEGORY_MAP: Record<string, TemplateCategory> = {
  welcome: "account",
  enterprise_invitation: "account",
  password_reset: "account",
  suggestion_received: "account",
  trip_confirmation: "trips",
  trip_cancelled: "trips",
  booking_request: "trips",
  trip_completed: "trips",
  trip_started: "trips",
  trip_booked: "trips",
  trip_alert_matched: "trips",
};

const TEMPLATE_LABELS: Record<string, string> = {
  welcome: "Bienvenida a YouConnext",
  enterprise_invitation: "Invitación a organización",
  password_reset: "Restablecimiento de contraseña",
  suggestion_received: "Sugerencia de empresa recibida",
  trip_confirmation: "Confirmación de viaje",
  trip_cancelled: "Viaje cancelado",
  booking_request: "Nueva solicitud de reserva",
  trip_completed: "Viaje completado",
  trip_started: "Viaje iniciado",
  trip_booked: "Reserva confirmada",
  trip_alert_matched: "Alerta de trayecto compatible",
};

export type PushTemplateDescriptor = {
  name: string;
  label: string;
  description: string;
  titleTemplate: string;
  bodyTemplate: string;
  fields: string[];
};

export const PUSH_TEMPLATE_CATALOG: PushTemplateDescriptor[] = [
  {
    name: "trip_alert_matched",
    label: "Alerta de trayecto compatible",
    description: "Avisa sobre un nuevo trayecto que coincide con búsquedas.",
    titleTemplate: "¡Nuevo viaje {{origin}} → {{destination}}! 🚗",
    bodyTemplate:
      "Sale el {{date}} a las {{time}} desde {{price}}. ¡Échale un vistazo antes de que se llene!",
    fields: ["origin", "destination", "date", "time", "price", "tripId"],
  },
  {
    name: "trip_booked",
    label: "Nueva reserva en tu viaje",
    description: "Notifica al conductor cuando un pasajero reserva plaza.",
    titleTemplate: "Nueva reserva en tu viaje 🧑‍🤝‍🧑",
    bodyTemplate:
      "{{passengerName}} ha reservado {{seatsBooked}} asiento(s) en tu viaje {{origin}} → {{destination}}.",
    fields: ["passengerName", "seatsBooked", "origin", "destination", "tripId"],
  },
  {
    name: "trip_started",
    label: "El viaje ha comenzado",
    description: "Aviso inmediato al iniciar el trayecto.",
    titleTemplate: "El viaje ha comenzado 🚗",
    bodyTemplate:
      "Tu viaje {{origin}} → {{destination}} ha empezado. ¡Buen camino!",
    fields: ["origin", "destination", "tripId"],
  },
  {
    name: "trip_completed",
    label: "Viaje completado",
    description: "Resumen y agradecimiento al finalizar el trayecto.",
    titleTemplate: "Viaje completado 🎉",
    bodyTemplate:
      "Hola {{userName}}, tu viaje {{origin}} → {{destination}} ha finalizado. ¡Gracias por usar YouConnext!",
    fields: ["userName", "origin", "destination", "tripId"],
  },
];

export const PUSH_DEEP_LINK_PRESETS: Array<{ label: string; screen: string }> = [
  { label: "Inicio (Home)", screen: "Home" },
  { label: "Mis viajes (Trips)", screen: "Trips" },
  { label: "Detalle de viaje (TripDetail)", screen: "TripDetail" },
  { label: "Organizaciones (Organizations)", screen: "Organizations" },
  { label: "Monedero (Wallet)", screen: "Wallet" },
  { label: "Perfil (Profile)", screen: "Profile" },
];

export type MergedEmailTemplateOption = {
  name: string;
  label: string;
  category: TemplateCategory;
  description: string;
  subjectHint: string;
  requiredFields: string[];
};

export function buildEmailTemplateOptions(
  templates: EmailTemplateMeta[] = [],
  catalog: NotificationCatalogItem[] = [],
): MergedEmailTemplateOption[] {
  const catalogByType = new Map(catalog.map((c) => [c.type, c]));
  const seen = new Set<string>();
  const options: MergedEmailTemplateOption[] = [];

  for (const tpl of templates) {
    if (!tpl.name || tpl.name === "admin_custom") continue;
    seen.add(tpl.name);
    const cat = catalogByType.get(tpl.name);
    options.push({
      name: tpl.name,
      label: TEMPLATE_LABELS[tpl.name] ?? tpl.name,
      category: TEMPLATE_CATEGORY_MAP[tpl.name] ?? "account",
      description: cat?.description ?? "Plantilla de correo del sistema",
      subjectHint: tpl.subject ?? "",
      requiredFields: cat?.requiredFields ?? [],
    });
  }

  for (const cat of catalog) {
    const tplName = cat.emailTemplate || cat.type;
    if (!tplName || tplName === "admin_custom" || seen.has(tplName)) continue;
    seen.add(tplName);
    options.push({
      name: tplName,
      label: TEMPLATE_LABELS[tplName] ?? tplName,
      category: TEMPLATE_CATEGORY_MAP[tplName] ?? "account",
      description: cat.description,
      subjectHint: "",
      requiredFields: cat.requiredFields ?? [],
    });
  }

  return options;
}

export function getFieldDescriptor(key: string): FieldDescriptor {
  return (
    FIELD_DESCRIPTORS[key] ?? {
      key,
      label: key,
      placeholder: `Valor para ${key}`,
      example: `Demo ${key}`,
    }
  );
}

export function buildExampleDataForFields(fields: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of fields) {
    out[key] = getFieldDescriptor(key).example;
  }
  return out;
}

export function interpolateText(
  text: string,
  data: Record<string, string | number | boolean | undefined>,
): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const val = data[key];
    return val !== undefined && val !== null && String(val) !== ""
      ? String(val)
      : `{{${key}}}`;
  });
}

export function isValidHttpUrl(rawUrl: string): boolean {
  if (!rawUrl.trim()) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatTargetSummary(target?: AdminNotificationTarget | null): string {
  if (!target || !target.type) return "Sin definir";
  if (target.type === "all") return "Todos los usuarios";
  if (target.type === "single") {
    return target.email || target.userId || target.token || "Usuario único";
  }
  if (target.type === "users") {
    const total =
      (target.userIds?.length ?? 0) +
      (target.emails?.length ?? 0) +
      (target.tokens?.length ?? 0);
    return `Selección múltiple (${total})`;
  }
  if (target.type === "filter") {
    const parts: string[] = [];
    if (target.role) parts.push(`rol: ${target.role}`);
    if (target.platform && target.platform !== "all") {
      parts.push(`plataforma: ${target.platform}`);
    }
    return parts.length > 0 ? `Filtro (${parts.join(", ")})` : "Filtro general";
  }
  return target.type;
}
