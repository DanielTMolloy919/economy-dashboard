import type { ChartType } from "~/types/metrics";

export interface MetricDefinition {
  id: string;
  name: string;
  unit: string;
  source: string;
  frequency: string;
  chartType: ChartType;
  description: string;
  section: string;
}

export const metricDefinitions: MetricDefinition[] = [
  {
    id: "gdp",
    name: "GDP Growth",
    unit: "% YoY",
    source: "World Bank",
    frequency: "Annual",
    chartType: "bar",
    description: "Annual gross domestic product growth rate",
    section: "Growth & Output",
  },
  {
    id: "cpi",
    name: "Inflation (CPI)",
    unit: "% YoY",
    source: "RBA / ABS",
    frequency: "Quarterly",
    chartType: "line",
    description: "Consumer Price Index — annual change",
    section: "Prices & Wages",
  },
  {
    id: "unemployment",
    name: "Unemployment",
    unit: "%",
    source: "ABS",
    frequency: "Monthly",
    chartType: "area",
    description: "Unemployment rate as % of labour force",
    section: "Labour Market",
  },
  {
    id: "cash-rate",
    name: "Cash Rate",
    unit: "%",
    source: "RBA",
    frequency: "~8x/year",
    chartType: "step",
    description: "RBA official cash rate target",
    section: "Financial & Monetary",
  },
  {
    id: "wages",
    name: "Wage Growth",
    unit: "% YoY",
    source: "ABS",
    frequency: "Quarterly",
    chartType: "line",
    description: "Wage Price Index — annual change",
    section: "Prices & Wages",
  },
  {
    id: "aud-usd",
    name: "AUD/USD",
    unit: "USD",
    source: "RBA",
    frequency: "Monthly",
    chartType: "area",
    description: "Australian dollar vs US dollar exchange rate",
    section: "External & Trade",
  },
  {
    id: "trade",
    name: "Trade Balance",
    unit: "A$B",
    source: "World Bank",
    frequency: "Annual",
    chartType: "bar",
    description: "Goods and services trade balance (surplus/deficit)",
    section: "External & Trade",
  },
  {
    id: "underemployment",
    name: "Underemployment",
    unit: "%",
    source: "ABS",
    frequency: "Monthly",
    chartType: "area",
    description: "Share of employed people who want more work hours",
    section: "Labour Market",
  },
  {
    id: "household-spending",
    name: "Household Spending",
    unit: "% YoY",
    source: "ABS",
    frequency: "Monthly",
    chartType: "area",
    description: "Annual change in household consumer spending",
    section: "Growth & Output",
  },
  {
    id: "job-vacancies",
    name: "Job Vacancies",
    unit: "k",
    source: "ABS",
    frequency: "Quarterly",
    chartType: "bar",
    description: "Number of unfilled job vacancies (thousands)",
    section: "Labour Market",
  },
];

export const dashboardSections = [
  "Growth & Output",
  "Prices & Wages",
  "Labour Market",
  "Financial & Monetary",
  "External & Trade",
];

export const heroMetricIds = ["gdp", "cpi", "unemployment", "cash-rate"];
