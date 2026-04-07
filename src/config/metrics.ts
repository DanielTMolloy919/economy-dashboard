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
  // Regression window (number of data points) and minimum slope threshold.
  // Arrow shows neutral if |slope| < trendThreshold — i.e. the series is flat.
  trendWindow: number;
  trendThreshold: number;
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
    trendWindow: 4,       // 4 quarters = 1 year
    trendThreshold: 0.05, // 0.05pp/quarter slope to register
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
    trendWindow: 6,
    trendThreshold: 0.05,
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
    trendWindow: 6,
    trendThreshold: 0.02,
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
    trendWindow: 4,       // last 4 decisions
    trendThreshold: 0.05,
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
    trendWindow: 4,
    trendThreshold: 0.05,
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
    trendWindow: 6,
    trendThreshold: 0.002, // ~0.2 cent/month slope to register
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
    trendWindow: 6,
    trendThreshold: 0.1,  // A$100M/month slope to register
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
    trendWindow: 6,
    trendThreshold: 0.02,
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
    trendWindow: 6,
    trendThreshold: 0.1,
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
    trendWindow: 4,
    trendThreshold: 5,    // 5k/quarter slope to register
  },
  {
    id: "building-approvals",
    name: "Building Approvals",
    unit: "k dwellings/mo",
    source: "ABS",
    frequency: "Monthly",
    chartType: "bar",
    description: "New residential dwelling units approved per month (thousands)",
    section: "Housing",
    trendPolarity: "positive",
    decimals: 1,
    trendWindow: 6,
    trendThreshold: 0.3,  // 300 dwellings/month slope to register
  },
  {
    id: "dwelling-completions",
    name: "Dwelling Completions",
    unit: "k dwellings/mo",
    source: "ABS",
    frequency: "Quarterly",
    chartType: "bar",
    description: "New residential dwellings completed per month (thousands, quarterly data normalised)",
    section: "Housing",
    trendPolarity: "positive",
    decimals: 1,
    trendWindow: 4,
    trendThreshold: 0.2,  // ~200 dwellings/month slope to register
  },
];

export const dashboardSections = [
  "Growth & Output",
  "Prices & Wages",
  "Labour Market",
  "Financial & Monetary",
  "External & Trade",
  "Housing",
];

export const heroMetricIds = ["gdp", "cpi", "unemployment", "cash-rate"];
