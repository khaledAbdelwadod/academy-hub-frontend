/** A compact language toggle for anonymous pages; signed-in users set their language via My Profile instead. */

import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";

import { LANGUAGE_OPTIONS } from "../../i18n/languages";
import type { AppLanguage } from "../../i18n/languages";
import { logger } from "../../utils/logger";

export function LanguageSwitcher(): ReactElement {
  const { i18n } = useTranslation();

  function handleSelect(language: AppLanguage): void {
    i18n.changeLanguage(language).catch((error: unknown) => {
      logger.error("Failed to switch language", { error });
    });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 p-1 backdrop-blur-md">
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleSelect(option.value)}
          aria-pressed={i18n.language === option.value}
          className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
            i18n.language === option.value ? "bg-white text-black" : "text-white/80 hover:text-white"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
