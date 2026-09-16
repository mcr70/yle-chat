import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateService: TranslateService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        LanguageService
      ]
    });

    service = TestBed.inject(LanguageService);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Verifies service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests setting language updates translate service, signal, document lang and localStorage
  it('should update language across signal, translate service, and localStorage', () => {
    service.setLanguage('fi');

    const currentTranslateLang = typeof translateService.currentLang === 'function' 
      ? (translateService.currentLang as any)() 
      : translateService.currentLang;

    expect(service.currentLang()).toBe('fi');
    expect(service.currentLocale()).toBe('fi-FI');
    expect(currentTranslateLang).toBe('fi');
    expect(localStorage.getItem('app_user_language')).toBe('fi');
    expect(document.documentElement.lang).toBe('fi');
  });

  // Tests falling back to default language if unsupported language is passed
  it('should fallback to default language when unsupported language is passed', () => {
    service.setLanguage('de' as any);

    expect(service.currentLang()).toBe('en');
    expect(service.currentLocale()).toBe('en-US');
    expect(localStorage.getItem('app_user_language')).toBe('en');
  });

  // Tests initLanguage using saved language from localStorage
  it('should initialize language from saved localStorage preference', () => {
    localStorage.setItem('app_user_language', 'fi');

    service.initLanguage();

    const currentTranslateLang = typeof translateService.currentLang === 'function' 
      ? (translateService.currentLang as any)() 
      : translateService.currentLang;

    expect(service.currentLang()).toBe('fi');
    expect(currentTranslateLang).toBe('fi');
  });
});
