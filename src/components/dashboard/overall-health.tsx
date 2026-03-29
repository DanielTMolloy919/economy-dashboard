"use client";
import { PieChart, Pie, Cell } from "recharts";

function scoreColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Healthy";
  if (score >= 40) return "Mixed";
  return "At Risk";
}

export function OverallHealth({ score }: { score: number }) {
  const color = scoreColor(score);
  const data = [{ value: score }, { value: 100 - score }];

  return (
    <div className="flex flex-col items-center shrink-0">
      {/* cy=90 puts the gauge center at the bottom; outerRadius=80 fits within height=95 */}
      <div className="relative w-[180px] h-[95px]">
        <PieChart width={180} height={95}>
          <Pie
            data={data}
            startAngle={180}
            endAngle={0}
            cx={90}
            cy={90}
            innerRadius={58}
            outerRadius={82}
            dataKey="value"
            strokeWidth={0}
          >
            <Cell fill={color} />
            <Cell fill="oklch(0.922 0 0)" className="dark:fill-[oklch(0.269_0_0)]" />
          </Pie>
        </PieChart>
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center leading-tight">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-1">Economy Health</p>
      <p className="text-xs text-muted-foreground" style={{ color }}>
        {scoreLabel(score)}
      </p>
    </div>
  );
}
