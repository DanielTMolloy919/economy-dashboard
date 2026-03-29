"use client";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export type TimeRange = "1Y" | "5Y" | "10Y" | "all";

export function TimeRangeTabs({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as TimeRange)}>
      <TabsList>
        <TabsTrigger value="1Y">1Y</TabsTrigger>
        <TabsTrigger value="5Y">5Y</TabsTrigger>
        <TabsTrigger value="10Y">10Y</TabsTrigger>
        <TabsTrigger value="all">All</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
