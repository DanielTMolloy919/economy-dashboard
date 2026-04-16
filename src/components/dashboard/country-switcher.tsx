"use client";

import Link from "next/link";
import { ChevronDownIcon } from "lucide-react";
import type { CountryCode } from "~/config/countries";
import { countries, validCountryCodes } from "~/config/countries";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export function CountrySwitcher({ current }: { current: CountryCode }) {
  return (
    <Popover>
      <PopoverTrigger className="flex h-8 w-52 items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50">
        <span className="flex items-center gap-1.5">
          {countries[current].flag} {countries[current].name}
        </span>
        <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        className="w-52 gap-0.5 p-1"
      >
        {validCountryCodes.map((code) => (
          <Link
            key={code}
            href={`/${code}`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
              code === current && "bg-accent text-accent-foreground font-medium",
            )}
          >
            {countries[code].flag} {countries[code].name}
          </Link>
        ))}
      </PopoverContent>
    </Popover>
  );
}
