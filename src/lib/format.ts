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

export function formatMeters(meters?: number | null) {
  if (meters === null || meters === undefined || !Number.isFinite(meters)) {
    return "-";
  }
  if (meters >= 1000) {
    return `${Math.round((meters / 1000) * 100) / 100} km`;
  }
  return `${Math.round(meters)} m`;
}
