"use client";

import type { ReactElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  label: string;
  children: ReactElement;
  side?: "top" | "bottom" | "left" | "right";
  /** Wrap trigger so tooltips work on disabled controls */
  disabled?: boolean;
};

export function ActionTooltip({
  label,
  children,
  side = "bottom",
  disabled,
}: Props) {
  const trigger = disabled ? (
    <span className="inline-flex">{children}</span>
  ) : (
    children
  );

  return (
    <Tooltip>
      <TooltipTrigger render={trigger} delay={400} />
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
