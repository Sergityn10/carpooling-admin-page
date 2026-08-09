import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

export default function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={clsx(
        "w-full rounded-lg border border-panel-200 bg-white px-3 py-2 text-sm outline-none ring-0 focus:border-panel-800",
        className,
      )}
    />
  );
}
