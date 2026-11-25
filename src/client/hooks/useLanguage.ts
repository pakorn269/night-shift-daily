import { useCallback, useState } from 'react';
import { DEFAULT_LANGUAGE, type Language } from '../../shared/i18n.ts';

const STORAGE_KEY = 'night-shift-daily:lang';

const readInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const params = new URLSearchParams(window.location.search);
  const queryLang = params.get('lang');
  if (queryLang === 'th' || queryLang === 'en') {
    return queryLang;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'th' || stored === 'en') {
      return stored;
    }
  } catch {
    // Ignore storage access errors inside sandboxed iframes.
  }

  return DEFAULT_LANGUAGE;
};

export const useLanguage = () => {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage access errors inside sandboxed iframes.
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'en' ? 'th' : 'en';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore storage access errors inside sandboxed iframes.
      }
      return next;
    });
  }, []);

  return {
    language,
    setLanguage,
    toggleLanguage,
  };
};
