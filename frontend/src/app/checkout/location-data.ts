import { Country, State, City } from "country-state-city";
import type { ComboOption } from "./Combobox";
import type { DialOption } from "./PhoneField";

/** Turn an ISO2 code into its flag emoji (regional indicator symbols). */
function isoToFlag(iso: string): string {
  if (!iso || iso.length !== 2) return "";
  return iso
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

const allCountries = Country.getAllCountries();

/** Country combobox options — flag prefix + name, keyed by ISO2. */
export const countryOptions: ComboOption[] = allCountries.map((c) => ({
  value: c.isoCode,
  label: c.name,
  prefix: isoToFlag(c.isoCode),
}));

/** Dial-code options for the phone picker. */
export const dialOptions: DialOption[] = allCountries
  .filter((c) => c.phonecode)
  .map((c) => ({
    isoCode: c.isoCode,
    name: c.name,
    flag: isoToFlag(c.isoCode),
    dialCode: c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** State/province combobox options for a country ISO2. Empty if none. */
export function stateOptions(countryIso: string): ComboOption[] {
  if (!countryIso) return [];
  return State.getStatesOfCountry(countryIso).map((s) => ({
    value: s.isoCode,
    label: s.name,
  }));
}

/** City combobox options for a country + state ISO2. Empty if none. */
export function cityOptions(countryIso: string, stateIso: string): ComboOption[] {
  if (!countryIso || !stateIso) return [];
  return City.getCitiesOfState(countryIso, stateIso).map((c) => ({
    value: c.name,
    label: c.name,
  }));
}
