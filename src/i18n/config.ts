/** i18next setup: English/Arabic resources, localStorage persistence, and RTL document sync. */

import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import { logger } from "../utils/logger";
import auth_ar from "./locales/ar/auth.json";
import common_ar from "./locales/ar/common.json";
import auth_en from "./locales/en/auth.json";
import common_en from "./locales/en/common.json";
import type { AppLanguage } from "./languages";
import { isAppLanguage, isRtlLanguage } from "./languages";

const LANGUAGE_STORAGE_KEY = "academy-hub-language";
const DEFAULT_LANGUAGE: AppLanguage = "en";

/**
 * Read the language stored from a previous visit, if any.
 *
 * @returns The stored language, or the app default if none/unrecognized is stored.
 */
function readStoredLanguage(): AppLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored && isAppLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

/**
 * Apply a language's writing direction to the document root.
 *
 * @param language - The language now active.
 */
function applyDocumentDirection(language: AppLanguage): void {
  document.documentElement.lang = language;
  document.documentElement.dir = isRtlLanguage(language) ? "rtl" : "ltr";
}

// Set direction synchronously (before init resolves) so the first paint isn't
// briefly rendered in the wrong direction for a returning Arabic-language user.
applyDocumentDirection(readStoredLanguage());

i18next
  .use(initReactI18next)
  .init({
    lng: readStoredLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ["en", "ar"],
    defaultNS: "common",
    resources: {
      en: { common: common_en, auth: auth_en },
      ar: { common: common_ar, auth: auth_ar },
    },
    interpolation: { escapeValue: false },
  })
  .catch((error: unknown) => {
    logger.error("i18next initialization failed", { error });
  });

// Every language switch - however it's triggered - persists and flips <html dir> here,
// so callers (AuthContext, ProfileModal, a page's language switcher) only ever need to
// call i18next.changeLanguage() and get persistence/RTL for free.
i18next.on("languageChanged", (language) => {
  if (!isAppLanguage(language)) return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  applyDocumentDirection(language);
});

export { i18next };
