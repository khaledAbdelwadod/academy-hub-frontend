/** Supported app languages, their RTL/label metadata, and type guards for them. */

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const RTL_LANGUAGES: ReadonlySet<AppLanguage> = new Set(["ar"]);

export interface LanguageOption {
  value: AppLanguage;
  label: string;
}

/** Each language's own name, shown in its own script (not translated). */
export const LANGUAGE_OPTIONS: ReadonlyArray<LanguageOption> = [
  { value: "en", label: "English" },
  { value: "ar", label: "العربية" },
];

/**
 * Narrow an arbitrary string to a supported app language.
 *
 * @param value - The value to check (e.g. from localStorage or an API response).
 * @returns True if `value` is one of `SUPPORTED_LANGUAGES`.
 */
export function isAppLanguage(value: string): value is AppLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Whether a language is written right-to-left.
 *
 * @param language - The language to check.
 * @returns True for Arabic, false otherwise.
 */
export function isRtlLanguage(language: AppLanguage): boolean {
  return RTL_LANGUAGES.has(language);
}
