import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDateTime(iso?: string | null) {
  if (!iso) return "-";
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

export function formatRelative(iso?: string | null) {
  if (!iso) return "-";
  const d = parseISO(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return formatDistanceToNowStrict(d, { addSuffix: true, locale: es });
}

export function formatKm(km?: number | null) {
  if (km === null || km === undefined) return "-";
  return `${Math.round(km * 100) / 100} km`;
}
