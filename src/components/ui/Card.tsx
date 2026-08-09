import type { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-panel-200 bg-white p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: PropsWithChildren) {
  return <div className="text-sm font-semibold text-gray-900">{children}</div>;
}

export function CardSubtitle({ children }: PropsWithChildren) {
  return <div className="text-xs text-gray-500">{children}</div>;
}
