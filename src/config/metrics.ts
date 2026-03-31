import type { ChartType, TrendPolarity } from "~/types/metrics";

export interface MetricDefinition {
  id: string;
  name: string;
  unit: string;
  source: string;
  frequency: string;
  chartType: ChartType;
  description: string;
  section: string;
  trendPolarity: TrendPolarity;
  decimals: number;
}

export const metricDefinitions: MetricDefinition[] = [
  {
    id: "gdp",
    name: "GDP Growth",
    unit: "% YoY",
    source: "ABS",
    frequency: "Quarterly",
    chartType: "bar",
    description: "Annual gross domestic product growth rate",
    section: "Growth & Output",
    trendPolarity: "positive",
    decimals: 1,
  },
  {
    id: "cpi",
    name: "Inflation (CPI)",
    unit: "% YoY",
    source: "ABS",
    frequency: "Monthly",
    chartType: "line",
    description: "Consumer Price Index — annual change",
    section: "Prices & Wages",
    trendPolarity: "negative",
    decimals: 1,
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
    trendPolarity: "negative",
    decimals: 1,
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
    trendPolarity: "neutral",
    decimals: 2,
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
    trendPolarity: "positive",
    decimals: 1,
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
    trendPolarity: "neutral",
    decimals: 4,
  },
  {
    id: "trade",
    name: "Trade Balance",
    unit: "A$B",
    source: "ABS",
    frequency: "Monthly",
    chartType: "bar",
    description: "Goods trade balance (surplus/deficit)",
    section: "External & Trade",
    trendPolarity: "positive",
    decimals: 1,
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
    trendPolarity: "negative",
    decimals: 1,
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
    trendPolarity: "positive",
    decimals: 1,
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
    trendPolarity: "positive",
    decimals: 1,
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
