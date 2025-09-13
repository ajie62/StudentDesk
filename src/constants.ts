import currencyCodes from "currency-codes";
import getSymbolFromCurrency from "currency-symbol-map";

export const FAVORITE_CURRENCIES = ["EUR", "USD", "CNY", "JPY", "GBP"];

export const CURRENCIES = currencyCodes.data
  .map((c) => ({
    value: c.code,
    label: `${c.currency} (${getSymbolFromCurrency(c.code) || c.code})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function getCurrencyLabel(code: string | null | undefined): string {
  if (!code) return "—";
  return CURRENCIES.find((c) => c.value === code)?.label || code;
}

export const FAVORITES = FAVORITE_CURRENCIES.map(
  (code) => CURRENCIES.find((c) => c.value === code)!
).filter(Boolean);

export const OTHERS = CURRENCIES.filter((c) => !FAVORITE_CURRENCIES.includes(c.value));
