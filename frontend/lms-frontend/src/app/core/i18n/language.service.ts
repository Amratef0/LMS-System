import { Injectable, signal, effect } from '@angular/core';
import { Lang, TRANSLATIONS } from './translations';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  // Default is always English, even if nothing is stored yet.
  lang = signal<Lang>((localStorage.getItem('lang') as Lang) || 'en');

  constructor() {
    effect(() => {
      const current = this.lang();
      localStorage.setItem('lang', current);
      document.documentElement.setAttribute('lang', current === 'ar' ? 'ar' : 'en');
      document.documentElement.setAttribute('dir', current === 'ar' ? 'rtl' : 'ltr');
    });
  }

  setLang(lang: Lang) {
    this.lang.set(lang);
  }

  toggle() {
    this.lang.set(this.lang() === 'en' ? 'ar' : 'en');
  }

  translate(key: string, params: string[] = []): string {
    const entry = TRANSLATIONS[key];
    if (!entry) return key; // fallback: show the key itself so missing translations are obvious during dev
    let text = entry[this.lang()] || entry['en'] || key;
    params.forEach((p, i) => { text = text.replace(`{${i}}`, p); });
    return text;
  }
}
