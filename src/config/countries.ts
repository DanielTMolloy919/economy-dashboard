export type CountryCode = "au" | "nz";

export interface CountryConfig {
  flag: string;
  name: string;
  currency: string;
  locale: string;
  dataSources: string;
}

export const countries: Record<CountryCode, CountryConfig> = {
  au: {
    flag: "\u{1F1E6}\u{1F1FA}",
    name: "Australian",
    currency: "A$",
    locale: "en-AU",
    dataSources: "World Bank, RBA, and ABS",
  },
  nz: {
    flag: "\u{1F1F3}\u{1F1FF}",
    name: "New Zealand",
    currency: "NZ$",
    locale: "en-NZ",
    dataSources: "Stats NZ, RBNZ, and NZ Treasury",
  },
};

export const validCountryCodes = Object.keys(countries) as CountryCode[];

export function isValidCountry(code: string): code is CountryCode {
  return validCountryCodes.includes(code as CountryCode);
}
