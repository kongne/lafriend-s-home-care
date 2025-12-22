export const isDev = typeof import.meta !== 'undefined' && Boolean((import.meta as any).env?.DEV);

export const log = (...args: unknown[]) => {
  if (isDev) console.log(...args);
};

export const info = (...args: unknown[]) => {
  if (isDev) console.info(...args);
};

export const warn = (...args: unknown[]) => {
  if (isDev) console.warn(...args);
};

export const error = (...args: unknown[]) => {
  if (isDev) console.error(...args);
};
