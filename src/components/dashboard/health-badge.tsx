import { Badge } from "~/components/ui/badge";
import type { HealthStatus } from "~/types/metrics";

const config: Record<HealthStatus, { label: string; className: string }> = {
  green: { label: "Healthy", className: "bg-green-500 hover:bg-green-500 text-white border-0" },
  yellow: { label: "Caution", className: "bg-amber-500 hover:bg-amber-500 text-white border-0" },
  red: { label: "At Risk", className: "bg-red-500 hover:bg-red-500 text-white border-0" },
};

export function HealthBadge({ status }: { status: HealthStatus }) {
  const { label, className } = config[status];
  return <Badge className={className}>{label}</Badge>;
}
