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
  housing: {
    summary:
      "This tracks the annual percentage change in Australian residential property prices. Housing is both the largest household asset class and a key driver of construction activity and consumer confidence.",
    thresholdRationale: {
      green:
        "0–5% — moderate growth broadly in line with wages and inflation, keeping housing accessible without generating destabilising credit growth.",
      yellow:
        "−5–0% (mild falls) or 5–10% (fast rises). Mild falls can correct overvaluation; rapid rises start to price out first-home buyers and stretch household debt.",
      red: "Falls > 5% can trigger negative equity for recent buyers and sharply reduce household wealth. Rises > 10% signal speculative excess and significantly worsen housing affordability.",
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
};
