import clsx from "clsx";

type BadgeStyle = {
  label: string;
  className: string;
};

const MATCH_STATUS_META: Record<string, BadgeStyle> = {
  MATCHED: {
    label: "Coincide",
    className: "bg-green-100 text-green-700",
  },
  NOT_MATCHED: {
    label: "No coincide",
    className: "bg-red-100 text-red-700",
  },
  INSUFFICIENT_DATA: {
    label: "Datos insuficientes",
    className: "bg-amber-100 text-amber-800",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-200 text-red-900",
  },
};

const CAE_SPATIAL_STATUS_META: Record<string, BadgeStyle> = {
  OK: {
    label: "OK",
    className: "bg-green-100 text-green-700",
  },
  WARNING: {
    label: "Advertencia",
    className: "bg-amber-100 text-amber-800",
  },
  FAILED: {
    label: "Fallido",
    className: "bg-red-100 text-red-700",
  },
  NO_DATA: {
    label: "Sin datos",
    className: "bg-gray-100 text-gray-700",
  },
  PENDING: {
    label: "Pendiente",
    className: "bg-blue-100 text-blue-700",
  },
};

const FALLBACK_STYLE: BadgeStyle = {
  label: "Desconocido",
  className: "bg-gray-100 text-gray-700",
};

/**
 * Badge unificado para estados de coincidencia espacial y validación espacial de CAE.
 */
export default function SpatialStatusBadge({
  type,
  status,
  title,
  className,
}: {
  type: "match" | "cae";
  status?: string | null;
  title?: string;
  className?: string;
}) {
  const table = type === "match" ? MATCH_STATUS_META : CAE_SPATIAL_STATUS_META;
  const meta = (status ? table[status] : undefined) ?? {
    label: status || FALLBACK_STYLE.label,
    className: FALLBACK_STYLE.className,
  };

  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
