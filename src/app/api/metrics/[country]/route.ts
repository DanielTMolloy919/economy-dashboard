import { NextResponse } from "next/server";
import { isValidCountry } from "~/config/countries";
import { getAllMetrics } from "~/lib/data";

export function GET(
  _req: Request,
  { params }: { params: Promise<{ country: string }> },
) {
  return params.then(({ country }) => {
    if (!isValidCountry(country)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(getAllMetrics(country));
  });
}
