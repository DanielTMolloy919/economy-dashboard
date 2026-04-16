"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ReferenceArea,
  ReferenceLine,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function formatQuarter(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

export function ScoreHistoryChart({
  data,
  selectedDate,
  onSelectDate,
}: {
  data: { date: string; score: number }[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}) {
  const yearTicks = useMemo(() => {
    const seen = new Set<number>();
    return data
      .filter((p) => {
        const y = new Date(p.date + "T00:00:00").getFullYear();
        if (y % 5 !== 0 || seen.has(y)) return false;
        seen.add(y);
        return true;
      })
      .map((p) => p.date);
  }, [data]);

  const selectedPoint = selectedDate ? data.find((p) => p.date === selectedDate) : null;

  if (data.length === 0) return null;

  return (
    <div className="w-full space-y-1">
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
          onClick={(payload) => {
            if (payload?.activeLabel) {
              const label = payload.activeLabel as string;
              onSelectDate(label === selectedDate ? null : label);
            }
          }}
          style={{ cursor: "crosshair" }}
        >
          <ReferenceArea y1={0} y2={40} fill="#ef4444" fillOpacity={0.15} />
          <ReferenceArea y1={40} y2={70} fill="#f59e0b" fillOpacity={0.12} />
          <ReferenceArea y1={70} y2={100} fill="#22c55e" fillOpacity={0.12} />

          <XAxis
            dataKey="date"
            ticks={yearTicks}
            tickFormatter={(v: string) =>
              new Date(v + "T00:00:00").getFullYear().toString()
            }
            tick={{ fontSize: 10, opacity: 0.5 }}
            axisLine={false}
            tickLine={false}
            height={16}
          />
          <YAxis domain={[0, 100]} hide />

          {selectedDate && (
            <ReferenceLine
              x={selectedDate}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.6}
              strokeDasharray="3 3"
            />
          )}
          {selectedPoint && (
            <ReferenceDot
              x={selectedDate!}
              y={selectedPoint.score}
              r={4}
              fill="#1e293b"
              stroke="white"
              strokeWidth={1.5}
            />
          )}

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const score = payload[0]?.value as number;
              return (
                <div className="rounded border bg-popover px-2 py-1 text-xs shadow">
                  <p className="font-medium">{formatQuarter(label as string)}</p>
                  <p className="text-muted-foreground">Score: {score}</p>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="score"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeOpacity={0.7}
            fill="currentColor"
            fillOpacity={0.06}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-center text-[10px] text-muted-foreground">
        Health score history · click to replay
      </p>
    </div>
  );
}
