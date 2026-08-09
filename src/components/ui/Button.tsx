import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

export default function Button(
  props: PropsWithChildren<
    ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }
  >,
) {
  const { variant = "primary", className, ...rest } = props;

  return (
    <button
      {...rest}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
        variant === "primary"
          ? "bg-panel-800 text-white hover:bg-panel-900"
          : "bg-transparent text-gray-700 hover:bg-panel-100",
        className,
      )}
    />
  );
}
