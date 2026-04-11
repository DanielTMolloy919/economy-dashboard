export type CountryCode = "au" | "nz" | "us" | "uk";

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
    dataSources: "FRED and NZ Treasury",
  },
  us: {
    flag: "\u{1F1FA}\u{1F1F8}",
    name: "United States",
    currency: "$",
    locale: "en-US",
    dataSources: "FRED (Federal Reserve Bank of St. Louis)",
  },
  uk: {
    flag: "\u{1F1EC}\u{1F1E7}",
    name: "United Kingdom",
    currency: "£",
    locale: "en-GB",
    dataSources: "ONS and Bank of England",
  },
};

export const validCountryCodes = Object.keys(countries) as CountryCode[];

export function isValidCountry(code: string): code is CountryCode {
  return validCountryCodes.includes(code as CountryCode);
}
