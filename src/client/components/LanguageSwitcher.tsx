import type { Language } from '../../shared/i18n.ts';

type LanguageSwitcherProps = {
  readonly language: Language;
  readonly onChange: (lang: Language) => void;
};

export const LanguageSwitcher = ({
  language,
  onChange,
}: LanguageSwitcherProps) => {
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center overflow-hidden rounded border border-slate-700 bg-slate-900 font-mono text-[10px]"
    >
      <button
        type="button"
        onClick={() => onChange('en')}
        aria-pressed={language === 'en'}
        className={`cursor-pointer px-1.5 py-0.5 transition-colors ${
          language === 'en'
            ? 'bg-amber-400 font-bold text-slate-950'
            : 'text-slate-300 hover:text-slate-100'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange('th')}
        aria-pressed={language === 'th'}
        className={`cursor-pointer border-l border-slate-700 px-1.5 py-0.5 transition-colors ${
          language === 'th'
            ? 'bg-amber-400 font-bold text-slate-950'
            : 'text-slate-300 hover:text-slate-100'
        }`}
      >
        ไทย
      </button>
    </div>
  );
};
