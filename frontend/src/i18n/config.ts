import { fr } from './locales/fr';
import { en } from './locales/en';

export type Locale = 'fr' | 'en';

export const locales: Record<Locale, typeof fr> = {
  fr,
  en,
};

export const defaultLocale: Locale = 'fr';

// Clé pour stocker la langue dans localStorage
export const LOCALE_STORAGE_KEY = 'app_locale';
