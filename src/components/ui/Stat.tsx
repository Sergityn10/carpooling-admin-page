import type { ReactNode } from "react";
import { Card } from "./Card";

export default function Stat(props: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-gray-500">{props.label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-900">
        {props.value}
      </div>
      {props.hint ? (
        <div className="mt-1 text-xs text-gray-500">{props.hint}</div>
      ) : null}
    </Card>
  );
}
