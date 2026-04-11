"use client";

import { useRouter } from "next/navigation";
import type { CountryCode } from "~/config/countries";
import { countries, validCountryCodes } from "~/config/countries";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "~/components/ui/combobox";

interface CountryItem {
  value: CountryCode;
  label: string;
}

const countryItems: CountryItem[] = validCountryCodes.map((code) => ({
  value: code,
  label: `${countries[code].flag} ${countries[code].name}`,
}));

export function CountrySwitcher({ current }: { current: CountryCode }) {
  const router = useRouter();
  const currentItem = countryItems.find((item) => item.value === current)!;

  return (
    <Combobox
      items={countryItems}
      value={currentItem}
      onValueChange={(item) => {
        if (item && item.value !== current) {
          router.push(`/${item.value}`);
        }
      }}
    >
      <ComboboxInput
        placeholder="Select country"
        className="w-52"
      />
      <ComboboxContent>
        <ComboboxEmpty>No countries found.</ComboboxEmpty>
        <ComboboxList>
          {(item: CountryItem) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
