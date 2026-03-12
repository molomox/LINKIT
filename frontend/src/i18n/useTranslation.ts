"use client";
import { useTranslationContext } from './TranslationProvider';

/**
 * Hook pour accéder aux traductions
 * Usage: const { t, locale, setLocale } = useTranslation();
 * 
 * Exemples:
 * - Simple: t.auth.login
 * - Avec variables: t.message.placeholder.replace('{channel}', channelName)
 */
export function useTranslation() {
  return useTranslationContext();
}

/**
 * Fonction utilitaire pour remplacer les variables dans les traductions
 * Usage: interpolate(t.error.network, { message: 'Connection lost' })
 */
export function interpolate(text: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    text
  );
}
