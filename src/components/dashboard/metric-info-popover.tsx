"use client";

import { Info } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import type { MetricInfo } from "~/config/metric-info";

const thresholdRows = [
  { key: "green" as const, label: "Healthy", dot: "bg-green-500" },
  { key: "yellow" as const, label: "Caution", dot: "bg-amber-400" },
  { key: "red" as const, label: "At Risk", dot: "bg-red-500" },
];

interface MetricInfoPopoverProps {
  info: MetricInfo;
  name: string;
}

export function MetricInfoPopover({ info, name }: MetricInfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="icon-xs" className="text-muted-foreground" />}>
        <Info data-icon />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{name}</PopoverTitle>
          <PopoverDescription>{info.summary}</PopoverDescription>
        </PopoverHeader>
        <Separator />
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Health thresholds</p>
          {thresholdRows.map(({ key, label, dot }) => (
            <div key={key} className="flex gap-2">
              <span className={`mt-1 size-2 shrink-0 rounded-full ${dot}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {info.thresholdRationale[key]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
