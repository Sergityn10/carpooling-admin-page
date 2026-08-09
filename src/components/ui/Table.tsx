import type { PropsWithChildren } from "react";
import clsx from "clsx";

export function Table({ children }: PropsWithChildren) {
  return (
    <div className="overflow-x-auto rounded-xl border border-panel-200 bg-white">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <th
      className={clsx(
        "whitespace-nowrap border-b border-panel-200 bg-panel-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: PropsWithChildren<{ className?: string; colSpan?: number }>) {
  return (
    <td
      colSpan={colSpan}
      className={clsx("border-b border-panel-200 px-4 py-3", className)}
    >
      {children}
    </td>
  );
}
