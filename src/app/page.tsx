import { getAllMetrics } from "~/lib/data";
import { DashboardView } from "~/components/dashboard/dashboard-view";

export default function Home() {
  const metrics = getAllMetrics();
  return <DashboardView metrics={metrics} />;
}
