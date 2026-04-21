"use client";

import type { CountryCode } from "~/config/countries";
import { countries, validCountryCodes, isValidCountry } from "~/config/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export function CountrySwitcher({
  current,
  onSelect,
}: {
  current: CountryCode;
  onSelect: (code: CountryCode) => void;
}) {
  return (
    <Select value={current} onValueChange={(v) => { if (v && isValidCountry(v)) onSelect(v); }}>
      <SelectTrigger className="w-52">
        <SelectValue>
          {countries[current].flag} {countries[current].name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {validCountryCodes.map((code) => (
          <SelectItem key={code} value={code}>
            {countries[code].flag} {countries[code].name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
