import * as React from "react";
import { cn } from "./utils";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "green" | "amber" | "red" }) {
  const toneClass = {
    neutral: "bg-muted text-foreground",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700"
  }[tone];
  return (
    <span
      className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold", toneClass, className)}
      {...props}
    />
  );
}

