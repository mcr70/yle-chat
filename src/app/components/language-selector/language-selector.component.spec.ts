import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageSelectorComponent } from './language-selector.component';
import { LanguageService } from '@app/services/language.service';

describe('LanguageSelectorComponent', () => {
  let component: LanguageSelectorComponent;
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let languageService: LanguageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [
        provideTranslateService(),
        LanguageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    languageService = TestBed.inject(LanguageService);
    fixture.detectChanges();
  });

  // Verifies component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Verifies available languages list
  it('should have Finnish and English as available languages', () => {
    expect(component.languages.length).toBe(2);
    expect(component.languages.map(l => l.code)).toEqual(['fi', 'en']);
  });

  // Tests selecting language triggers service update and emits event
  it('should call LanguageService and emit event on selectLanguage', () => {
    let emittedLang: string | null = null;
    component.languageSelected.subscribe(lang => {
      emittedLang = lang;
    });

    component.selectLanguage('fi');

    expect(languageService.currentLang()).toBe('fi');
    expect(emittedLang).toBe('fi');
  });
});
