/** Browser-safe logging wrapper; DEBUG output is stripped from production builds. */

type LogFields = Record<string, unknown>;

const isDev = import.meta.env.DEV;

function debug(message: string, fields?: LogFields): void {
  if (isDev) {
    console.debug(message, fields ?? {});
  }
}

function info(message: string, fields?: LogFields): void {
  console.info(message, fields ?? {});
}

function warn(message: string, fields?: LogFields): void {
  console.warn(message, fields ?? {});
}

function error(message: string, fields?: LogFields): void {
  console.error(message, fields ?? {});
}

export const logger = { debug, info, warn, error };
