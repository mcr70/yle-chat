import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLanguage = 'fi' | 'en';

const LANGUAGE_STORAGE_KEY = 'app_user_language';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly supportedLanguages: readonly SupportedLanguage[] = ['fi', 'en'];
  readonly defaultLanguage: SupportedLanguage = 'en';
  readonly currentLang = signal<SupportedLanguage>(this.defaultLanguage);

  initLanguage(): void {
    this.translate.addLangs([...this.supportedLanguages]);
    this.translate.setFallbackLang(this.defaultLanguage);
    this.setLanguage(this.determineInitialLanguage());
  }

  setLanguage(language: SupportedLanguage): void {
    const selectedLanguage = this.supportedLanguages.includes(language)
      ? language
      : this.defaultLanguage;

    this.translate.use(selectedLanguage);
    this.currentLang.set(selectedLanguage);
    this.document.documentElement.lang = selectedLanguage;
    localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguage);
  }

  private determineInitialLanguage(): SupportedLanguage {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (this.isSupportedLanguage(savedLanguage)) {
      return savedLanguage;
    }

    const browserLanguage = this.getBrowserLanguage();
    return browserLanguage ?? this.defaultLanguage;
  }

  private getBrowserLanguage(): SupportedLanguage | null {
    const browserLanguages = navigator.languages?.length
      ? navigator.languages
      : [navigator.language];

    for (const language of browserLanguages) {
      const baseLanguage = language.toLowerCase().split('-')[0];
      if (this.isSupportedLanguage(baseLanguage)) {
        return baseLanguage;
      }
    }

    return null;
  }

  private isSupportedLanguage(language: string | null): language is SupportedLanguage {
    return language !== null && this.supportedLanguages.includes(language as SupportedLanguage);
  }
}
