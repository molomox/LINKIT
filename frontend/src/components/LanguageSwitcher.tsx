"use client";
import { useTranslation } from '@/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setLocale('fr')}
        className={`px-4 py-2 font-bold uppercase text-xs transition-all ${
          locale === 'fr'
            ? 'bg-yellow-400 text-black border-2 border-yellow-400'
            : 'bg-transparent text-yellow-400 border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-black'
        }`}
        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
      >
        FR
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-4 py-2 font-bold uppercase text-xs transition-all ${
          locale === 'en'
            ? 'bg-yellow-400 text-black border-2 border-yellow-400'
            : 'bg-transparent text-yellow-400 border-2 border-yellow-400/50 hover:bg-yellow-400 hover:text-black'
        }`}
        style={{ fontFamily: 'monospace', clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)" }}
      >
        EN
      </button>
    </div>
  );
}
