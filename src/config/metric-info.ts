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
        "2.25\u20135.5% \u2014 at or above the RBA\u2019s estimated potential growth rate of ~2.25%, and not yet overheating. Source: RBA Statement on Monetary Policy, Nov 2024.",
      yellow:
        "0\u20132.25% \u2014 below-potential growth; jobs may not be created fast enough to keep pace with population growth. 5.5\u20137.5% \u2014 running hot, with risk of inflation and capacity constraints.",
      red: "< 0% \u2014 the economy is contracting (two consecutive negative quarters = recession). > 7.5% \u2014 extreme overheating, unsustainable for a mature developed economy.",
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
  productivity: {
    summary:
      "Labour productivity \u2014 GDP per hour worked \u2014 measures how much output the economy generates for each hour of work. Over the long run, productivity growth is what drives real wage growth and rising living standards. Australia\u2019s productivity growth has slowed markedly since the mid-2000s, a focus of Productivity Commission analysis.",
    thresholdRationale: {
      green:
        "\u2265 1.0% \u2014 productivity is growing at or above the developed-economy trend rate. Real wages can rise without generating inflation.",
      yellow:
        "0\u20131.0% \u2014 stagnant productivity. Output is rising only because more hours are being worked, not because work is getting more efficient. Real wage growth will be hard to sustain.",
      red: "< 0% \u2014 labour productivity is going backwards. Each hour worked produces less than a year ago \u2014 a serious structural concern.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The RBA's formal mandate is to keep inflation within the 2\u20133% target band.",
    thresholdRationale: {
      green:
        "2\u20133% \u2014 within the RBA\u2019s formal 2\u20133% target band. Price stability is maintained and the RBA has room to adjust rates without drastic action. Source: RBA inflation target mandate.",
      yellow:
        "1\u20132% or 3\u20134% \u2014 just outside the target band. The RBA will typically signal a policy response, but the situation isn\u2019t an immediate crisis.",
      red: "< 1% risks deflation and economic stagnation. > 4% erodes real wages and savings rapidly, typically requiring aggressive rate rises.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the labour force actively seeking work but unable to find it. It's one of the RBA's two primary mandates alongside inflation.",
    thresholdRationale: {
      green:
        "< 4.5% \u2014 at or near the RBA\u2019s estimated NAIRU of ~4.25\u20134.5%. Most people who want jobs can find them without causing wage-driven inflation. Source: RBA Statement on Monetary Policy, Nov 2024.",
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
        "2.5\u20133.5% \u2014 within the RBA\u2019s estimated neutral rate range. At neutral, monetary policy neither stimulates nor restricts the economy, consistent with inflation at the 2\u20133% target. Source: RBA speech by Kent, Jun 2024.",
      yellow:
        "1\u20132.5% is stimulatory (appropriate during downturns but risks inflating assets). 3.5\u20135% is restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 5% is well above neutral \u2014 acutely restrictive for Australian households, who carry some of the highest household debt ratios in the world.",
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
  "real-wages": {
    summary:
      "Real wage growth measures whether workers' pay is rising faster than the cost of living. Calculated as nominal wage growth (WPI) minus CPI inflation. Positive values mean purchasing power is increasing; negative values mean workers are going backwards in real terms.",
    thresholdRationale: {
      green:
        "> +0.5% \u2014 wages are clearly outpacing inflation. Workers' purchasing power is growing, supporting consumer spending and living standards.",
      yellow:
        "-0.5% to +0.5% \u2014 wages are roughly tracking inflation. Living standards are flat \u2014 workers aren't gaining but aren't losing ground.",
      red: "< -0.5% \u2014 inflation is outpacing wage growth. Workers' purchasing power is declining, eroding living standards and typically weakening consumer confidence.",
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
        "2\u20135.5% \u2014 at or above the RBNZ\u2019s estimated potential growth rate of ~2%, and not yet overheating. Source: RBNZ Monetary Policy Statement.",
      yellow:
        "0\u20132% \u2014 below-potential growth; jobs may not be created fast enough to keep pace with population growth. 5.5\u20137.5% \u2014 running hot, with risk of inflation and capacity constraints.",
      red: "< 0% \u2014 the economy is contracting (two consecutive negative quarters = recession). > 7.5% \u2014 extreme overheating, unsustainable for a mature developed economy.",
    },
  },
  "gdp-per-capita": {
    summary:
      "GDP per capita growth measures the annual change in economic output per person. Unlike total GDP, it adjusts for population growth \u2014 making it the better gauge of whether living standards are actually improving.",
    thresholdRationale: {
      green:
        "\u2265 1.5% \u2014 per-capita output is growing comfortably, meaning the average person\u2019s share of the economy is expanding.",
      yellow:
        "0\u20131.5% \u2014 the economy is growing per person but below trend. Living standards are broadly flat.",
      red: "< 0% \u2014 the economy is shrinking on a per-person basis. Even if total GDP is positive, population growth is outpacing output.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The RBNZ's mandate is to keep inflation within the 1\u20133% target band.",
    thresholdRationale: {
      green:
        "1\u20133% \u2014 within the RBNZ\u2019s 1\u20133% target band (midpoint 2%). Price stability is maintained and the RBNZ has room to adjust rates without drastic action. Source: RBNZ Monetary Policy Remit.",
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
        "< 4.5% \u2014 at or near the RBNZ\u2019s estimated NAIRU of ~4\u20134.5%. Most people who want jobs can find them. Source: RBNZ Monetary Policy Statement.",
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
        "2.25\u20133% \u2014 within the RBNZ\u2019s estimated neutral OCR range of ~2.5\u20132.75%. At neutral, monetary policy neither stimulates nor restricts the economy. Source: RBNZ \u201cFinding Neutral\u201d, Apr 2024.",
      yellow:
        "0.75\u20132.25% is stimulatory (appropriate during downturns but risks inflating assets). 3\u20134.5% is restrictive, used to cool above-target inflation.",
      red: "< 0.75% are emergency lows that distort asset markets. > 4.5% creates acute mortgage stress for NZ households.",
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
  "real-wages": {
    summary:
      "Real wage growth measures whether workers' pay is rising faster than the cost of living. Calculated as nominal labour cost growth (LCI) minus CPI inflation. Positive values mean purchasing power is increasing; negative values mean workers are going backwards in real terms.",
    thresholdRationale: {
      green:
        "> +0.5% \u2014 wages are clearly outpacing inflation. Workers' purchasing power is growing, supporting consumer spending and living standards.",
      yellow:
        "-0.5% to +0.5% \u2014 wages are roughly tracking inflation. Living standards are flat \u2014 workers aren't gaining but aren't losing ground.",
      red: "< -0.5% \u2014 inflation is outpacing wage growth. Workers' purchasing power is declining, eroding living standards and typically weakening consumer confidence.",
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

const usMetricInfo: Record<string, MetricInfo> = {
  gdp: {
    summary:
      "GDP growth measures the annual percentage change in the total value of goods and services produced in the United States. The US is the world's largest economy by nominal GDP.",
    thresholdRationale: {
      green:
        "1.8\u20135% \u2014 at or above the Fed\u2019s longer-run real GDP growth estimate of ~1.8%, and not yet overheating. Source: Fed Summary of Economic Projections, Dec 2024.",
      yellow:
        "0\u20131.8% \u2014 below-potential growth; the labour market may be softening. 5\u20137% \u2014 running hot, with risk of inflation and capacity constraints.",
      red: "< 0% \u2014 the economy is contracting (two consecutive negative quarters = recession). > 7% \u2014 extreme overheating, unsustainable for a mature developed economy.",
    },
  },
  "gdp-per-capita": {
    summary:
      "GDP per capita growth measures the annual change in economic output per person. It adjusts for population growth, making it a better gauge of whether living standards are improving.",
    thresholdRationale: {
      green:
        "\u2265 1.5% \u2014 per-capita output is growing comfortably, meaning the average person's share of the economy is expanding.",
      yellow:
        "0\u20131.5% \u2014 the economy is growing per person but below trend. Living standards are broadly flat.",
      red: "< 0% \u2014 the economy is shrinking on a per-person basis, even if total GDP is positive.",
    },
  },
  productivity: {
    summary:
      "Labour productivity is output per hour worked in the nonfarm business sector \u2014 the BLS headline series covering about three-quarters of the US economy. It\u2019s the foundation of long-run real wage growth: when productivity rises, workers can be paid more without driving up prices.",
    thresholdRationale: {
      green:
        "\u2265 1.0% \u2014 productivity is tracking at or above the developed-economy trend rate. The post-pandemic US productivity surge has run well above this.",
      yellow:
        "0\u20131.0% \u2014 stagnant productivity, similar to the 2010s slowdown. Output grows only via more hours worked.",
      red: "< 0% \u2014 productivity is contracting. Historically rare outside recessions.",
    },
  },
  "personal-consumption": {
    summary:
      "Personal consumption expenditures (PCE) track annual change in real consumer spending. Consumer spending drives roughly 70% of US GDP, making it the single most important demand-side indicator.",
    thresholdRationale: {
      green:
        "2\u20137% \u2014 healthy real growth. Above inflation but not excessive, consistent with a confident consumer.",
      yellow:
        "0\u20132% signals cautious households. 7\u201310% may indicate spending running ahead of income.",
      red: "< 0% \u2014 consumers are cutting spending in real terms, a strong recession signal. > 10% is typically a post-shock rebound.",
    },
  },
  "fiscal-balance": {
    summary:
      "The federal surplus or deficit measures the difference between federal government revenues and outlays. The US has run persistent deficits for most of the past two decades. Shown as a trailing 12-month sum to smooth monthly volatility.",
    thresholdRationale: {
      green:
        "> -$500B \u2014 a moderate deficit relative to the size of the US economy (~$28T GDP), roughly under 2% of GDP.",
      yellow:
        "-$500B to -$1T \u2014 a sizable deficit, in the range of 2\u20134% of GDP. Manageable but limits fiscal flexibility.",
      red: "< -$1T \u2014 a very large deficit exceeding 4% of GDP, typically seen during recessions or major fiscal expansions.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. While the Fed formally targets 2% PCE inflation, CPI is the most widely cited public measure of price stability.",
    thresholdRationale: {
      green:
        "1.5\u20132.5% \u2014 symmetric \u00b10.5pp around the Fed\u2019s 2% PCE target (CPI historically runs ~0.3pp above PCE, making ~2% CPI the target-equivalent). Source: Fed Statement on Longer-Run Goals.",
      yellow:
        "0.5\u20131.5% \u2014 below target; the Fed may consider easing. 2.5\u20134% \u2014 above target; the Fed will typically signal a tightening response.",
      red: "< 0.5% \u2014 deflation risk, significantly below target. > 4% erodes real wages and savings rapidly, typically requiring aggressive rate hikes.",
    },
  },
  wages: {
    summary:
      "Average hourly earnings measure annual growth in wages for all private-sector employees. Real wage growth \u2014 wages rising faster than inflation \u2014 is essential for household living standards.",
    thresholdRationale: {
      green:
        "\u2265 3.5% \u2014 wage growth typically stays ahead of or in line with inflation, meaning workers' real purchasing power is maintained or growing.",
      yellow:
        "2\u20133.5% \u2014 modest growth. If inflation is also in this range, real wages are roughly flat.",
      red: "< 2% \u2014 almost certain real wage cuts when any inflation is present, reducing household disposable income.",
    },
  },
  "real-wages": {
    summary:
      "Real wage growth measures whether workers' pay is rising faster than the cost of living. Calculated as nominal wage growth minus CPI inflation. Positive values mean purchasing power is increasing; negative values mean workers are going backwards.",
    thresholdRationale: {
      green:
        "> +0.5% \u2014 wages are clearly outpacing inflation. Workers' purchasing power is growing.",
      yellow:
        "-0.5% to +0.5% \u2014 wages are roughly tracking inflation. Living standards are flat.",
      red: "< -0.5% \u2014 inflation is outpacing wage growth. Workers' purchasing power is declining.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the civilian labour force actively seeking work but unable to find it. The Fed has a dual mandate to pursue both maximum employment and price stability.",
    thresholdRationale: {
      green:
        "< 4% \u2014 at or below the Fed\u2019s longer-run unemployment estimate of ~4.1%, consistent with maximum employment. Source: Fed Summary of Economic Projections, Dec 2024.",
      yellow:
        "4\u20135.5% \u2014 noticeable slack in the labour market, above the Fed\u2019s NAIRU estimate. Job seekers face harder searches.",
      red: "> 5.5% \u2014 significant labour market distress, well above NAIRU, typically associated with recession conditions.",
    },
  },
  underemployment: {
    summary:
      "The U-6 rate is the broadest measure of labour underutilisation. It includes the unemployed, those marginally attached to the labour force, and those employed part-time for economic reasons.",
    thresholdRationale: {
      green:
        "< 8% \u2014 the labour market is tight enough that most people who want full-time work can find it.",
      yellow:
        "8\u201310% \u2014 a meaningful share of workers are underutilised, suppressing wage growth.",
      red: "> 10% \u2014 widespread underutilisation, typically seen during recessions.",
    },
  },
  "job-openings": {
    summary:
      "JOLTS job openings measure the number of unfilled positions that employers are actively trying to fill. It's a leading indicator of labour demand \u2014 rising openings mean businesses are expanding.",
    thresholdRationale: {
      green:
        "> 8M \u2014 strong employer demand for workers, well above pre-pandemic norms of ~7M.",
      yellow:
        "5\u20138M \u2014 moderate levels. The labour market remains functional but demand may be softening.",
      red: "< 5M \u2014 weak hiring intentions, indicating a labour market under stress.",
    },
  },
  "fed-funds-rate": {
    summary:
      "The federal funds rate is the interest rate at which banks lend reserves to each other overnight. Set by the Federal Reserve's FOMC, it's the primary lever for influencing inflation, employment, and broader financial conditions.",
    thresholdRationale: {
      green:
        "2.5\u20133.5% \u2014 within the Fed\u2019s estimated neutral rate range (median longer-run FFR ~3.0%). At neutral, monetary policy neither stimulates nor restricts activity. Source: Fed SEP, Dec 2024.",
      yellow:
        "1\u20132.5% is stimulatory. 3.5\u20135% is restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 5% creates significant borrowing costs across the economy.",
    },
  },
  "usd-index": {
    summary:
      "The trade-weighted broad US dollar index measures the value of the dollar against a basket of currencies weighted by trade volumes. As the world's reserve currency, dollar strength has global implications for trade and capital flows.",
    thresholdRationale: {
      green:
        "95\u2013115 \u2014 consistent with the dollar's recent historical range. Keeps US exports reasonably competitive while reflecting reserve currency status.",
      yellow:
        "85\u201395 or 115\u2013125 \u2014 outside the normal band. A weak dollar boosts exports but raises import costs; a strong dollar does the reverse.",
      red: "< 85 signals a major confidence shift away from the dollar. > 125 severely hurts US export competitiveness and emerging market dollar-denominated debt.",
    },
  },
  trade: {
    summary:
      "The trade balance is the difference between US exports and imports of goods and services. The US has run persistent trade deficits since the 1970s, reflecting its role as the world's largest consumer market and reserve currency issuer.",
    thresholdRationale: {
      green:
        "> -$50B/month \u2014 a moderate deficit consistent with the structural US trade position.",
      yellow:
        "-$50B to -$80B/month \u2014 a larger deficit that may reflect weakening competitiveness or excessive import demand.",
      red: "< -$80B/month \u2014 a very large deficit, raising concerns about external sustainability.",
    },
  },
  "building-permits": {
    summary:
      "Building permits count new privately-owned housing units authorised for construction. As a leading indicator of housing supply, it signals construction activity 3\u201312 months ahead. Reported as a seasonally adjusted annual rate (SAAR) in thousands.",
    thresholdRationale: {
      green:
        "> 1,400k SAAR \u2014 consistent with the pace needed to meet household formation and replace ageing stock.",
      yellow:
        "1,000\u20131,400k SAAR \u2014 below what long-run demand requires. Housing undersupply builds.",
      red: "< 1,000k SAAR \u2014 critically low, typically seen during housing busts or severe recessions.",
    },
  },
  "housing-starts": {
    summary:
      "Housing starts count new privately-owned housing units where construction has begun. Unlike permits, starts represent actual construction activity and are a key input to GDP through residential investment.",
    thresholdRationale: {
      green:
        "> 1,400k SAAR \u2014 healthy construction activity, approaching the pace needed to address housing shortfalls.",
      yellow:
        "1,000\u20131,400k SAAR \u2014 moderate activity but below long-run requirements.",
      red: "< 1,000k SAAR \u2014 very weak construction, compounding the housing supply deficit.",
    },
  },
};

const ukMetricInfo: Record<string, MetricInfo> = {
  gdp: {
    summary:
      "GDP growth measures the annual percentage change in the total value of goods and services produced in the United Kingdom. The UK is the world's sixth-largest economy by nominal GDP.",
    thresholdRationale: {
      green:
        "1.5\u20134.5% \u2014 at or above the OBR\u2019s estimated potential output growth of ~1\u2154%, and not yet overheating. Source: OBR Economic and Fiscal Outlook, Oct 2024.",
      yellow:
        "0\u20131.5% \u2014 below-potential growth; the labour market may be softening. 4.5\u20136% \u2014 running hot, with risk of inflation and capacity constraints.",
      red: "< 0% \u2014 the economy is contracting (two consecutive negative quarters = recession). > 6% \u2014 extreme overheating, unsustainable for a mature developed economy.",
    },
  },
  "gdp-per-capita": {
    summary:
      "GDP per capita growth measures the annual change in economic output per person. It adjusts for population growth, making it a better gauge of whether living standards are improving.",
    thresholdRationale: {
      green:
        "\u2265 1.5% \u2014 per-capita output is growing comfortably, meaning the average person's share of the economy is expanding.",
      yellow:
        "0\u20131.5% \u2014 the economy is growing per person but below trend. Living standards are broadly flat.",
      red: "< 0% \u2014 the economy is shrinking on a per-person basis, even if total GDP is positive.",
    },
  },
  productivity: {
    summary:
      "Labour productivity \u2014 output per hour worked across the whole UK economy \u2014 is ONS\u2019s headline measure. The UK\u2019s productivity puzzle (persistently weak growth since the 2008 crisis) is a central theme of OBR and Bank of England analysis, since it directly limits how fast real wages can sustainably rise.",
    thresholdRationale: {
      green:
        "\u2265 1.0% \u2014 productivity is growing at or above the trend rate for developed economies. Real wage growth is on firmer ground.",
      yellow:
        "0\u20131.0% \u2014 stagnant productivity, broadly the UK\u2019s post-2008 experience. Output grows only via more hours worked.",
      red: "< 0% \u2014 productivity is shrinking. Each hour worked produces less than a year ago \u2014 a serious structural concern.",
    },
  },
  "retail-sales": {
    summary:
      "Retail sales track the annual change in the volume (quantity bought) of goods sold by retailers. Consumer spending drives around 60% of UK GDP, making this a key pulse check on economic momentum.",
    thresholdRationale: {
      green:
        "2\u20136% \u2014 healthy volume growth. Above inflation but not excessive, consistent with a confident consumer.",
      yellow:
        "0\u20132% signals cautious households. 6\u20139% may indicate spending running ahead of income.",
      red: "< 0% \u2014 retailers experiencing falling sales volumes, a strong recession signal. > 9% is typically a post-shock rebound.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The Bank of England has a 2% CPI inflation target set by the Chancellor.",
    thresholdRationale: {
      green:
        "1.5\u20132.5% \u2014 symmetric \u00b10.5pp around the BoE\u2019s 2% CPI target. Price stability is maintained and the BoE has room to adjust rates without drastic action. Source: Bank of England inflation target mandate.",
      yellow:
        "0.5\u20131.5% or 2.5\u20134% \u2014 outside the comfort zone. If CPI moves more than 1pp from the 2% target, the Governor must write a letter to the Chancellor explaining why.",
      red: "< 0.5% \u2014 deflation risk, well below target. > 4% erodes real wages and savings rapidly, typically requiring aggressive rate rises.",
    },
  },
  wages: {
    summary:
      "Average Weekly Earnings (AWE) measure annual growth in total pay (including bonuses) for employees in Great Britain. Reported as a 3-month average to smooth volatility. Real wage growth \u2014 wages rising faster than inflation \u2014 is essential for household living standards.",
    thresholdRationale: {
      green:
        "\u2265 3.5% \u2014 wage growth typically stays ahead of or in line with inflation, meaning workers' real purchasing power is maintained or growing.",
      yellow:
        "2\u20133.5% \u2014 modest growth. If inflation is also in this range, real wages are roughly flat.",
      red: "< 2% \u2014 almost certain real wage cuts when any inflation is present, reducing household disposable income.",
    },
  },
  "real-wages": {
    summary:
      "Real wage growth measures whether workers' pay is rising faster than the cost of living. Calculated as nominal wage growth (AWE) minus CPI inflation. Positive values mean purchasing power is increasing; negative values mean workers are going backwards.",
    thresholdRationale: {
      green:
        "> +0.5% \u2014 wages are clearly outpacing inflation. Workers' purchasing power is growing.",
      yellow:
        "-0.5% to +0.5% \u2014 wages are roughly tracking inflation. Living standards are flat.",
      red: "< -0.5% \u2014 inflation is outpacing wage growth. Workers' purchasing power is declining.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the labour force actively seeking work but unable to find it, measured by the Labour Force Survey as a 3-month rolling average.",
    thresholdRationale: {
      green:
        "< 4.5% \u2014 at or near the OBR/BoE\u2019s estimated NAIRU of ~4\u20134.5%. Most people who want jobs can find them. Source: OBR Economic and Fiscal Outlook, Oct 2024.",
      yellow:
        "4.5\u20136% \u2014 noticeable slack in the labour market, above estimated NAIRU. Job seekers face harder searches.",
      red: "> 6% \u2014 significant labour market distress, typically associated with recession conditions.",
    },
  },
  "economic-inactivity": {
    summary:
      "The economic inactivity rate measures the share of working-age people (16\u201364) who are neither employed nor actively seeking work \u2014 including students, long-term sick, carers, and early retirees. UK inactivity has been elevated since COVID, driven largely by long-term sickness.",
    thresholdRationale: {
      green:
        "< 21% \u2014 below or near pre-COVID levels (~20.5%). The labour force is large enough to support economic growth.",
      yellow:
        "21\u201322.5% \u2014 elevated inactivity, constraining labour supply and putting upward pressure on wages. A growing policy concern.",
      red: "> 22.5% \u2014 structurally high inactivity rate. A significant share of the working-age population has left the labour force, limiting potential output.",
    },
  },
  "job-vacancies": {
    summary:
      "Job vacancies measure the number of unfilled positions that employers are actively trying to fill. Reported as a 3-month rolling average. Rising vacancies mean businesses are expanding; falling vacancies mean they're pulling back.",
    thresholdRationale: {
      green:
        "> 800k \u2014 strong employer demand for workers, though below the 2022 peak of ~1.3M.",
      yellow:
        "600\u2013800k \u2014 moderate levels. The labour market remains functional but demand is softening.",
      red: "< 600k \u2014 weak hiring intentions, indicating a labour market under stress.",
    },
  },
  "bank-rate": {
    summary:
      "The Bank Rate is the interest rate set by the Bank of England's Monetary Policy Committee (MPC). It's the rate the BoE pays on reserves held by commercial banks, and it flows through to mortgage rates, savings rates, and broader financial conditions.",
    thresholdRationale: {
      green:
        "2.5\u20133.5% \u2014 within the BoE\u2019s estimated neutral rate range (~3\u20133.5%). At neutral, monetary policy neither stimulates nor restricts activity, consistent with inflation at the 2% target. Source: BoE Monetary Policy Report, Nov 2024.",
      yellow:
        "1\u20132.5% is stimulatory (appropriate during downturns but risks inflating assets). 3.5\u20135% is restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 5% is well above neutral \u2014 creates significant mortgage stress for UK households.",
    },
  },
  "gbp-usd": {
    summary:
      "The GBP/USD exchange rate (cable) shows how many US dollars one British pound buys. Sterling is influenced by interest rate differentials, trade flows, and market confidence in the UK economy.",
    thresholdRationale: {
      green:
        "1.20\u20131.40 USD \u2014 consistent with sterling's post-Brexit range. Keeps imports affordable while supporting export competitiveness.",
      yellow:
        "1.10\u20131.20 makes imports noticeably more expensive, adding to domestic inflation. Above 1.40 can hurt UK export competitiveness.",
      red: "< 1.10 signals a major confidence shock (near the 2022 mini-budget crisis low). > 1.50 is historically rare in the post-Brexit era.",
    },
  },
  trade: {
    summary:
      "The trade balance is the difference between UK exports and imports of goods. The UK has run persistent goods trade deficits, partly offset by a surplus in services (not included here).",
    thresholdRationale: {
      green:
        "> -\u00a35B/month \u2014 a narrow goods deficit, manageable within the UK's overall trade position.",
      yellow:
        "-\u00a35B to -\u00a310B/month \u2014 a moderate deficit consistent with the UK's structural goods trade position.",
      red: "< -\u00a310B/month \u2014 a very wide goods deficit, raising concerns about external competitiveness.",
    },
  },
};

const caMetricInfo: Record<string, MetricInfo> = {
  gdp: {
    summary:
      "GDP growth measures the annual percentage change in the total value of goods and services produced in Canada. Canada is the world's ninth-largest economy by nominal GDP, with a highly trade-dependent structure.",
    thresholdRationale: {
      green:
        "2\u20135.5% \u2014 at or above the BoC\u2019s estimated potential growth rate of ~2%, and not yet overheating. Source: Bank of Canada Monetary Policy Report.",
      yellow:
        "0\u20132% \u2014 below-potential growth; jobs may not be created fast enough to keep pace with population growth. 5.5\u20137.5% \u2014 running hot, with risk of inflation and capacity constraints.",
      red: "< 0% \u2014 the economy is contracting (two consecutive negative quarters = recession). > 7.5% \u2014 extreme overheating, unsustainable for a mature developed economy.",
    },
  },
  "gdp-per-capita": {
    summary:
      "GDP per capita growth measures the annual change in economic output per person. Unlike total GDP, it adjusts for population growth \u2014 making it the better gauge of whether living standards are actually improving. Canada\u2019s population has grown rapidly in recent years due to high immigration, making per-capita growth especially important.",
    thresholdRationale: {
      green:
        "\u2265 1.5% \u2014 per-capita output is growing comfortably, meaning the average person\u2019s share of the economy is expanding.",
      yellow:
        "0\u20131.5% \u2014 the economy is growing per person but below trend. Living standards are broadly flat.",
      red: "< 0% \u2014 the economy is shrinking on a per-person basis. Canada\u2019s high immigration rate means total GDP can grow while per-capita output falls.",
    },
  },
  "retail-sales": {
    summary:
      "Retail sales track the annual change in the volume of goods sold by retailers. Consumer spending drives a significant share of Canadian GDP, making this a key pulse check on economic momentum.",
    thresholdRationale: {
      green:
        "2\u20136% \u2014 healthy volume growth. Above inflation but not excessive, consistent with a confident consumer.",
      yellow:
        "0\u20132% signals cautious households. 6\u20139% may indicate spending running ahead of income.",
      red: "< 0% \u2014 retailers experiencing falling sales volumes, a strong recession signal. > 9% is typically a post-shock rebound.",
    },
  },
  cpi: {
    summary:
      "The Consumer Price Index tracks the annual change in the price of a representative basket of goods and services. The Bank of Canada targets 2% inflation, with a 1\u20133% control range.",
    thresholdRationale: {
      green:
        "1\u20133% \u2014 within the BoC\u2019s formal 1\u20133% control range (target midpoint 2%). Price stability is maintained and the BoC has room to adjust rates without drastic action. Source: Bank of Canada inflation target.",
      yellow:
        "0\u20131% or 3\u20134% \u2014 outside the control range. The BoC will typically signal a policy response to bring inflation back to the 2% midpoint.",
      red: "< 0% risks deflation and economic stagnation. > 4% erodes real wages and savings rapidly, typically requiring aggressive rate rises.",
    },
  },
  wages: {
    summary:
      "Wage growth measures the annual change in manufacturing hourly earnings, the best available proxy on FRED for Canadian wage dynamics. Real wage growth \u2014 wages rising faster than inflation \u2014 is essential for household living standards.",
    thresholdRationale: {
      green:
        "\u2265 3% \u2014 wage growth typically stays ahead of or in line with inflation, meaning workers' real purchasing power is maintained or growing.",
      yellow:
        "2\u20133% \u2014 modest growth. If inflation is also in this range, real wages are roughly flat.",
      red: "< 2% \u2014 almost certain real wage cuts when any inflation is present, reducing household disposable income.",
    },
  },
  "real-wages": {
    summary:
      "Real wage growth measures whether workers' pay is rising faster than the cost of living. Calculated as nominal wage growth minus CPI inflation. Positive values mean purchasing power is increasing; negative values mean workers are going backwards.",
    thresholdRationale: {
      green:
        "> +0.5% \u2014 wages are clearly outpacing inflation. Workers' purchasing power is growing.",
      yellow:
        "-0.5% to +0.5% \u2014 wages are roughly tracking inflation. Living standards are flat.",
      red: "< -0.5% \u2014 inflation is outpacing wage growth. Workers' purchasing power is declining.",
    },
  },
  unemployment: {
    summary:
      "The unemployment rate is the share of the labour force actively seeking work but unable to find it. Canada's natural rate of unemployment is structurally higher than peer economies due to regional diversity and labour market flexibility.",
    thresholdRationale: {
      green:
        "< 5.5% \u2014 at or near the BoC\u2019s estimated NAIRU of ~5.5\u20136%. Most people who want jobs can find them without causing wage-driven inflation. Source: Bank of Canada Monetary Policy Report.",
      yellow:
        "5.5\u20137% \u2014 noticeable slack in the labour market, above estimated NAIRU. Job seekers face harder searches; weaker household incomes put pressure on consumer spending.",
      red: "> 7% \u2014 significant labour market distress, typically associated with recession conditions.",
    },
  },
  "policy-rate": {
    summary:
      "The Bank of Canada's policy interest rate influences borrowing costs across the economy. It flows through to mortgage rates, business loans, and the Canadian dollar. Tracked here via the 3-month interbank rate as a close proxy.",
    thresholdRationale: {
      green:
        "2.25\u20133.25% \u2014 within the BoC\u2019s estimated neutral rate range. At neutral, monetary policy neither stimulates nor restricts activity, consistent with inflation at the 2% target. Source: BoC Staff Analytical Note 2024-9.",
      yellow:
        "1\u20132.25% is stimulatory (appropriate during downturns but risks inflating assets). 3.25\u20134.5% is restrictive, used to cool above-target inflation.",
      red: "< 1% are emergency lows that distort asset markets. > 4.5% creates significant mortgage stress for Canadian households, who carry high household debt ratios.",
    },
  },
  "cad-usd": {
    summary:
      "The CAD/USD exchange rate shows how many US dollars one Canadian dollar buys. The loonie is heavily influenced by commodity prices (especially oil), interest rate differentials, and trade flows with the US.",
    thresholdRationale: {
      green:
        "0.72\u20130.82 USD \u2014 consistent with the Canadian dollar's recent historical range. Keeps imports affordable while supporting export competitiveness.",
      yellow:
        "0.65\u20130.72 makes imports more expensive, adding to domestic inflation. Above 0.82 can hurt Canadian export competitiveness.",
      red: "< 0.65 signals a major confidence shock or commodity price collapse. > 0.88 is historically rare and would significantly hurt exporters.",
    },
  },
  trade: {
    summary:
      "The trade balance is the difference between Canadian exports and imports of goods. Canada's trade position is heavily influenced by commodity exports (oil, minerals, agriculture) and manufactured goods imports.",
    thresholdRationale: {
      green:
        "> C$0B/month \u2014 a trade surplus, reflecting strong commodity export revenues.",
      yellow:
        "-C$5B to C$0B/month \u2014 a moderate deficit, which may reflect weak commodity prices or strong import demand.",
      red: "< -C$5B/month \u2014 a wide trade deficit, raising concerns about external competitiveness.",
    },
  },
};

const allMetricInfo: Record<CountryCode, Record<string, MetricInfo>> = {
  au: auMetricInfo,
  nz: nzMetricInfo,
  us: usMetricInfo,
  uk: ukMetricInfo,
  ca: caMetricInfo,
};

export function getMetricInfo(country: CountryCode): Record<string, MetricInfo> {
  return allMetricInfo[country];
}
