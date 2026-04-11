import { notFound } from "next/navigation";
import { isValidCountry, countries } from "~/config/countries";
import { getAllMetrics } from "~/lib/data";
import { DashboardView } from "~/components/dashboard/dashboard-view";

export function generateMetadata({ params }: { params: Promise<{ country: string }> }) {
  // Next.js 15 makes params a Promise
  return params.then(({ country }) => {
    if (!isValidCountry(country)) return {};
    const config = countries[country];
    return {
      title: `${config.flag} ${config.name} Economy Dashboard`,
      description: `Economic health dashboard for the ${config.name} economy`,
    };
  });
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  if (!isValidCountry(country)) notFound();

  const metrics = getAllMetrics(country);
  return <DashboardView metrics={metrics} country={country} />;
}
