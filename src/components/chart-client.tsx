import { ClientOnly } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function ChartClient({
  height,
  children,
}: {
  height: number;
  children: ReactNode;
}) {
  return (
    <ClientOnly fallback={<div style={{ height }} className="w-full rounded-md bg-muted/30 animate-pulse" />}>
      {children}
    </ClientOnly>
  );
}
