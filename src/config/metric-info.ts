import type { CountryCode } from "~/config/countries";

export interface MetricInfo {
  summary: string;
  thresholdRationale: {
    green: string;
    yellow: string;
    red: string;
  };
}

const auMetricInfo: Record<string, MetricInfo> = {
  gdp: {
    summary:
      "GDP growth measures the annual percentage change in the total value of goods and services produced in Australia. It's the broadest measure of whether the economy is expanding or contracting.",
    thresholdRationale: {
      green:
        "\u2265 2.5% \u2014 at or above trend growth for a developed economy. Enough to absorb population growth and support rising living standards.",
      yellow:
        "0\u20132.5% \u2014 the economy is still growing but below trend, which may mean jobs aren't being created fast enough to keep pace with population growth.",
      red: "< 0% \u2014 the economy is shrinking. Two consecutive quarters of negative growth is the technical definition of a recession.",
    },
  },
  "gdp-per-capita": {
    summary:
      "GDP per capita growth measures the annual change in economic output per person. Unlike total GDP, it adjusts for population growth \u2014 making it the better gauge of whether living standards are actually improving. With Australia's population growing at ~2% per year, total GDP can grow while per-capita output stagnates or falls.",
    thresholdRationale: {
      green:
        "\u2265 1.5% \u2014 per-capita output is growing comfortably above zero, meaning the average person's share of the economy is expanding. Historically around 1\u20131.5% is Australia's trend per-capita growth.",
      yellow:
        "0\u20131.5% \u2014 the economy is growing per person but below trend. Living standards are broadly flat.",
      red: "< 0% \u2014 the economy is shrinking on a per-person basis. Even if total GDP is positive, population growth is outpacing output \u2014 living standards are falling.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The RBA's formal mandate is to keep inflation within the 2\u20133% target band.",
    thresholdRationale: {
      green:
        "2\u20133% \u2014 within the RBA's target band. Price stability is maintained, purchasing power is preserved, and the RBA has room to adjust rates without drastic action.",
      yellow:
        "1\u20132% or 3\u20134% \u2014 just outside the target band. The RBA will typically signal a policy response, but the situation isn't an immediate crisis.",
      red: "< 1% risks deflation and economic stagnation. > 4% erodes real wages and savings rapidly, typically requiring aggressive rate rises to bring under control.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the labour force actively seeking work but unable to find it. It's one of the RBA's two primary mandates alongside inflation.",
    thresholdRationale: {
      green:
        "< 4.5% \u2014 close to full employment. At this level, most people who want jobs can find them without causing wage-driven inflation to take off.",
      yellow:
        "4.5\u20136% \u2014 noticeable slack in the labour market. Job seekers face harder searches; weaker household incomes put pressure on consumer spending.",
      red: "> 6% \u2014 significant labour market distress, typically associated with recession conditions and rising long-term unemployment.",
    },
  },
  "cash-rate": {
    summary:
      "The RBA cash rate is the interest rate on overnight loans between banks. It's the primary lever the RBA uses to influence inflation, employment, and economic activity \u2014 it flows through to mortgage rates, business borrowing costs, and the AUD.",
    thresholdRationale: {
      green:
        "2\u20133.5% \u2014 broadly neutral for Australia. Neither stimulating nor restricting the economy, consistent with inflation sitting at the 2\u20133% target.",
      yellow:
        "1\u20132% is stimulatory (appropriate during downturns but risks inflating assets). 3.5\u20134.5% is mildly restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 4.5% creates acute mortgage stress for Australian households, who carry some of the highest household debt ratios in the world.",
    },
  },
  wages: {
    summary:
      "The Wage Price Index measures annual growth in wages and salaries, excluding changes in the number of hours worked. Real wage growth \u2014 wages rising faster than inflation \u2014 is essential for household living standards.",
    thresholdRationale: {
      green:
        "\u2265 3.5% \u2014 wage growth typically stays ahead of or in line with inflation, meaning workers' real purchasing power is maintained or growing.",
      yellow:
        "2\u20133.5% \u2014 modest growth. If inflation is also in this range, real wages are roughly flat: workers aren't going backwards, but they're not gaining either.",
      red: "< 2% \u2014 almost certain real wage cuts when any inflation is present, reducing household disposable income and consumer spending capacity.",
    },
  },
  underemployment: {
    summary:
      "The underemployment ratio measures the share of employed people who want and are available to work more hours than they currently do. It captures hidden labour market slack that the unemployment rate misses.",
    thresholdRationale: {
      green:
        "< 7% \u2014 labour market is tight enough that most part-time workers who want more hours can find them.",
      yellow:
        "7\u20139% \u2014 a meaningful share of workers are stuck in fewer hours than they want, suppressing wage growth and household income.",
      red: "> 9% \u2014 widespread underutilisation of the workforce, typically seen during recessions or periods of weak economic activity.",
    },
  },
  "household-spending": {
    summary:
      "The Monthly Household Spending Indicator tracks the annual change in total consumer spending across all categories. Consumer spending drives around 55% of Australian GDP, making it a key pulse check on economic momentum.",
    thresholdRationale: {
      green:
        "2\u20137% \u2014 healthy nominal growth. Above inflation but not excessive, consistent with rising real living standards and a confident consumer.",
      yellow:
        "0\u20132% signals weak consumer confidence \u2014 households are cautious. 7\u201310% may indicate spending is running ahead of income, often funded by debt.",
      red: "< 0% \u2014 households are cutting spending in absolute terms, a strong recession signal. > 10% is uncommon and typically reflects a post-shock rebound or significant inflation passthrough.",
    },
  },
  "job-vacancies": {
    summary:
      "Job vacancies measure the number of unfilled positions that employers are actively trying to fill. It's a leading indicator of labour demand \u2014 rising vacancies mean businesses are expanding; falling vacancies mean they're pulling back.",
    thresholdRationale: {
      green:
        "> 250k \u2014 above pre-COVID norms, indicating strong employer demand for workers and a tight labour market.",
      yellow:
        "150\u2013250k \u2014 approaching pre-COVID normal levels. Vacancies are falling but the labour market remains functional.",
      red: "< 150k \u2014 well below historical norms, indicating weak hiring intentions and a labour market under stress.",
    },
  },
  "aud-usd": {
    summary:
      "The AUD/USD exchange rate shows how many US dollars one Australian dollar buys. As a commodity-linked currency, the AUD is heavily influenced by iron ore, coal, and LNG prices \u2014 Australia's major export earners.",
    thresholdRationale: {
      green:
        "0.65\u20130.80 USD \u2014 consistent with Australia's historical median range. Keeps exports competitive while limiting cost pressures on imports.",
      yellow:
        "0.60\u20130.65 makes imports noticeably more expensive, adding to domestic inflation. Above 0.80 can hurt export competitiveness for commodities and inbound tourism.",
      red: "< 0.60 signals a major confidence or terms-of-trade shock and sharply inflates import prices. > 0.85 is historically rare and severely compresses export revenues.",
    },
  },
  trade: {
    summary:
      "The trade balance is the difference between the value of Australia's exports and imports. A surplus means Australia earns more from overseas sales than it spends on imports, contributing positively to national income.",
    thresholdRationale: {
      green:
        "> A$5B surplus \u2014 reflects strong demand for Australian commodities (iron ore, coal, LNG) and supports the current account balance.",
      yellow:
        "0\u20135B surplus \u2014 still positive but thin, and vulnerable to commodity price swings or a softening in Chinese demand.",
      red: "Deficit \u2014 Australia imports more than it exports. Persistent deficits accumulate foreign debt and put downward pressure on the AUD.",
    },
  },
  "building-approvals": {
    summary:
      "Building approvals count the number of new residential dwellings approved for construction each month. As a leading indicator of housing supply, it signals how many homes will enter the construction pipeline 6\u201318 months ahead \u2014 directly shaping future rental vacancy rates and house prices.",
    thresholdRationale: {
      green:
        "> 15k/month \u2014 consistent with an annualised rate above 180k dwellings, approaching the pace needed to absorb population growth and reduce the structural housing shortfall.",
      yellow:
        "10\u201315k/month \u2014 below what population growth requires. New supply is being added, but not fast enough to prevent rising rents and prices in most cities.",
      red: "< 10k/month \u2014 critically low approvals, indicating a severe pipeline drought. With Australia's population growing by ~650k/year, this pace compounds the housing shortfall rapidly.",
    },
  },
  "fiscal-balance": {
    summary:
      "The fiscal balance is the net operating balance of all levels of Australian government combined \u2014 the difference between total government revenues and expenses on an accrual basis. A surplus means the government is taking in more than it spends; a deficit means it is borrowing to cover the gap. Shown as the trailing 12-month sum to remove quarterly seasonality (e.g. end-of-financial-year revenue spikes).",
    thresholdRationale: {
      green:
        "> A$0B (surplus) \u2014 all levels of government combined are running a surplus. Revenues exceed expenses on an annual basis, reducing net debt.",
      yellow:
        "A$0B to -A$40B deficit \u2014 a moderate deficit consistent with normal economic cycles or targeted fiscal stimulus. Roughly equivalent to up to 1.5% of GDP.",
      red: "< -A$40B deficit \u2014 a large structural deficit, comparable in scale to the GFC aftermath or the COVID response years. Indicates significant borrowing relative to the size of the economy.",
    },
  },
  "dwelling-completions": {
    summary:
      "Dwelling completions count the number of new residential dwellings finished and ready for occupation. Unlike approvals, completions represent actual supply hitting the market \u2014 making this the definitive measure of how quickly housing stock is growing relative to demand. Shown as a monthly rate (quarterly ABS data \u00f7 3).",
    thresholdRationale: {
      green:
        "> 16.7k/month (200k+/year) \u2014 approaching the National Housing Accord target of 1.2M new homes over 5 years. At this pace, the structural supply shortfall begins to close.",
      yellow:
        "13\u201316.7k/month \u2014 the range Australia has been delivering in recent years, broadly keeping pace with household formation but not making inroads into the backlog.",
      red: "< 13k/month \u2014 completions are falling behind household formation rates, adding to the structural shortfall and putting further upward pressure on rents and prices.",
    },
  },
};

const nzMetricInfo: Record<string, MetricInfo> = {
  gdp: {
    summary:
      "GDP growth measures the annual percentage change in the total value of goods and services produced in New Zealand. It's the broadest measure of whether the economy is expanding or contracting.",
    thresholdRationale: {
      green:
        "\u2265 2% \u2014 at or above trend growth for NZ. Enough to absorb population growth and support rising living standards.",
      yellow:
        "0\u20132% \u2014 the economy is still growing but below trend, which may mean jobs aren't being created fast enough to keep pace with population growth.",
      red: "< 0% \u2014 the economy is shrinking. Two consecutive quarters of negative growth is the technical definition of a recession.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The RBNZ's mandate is to keep inflation within the 1\u20133% target band.",
    thresholdRationale: {
      green:
        "1\u20133% \u2014 within the RBNZ's target band. Price stability is maintained and the RBNZ has room to adjust rates without drastic action.",
      yellow:
        "0\u20131% or 3\u20135% \u2014 just outside the target band. The RBNZ will typically signal a policy response.",
      red: "< 0% risks deflation and economic stagnation. > 5% erodes real wages and savings rapidly, typically requiring aggressive rate rises.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the labour force actively seeking work but unable to find it, measured quarterly by the Household Labour Force Survey.",
    thresholdRationale: {
      green:
        "< 4.5% \u2014 close to full employment. Most people who want jobs can find them.",
      yellow:
        "4.5\u20136% \u2014 noticeable slack in the labour market. Job seekers face harder searches.",
      red: "> 6% \u2014 significant labour market distress, typically associated with recession conditions.",
    },
  },
  "cash-rate": {
    summary:
      "The RBNZ Official Cash Rate (OCR) is the interest rate at which banks borrow and lend overnight. It's the primary lever the RBNZ uses to influence inflation and economic activity \u2014 it flows through to mortgage rates and business borrowing costs.",
    thresholdRationale: {
      green:
        "2\u20133.5% \u2014 broadly neutral for NZ. Neither stimulating nor restricting the economy, consistent with inflation in the 1\u20133% target band.",
      yellow:
        "1\u20132% is stimulatory (appropriate during downturns but risks inflating assets). 3.5\u20134.5% is mildly restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 4.5% creates acute mortgage stress for NZ households.",
    },
  },
  wages: {
    summary:
      "The Labour Cost Index measures annual growth in labour costs, excluding changes in the composition of the workforce. Real wage growth \u2014 wages rising faster than inflation \u2014 is essential for household living standards.",
    thresholdRationale: {
      green:
        "\u2265 3% \u2014 wage growth typically stays ahead of or in line with inflation, meaning workers' real purchasing power is maintained or growing.",
      yellow:
        "2\u20133% \u2014 modest growth. If inflation is also in this range, real wages are roughly flat.",
      red: "< 2% \u2014 almost certain real wage cuts when any inflation is present.",
    },
  },
  underutilisation: {
    summary:
      "The underutilisation rate measures the share of the labour force that is either unemployed or underemployed (working fewer hours than desired). It captures total labour market slack.",
    thresholdRationale: {
      green:
        "< 10% \u2014 labour market is tight enough that most people who want work or more hours can find them.",
      yellow:
        "10\u201313% \u2014 a meaningful share of the workforce is underutilised, suppressing wage growth and household income.",
      red: "> 13% \u2014 widespread underutilisation, typically seen during recessions or periods of weak economic activity.",
    },
  },
  "retail-trade": {
    summary:
      "The Retail Trade Survey tracks the annual change in total retail sales. Consumer spending drives around 60% of NZ GDP, making it a key pulse check on economic momentum.",
    thresholdRationale: {
      green:
        "2\u20136% \u2014 healthy nominal growth. Above inflation but not excessive, consistent with rising real living standards.",
      yellow:
        "0\u20132% signals weak consumer confidence. 6\u20139% may indicate spending is running ahead of income.",
      red: "< 0% \u2014 retailers experiencing falling sales, a strong recession signal. > 9% is uncommon and typically reflects a post-shock rebound.",
    },
  },
  "job-vacancies": {
    summary:
      "Job vacancies measure the number of unfilled positions that employers are actively trying to fill. Rising vacancies mean businesses are expanding; falling vacancies mean they're pulling back.",
    thresholdRationale: {
      green:
        "> 50k \u2014 strong employer demand for workers, indicating a tight labour market.",
      yellow:
        "30\u201350k \u2014 moderate vacancy levels. The labour market remains functional but demand is softening.",
      red: "< 30k \u2014 weak hiring intentions, indicating a labour market under stress.",
    },
  },
  "nzd-usd": {
    summary:
      "The NZD/USD exchange rate shows how many US dollars one New Zealand dollar buys. The NZD is influenced by dairy prices (NZ's largest export earner), interest rate differentials, and global risk appetite.",
    thresholdRationale: {
      green:
        "0.58\u20130.72 USD \u2014 consistent with NZ's historical median range. Keeps exports competitive while limiting cost pressures on imports.",
      yellow:
        "0.52\u20130.58 makes imports noticeably more expensive. Above 0.72 can hurt export competitiveness for dairy and tourism.",
      red: "< 0.52 signals a major confidence shock. > 0.78 is historically rare and severely compresses export revenues.",
    },
  },
  trade: {
    summary:
      "The trade balance is the difference between the value of NZ's exports and imports. NZ typically runs a near-zero or small trade balance, with dairy and meat exports offsetting manufactured imports.",
    thresholdRationale: {
      green:
        "> NZ$0B (surplus) \u2014 exports exceed imports, contributing positively to national income.",
      yellow:
        "NZ$0B to -NZ$2B deficit \u2014 a small deficit within normal range for NZ.",
      red: "< -NZ$2B deficit \u2014 a large deficit that accumulates foreign debt and puts downward pressure on the NZD.",
    },
  },
  "building-consents": {
    summary:
      "Building consents count the number of new residential dwellings consented for construction each month. As a leading indicator of housing supply, it signals how many homes will enter the construction pipeline.",
    thresholdRationale: {
      green:
        "> 3k/month \u2014 consistent with an annualised rate above 36k dwellings, approaching the pace needed to address NZ's housing shortfall.",
      yellow:
        "2\u20133k/month \u2014 below what population growth requires. Supply is being added, but not fast enough.",
      red: "< 2k/month \u2014 critically low consents, compounding the housing shortfall.",
    },
  },
  "fiscal-balance": {
    summary:
      "The Operating Balance Excluding Gains and Losses (OBEGAL) is NZ's core fiscal measure \u2014 the difference between Crown revenues and expenses, stripping out volatile revaluation movements. Shown as the trailing 12-month sum.",
    thresholdRationale: {
      green:
        "> NZ$0B (surplus) \u2014 the Crown is running a surplus. Revenues exceed expenses, reducing net debt.",
      yellow:
        "NZ$0B to -NZ$10B deficit \u2014 a moderate deficit consistent with normal economic cycles or targeted fiscal stimulus.",
      red: "< -NZ$10B deficit \u2014 a large structural deficit requiring significant borrowing.",
    },
  },
};

const allMetricInfo: Record<CountryCode, Record<string, MetricInfo>> = {
  au: auMetricInfo,
  nz: nzMetricInfo,
};

export function getMetricInfo(country: CountryCode): Record<string, MetricInfo> {
  return allMetricInfo[country];
}
