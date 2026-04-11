import Link from "next/link";
import type { CountryCode } from "~/config/countries";
import { countries, validCountryCodes } from "~/config/countries";

export function CountrySwitcher({ current }: { current: CountryCode }) {
  return (
    <div className="flex items-center gap-1">
      {validCountryCodes.map((code) => (
        <Link
          key={code}
          href={`/${code}`}
          className={`px-1.5 py-0.5 rounded text-sm transition-colors ${
            code === current
              ? "bg-muted font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          aria-current={code === current ? "page" : undefined}
          title={`${countries[code].name} Economy`}
        >
          {countries[code].flag}
        </Link>
      ))}
    </div>
  );
}
