import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { LanguageService } from './services/language.service';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let languageService: LanguageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        LanguageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    languageService = TestBed.inject(LanguageService);
    fixture.detectChanges();
  });

  // Verifies root app component creation
  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  // Verifies default title
  it(`should have title 'yle-chat'`, () => {
    expect(component.title).toEqual('yle-chat');
  });

  // Verifies LanguageService initialization on component lifecycle
  it('should initialize language on ngOnInit', () => {
    expect(languageService.currentLang()).toBeDefined();
  });
});
