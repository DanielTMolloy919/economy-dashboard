export interface MetricInfo {
  summary: string;
  thresholdRationale: {
    green: string;
    yellow: string;
    red: string;
  };
}

export const metricInfo: Record<string, MetricInfo> = {
  gdp: {
    summary:
      "GDP growth measures the annual percentage change in the total value of goods and services produced in Australia. It's the broadest measure of whether the economy is expanding or contracting.",
    thresholdRationale: {
      green:
        "≥ 2.5% — at or above trend growth for a developed economy. Enough to absorb population growth and support rising living standards.",
      yellow:
        "0–2.5% — the economy is still growing but below trend, which may mean jobs aren't being created fast enough to keep pace with population growth.",
      red: "< 0% — the economy is shrinking. Two consecutive quarters of negative growth is the technical definition of a recession.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The RBA's formal mandate is to keep inflation within the 2–3% target band.",
    thresholdRationale: {
      green:
        "2–3% — within the RBA's target band. Price stability is maintained, purchasing power is preserved, and the RBA has room to adjust rates without drastic action.",
      yellow:
        "1–2% or 3–4% — just outside the target band. The RBA will typically signal a policy response, but the situation isn't an immediate crisis.",
      red: "< 1% risks deflation and economic stagnation. > 4% erodes real wages and savings rapidly, typically requiring aggressive rate rises to bring under control.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the labour force actively seeking work but unable to find it. It's one of the RBA's two primary mandates alongside inflation.",
    thresholdRationale: {
      green:
        "< 4.5% — close to full employment. At this level, most people who want jobs can find them without causing wage-driven inflation to take off.",
      yellow:
        "4.5–6% — noticeable slack in the labour market. Job seekers face harder searches; weaker household incomes put pressure on consumer spending.",
      red: "> 6% — significant labour market distress, typically associated with recession conditions and rising long-term unemployment.",
    },
  },
  "cash-rate": {
    summary:
      "The RBA cash rate is the interest rate on overnight loans between banks. It's the primary lever the RBA uses to influence inflation, employment, and economic activity — it flows through to mortgage rates, business borrowing costs, and the AUD.",
    thresholdRationale: {
      green:
        "2–3.5% — broadly neutral for Australia. Neither stimulating nor restricting the economy, consistent with inflation sitting at the 2–3% target.",
      yellow:
        "1–2% is stimulatory (appropriate during downturns but risks inflating assets). 3.5–4.5% is mildly restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 4.5% creates acute mortgage stress for Australian households, who carry some of the highest household debt ratios in the world.",
    },
  },
  wages: {
    summary:
      "The Wage Price Index measures annual growth in wages and salaries, excluding changes in the number of hours worked. Real wage growth — wages rising faster than inflation — is essential for household living standards.",
    thresholdRationale: {
      green:
        "≥ 3.5% — wage growth typically stays ahead of or in line with inflation, meaning workers' real purchasing power is maintained or growing.",
      yellow:
        "2–3.5% — modest growth. If inflation is also in this range, real wages are roughly flat: workers aren't going backwards, but they're not gaining either.",
      red: "< 2% — almost certain real wage cuts when any inflation is present, reducing household disposable income and consumer spending capacity.",
    },
  },
  underemployment: {
    summary:
      "The underemployment ratio measures the share of employed people who want and are available to work more hours than they currently do. It captures hidden labour market slack that the unemployment rate misses.",
    thresholdRationale: {
      green:
        "< 7% — labour market is tight enough that most part-time workers who want more hours can find them.",
      yellow:
        "7–9% — a meaningful share of workers are stuck in fewer hours than they want, suppressing wage growth and household income.",
      red: "> 9% — widespread underutilisation of the workforce, typically seen during recessions or periods of weak economic activity.",
    },
  },
  "household-spending": {
    summary:
      "The Monthly Household Spending Indicator tracks the annual change in total consumer spending across all categories. Consumer spending drives around 55% of Australian GDP, making it a key pulse check on economic momentum.",
    thresholdRationale: {
      green:
        "2–7% — healthy nominal growth. Above inflation but not excessive, consistent with rising real living standards and a confident consumer.",
      yellow:
        "0–2% signals weak consumer confidence — households are cautious. 7–10% may indicate spending is running ahead of income, often funded by debt.",
      red: "< 0% — households are cutting spending in absolute terms, a strong recession signal. > 10% is uncommon and typically reflects a post-shock rebound or significant inflation passthrough.",
    },
  },
  "job-vacancies": {
    summary:
      "Job vacancies measure the number of unfilled positions that employers are actively trying to fill. It's a leading indicator of labour demand — rising vacancies mean businesses are expanding; falling vacancies mean they're pulling back.",
    thresholdRationale: {
      green:
        "> 250k — above pre-COVID norms, indicating strong employer demand for workers and a tight labour market.",
      yellow:
        "150–250k — approaching pre-COVID normal levels. Vacancies are falling but the labour market remains functional.",
      red: "< 150k — well below historical norms, indicating weak hiring intentions and a labour market under stress.",
    },
  },
  "aud-usd": {
    summary:
      "The AUD/USD exchange rate shows how many US dollars one Australian dollar buys. As a commodity-linked currency, the AUD is heavily influenced by iron ore, coal, and LNG prices — Australia's major export earners.",
    thresholdRationale: {
      green:
        "0.65–0.80 USD — consistent with Australia's historical median range. Keeps exports competitive while limiting cost pressures on imports.",
      yellow:
        "0.60–0.65 makes imports noticeably more expensive, adding to domestic inflation. Above 0.80 can hurt export competitiveness for commodities and inbound tourism.",
      red: "< 0.60 signals a major confidence or terms-of-trade shock and sharply inflates import prices. > 0.85 is historically rare and severely compresses export revenues.",
    },
  },
  trade: {
    summary:
      "The trade balance is the difference between the value of Australia's exports and imports. A surplus means Australia earns more from overseas sales than it spends on imports, contributing positively to national income.",
    thresholdRationale: {
      green:
        "> A$5B surplus — reflects strong demand for Australian commodities (iron ore, coal, LNG) and supports the current account balance.",
      yellow:
        "0–5B surplus — still positive but thin, and vulnerable to commodity price swings or a softening in Chinese demand.",
      red: "Deficit — Australia imports more than it exports. Persistent deficits accumulate foreign debt and put downward pressure on the AUD.",
    },
  },
  "building-approvals": {
    summary:
      "Building approvals count the number of new residential dwellings approved for construction each month. As a leading indicator of housing supply, it signals how many homes will enter the construction pipeline 6–18 months ahead — directly shaping future rental vacancy rates and house prices.",
    thresholdRationale: {
      green:
        "> 15k/month — consistent with an annualised rate above 180k dwellings, approaching the pace needed to absorb population growth and reduce the structural housing shortfall.",
      yellow:
        "10–15k/month — below what population growth requires. New supply is being added, but not fast enough to prevent rising rents and prices in most cities.",
      red: "< 10k/month — critically low approvals, indicating a severe pipeline drought. With Australia's population growing by ~650k/year, this pace compounds the housing shortfall rapidly.",
    },
  },
  "fiscal-balance": {
    summary:
      "The fiscal balance is the net operating balance of all levels of Australian government combined — the difference between total government revenues and expenses on an accrual basis. A surplus means the government is taking in more than it spends; a deficit means it is borrowing to cover the gap. Shown as the trailing 12-month sum to remove quarterly seasonality (e.g. end-of-financial-year revenue spikes).",
    thresholdRationale: {
      green:
        "> A$0B (surplus) — all levels of government combined are running a surplus. Revenues exceed expenses on an annual basis, reducing net debt.",
      yellow:
        "A$0B to -A$40B deficit — a moderate deficit consistent with normal economic cycles or targeted fiscal stimulus. Roughly equivalent to up to 1.5% of GDP.",
      red: "< -A$40B deficit — a large structural deficit, comparable in scale to the GFC aftermath or the COVID response years. Indicates significant borrowing relative to the size of the economy.",
    },
  },
  "dwelling-completions": {
    summary:
      "Dwelling completions count the number of new residential dwellings finished and ready for occupation. Unlike approvals, completions represent actual supply hitting the market — making this the definitive measure of how quickly housing stock is growing relative to demand. Shown as a monthly rate (quarterly ABS data ÷ 3).",
    thresholdRationale: {
      green:
        "> 16.7k/month (200k+/year) — approaching the National Housing Accord target of 1.2M new homes over 5 years. At this pace, the structural supply shortfall begins to close.",
      yellow:
        "13–16.7k/month — the range Australia has been delivering in recent years, broadly keeping pace with household formation but not making inroads into the backlog.",
      red: "< 13k/month — completions are falling behind household formation rates, adding to the structural shortfall and putting further upward pressure on rents and prices.",
    },
  },
};
