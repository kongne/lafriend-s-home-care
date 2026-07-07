export const CURRENCIES = {
  XAF: { symbol: "FCFA", rate: 1, decimals: 0 },
  EUR: { symbol: "€",    rate: 1 / 655.957, decimals: 2 },
  USD: { symbol: "$",    rate: 1 / 600, decimals: 2 },
} as const;

export type CurrencyKey = keyof typeof CURRENCIES;

export const fmt = (fcfa: number, cur: CurrencyKey) => {
  const c = CURRENCIES[cur];
  const v = fcfa * c.rate;
  return `${v.toLocaleString(undefined, { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals })} ${c.symbol}`;
};
