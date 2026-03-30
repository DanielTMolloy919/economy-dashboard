# ABS SDMX API Notes

## Correct Accept headers

The ABS API is picky about Accept headers. Use these:

- **Fetching data**: `Accept: application/vnd.sdmx.data+json;version=2.0`
- **Fetching dataflow list**: `Accept: application/vnd.sdmx.structure+json;charset=utf-8;version=1.0`

Using the wrong header returns a 406 with a list of what it actually accepts.

## Finding a dataflow

```bash
curl -s -H "Accept: application/vnd.sdmx.structure+json;charset=utf-8;version=1.0" \
  "https://data.api.abs.gov.au/rest/dataflow/ABS" | \
  python3 -c "import json,sys; [print(f['id'],'-',f['name']) for f in json.load(sys.stdin)['data']['dataflows']]"
```

## Finding dimension keys for a dataflow

Fetch a small slice of all data and inspect the `structures[0].dimensions.series` block:

```bash
curl -s -H "Accept: application/vnd.sdmx.data+json;version=2.0" \
  "https://data.api.abs.gov.au/rest/data/ABS,{DATAFLOW},{VERSION}/all?startPeriod=2024-Q1&detail=dataonly&format=jsondata" | \
  python3 -c "
import json,sys
s = json.load(sys.stdin)['data']['structures'][0]
for d in s['dimensions']['series']:
    print(d['id'], ':', [(v['id'], v['name']) for v in d['values'][:6]])
"
```

## URL format

```
https://data.api.abs.gov.au/rest/data/{agencyId},{dataflowId},{version}/{key}?startPeriod=...&detail=dataonly&format=jsondata
```

- `agencyId` is always `ABS`
- `version` — must be correct, e.g. CPI is `2.0.0` not `1.0.0`. Check via the dataflow list or try `all` and see if it 404s.
- `key` — dot-separated dimension values in order, use empty string (double dot `..`) for wildcard

## Gotchas encountered

**CPI must be v2.0.0** — `ABS,CPI,1.0.0` returns 404. The current version is 2.0.0.

**CPI has 5 dimensions, not 4** — `MEASURE.INDEX.TSEST.REGION.FREQ`. TSEST (adjustment type) can't be omitted, use wildcard: `1.10001..50.Q`.

**WPI key** — correct key is `1.THRPEB.7.TOT.20.AUS.Q`. Common mistakes:
  - `SECTOR=3` (Commonwealth only) should be `7` (Private+Public)
  - `INDUSTRY=1` is invalid, should be `TOT` (all industries)

**Unemployment measure** — `M13` is the unemployment rate %. `M4` is the count of unemployed full-time job seekers — easy to mix up and get values like 433%.

## YoY from index numbers

ABS often returns index numbers rather than % changes. Compute YoY manually:

```ts
function toYoY(series: MetricSeries[], periodsPerYear: number): MetricSeries[] {
  return series.slice(periodsPerYear).map((p, i) => {
    const prev = series[i]!;
    return { date: p.date, value: Math.round(((p.value - prev.value) / prev.value) * 100 * 10) / 10 };
  });
}
```

Use `periodsPerYear = 4` for quarterly, `12` for monthly.

## Date parsing

- Monthly: `"2024-11"` → append `-01`
- Quarterly: `"2024-Q3"` → Q3 = month 7 → `"2024-07-01"`
