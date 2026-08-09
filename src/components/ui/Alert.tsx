import type { PropsWithChildren } from "react";
import clsx from "clsx";

export default function Alert(
  props: PropsWithChildren<{
    title?: string;
    variant?: "error" | "info";
    className?: string;
  }>,
) {
  const { title, variant = "info", className, children } = props;

  return (
    <div
      className={clsx(
        "rounded-xl border p-4 text-sm",
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-900"
          : "border-panel-200 bg-panel-50 text-gray-900",
        className,
      )}
    >
      {title ? <div className="font-semibold">{title}</div> : null}
      <div className={clsx(title ? "mt-1" : undefined)}>{children}</div>
    </div>
  );
}
