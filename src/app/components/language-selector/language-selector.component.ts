
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LanguageService, SupportedLanguage } from '@app/services/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './language-selector.component.html',
  styleUrls: ['./language-selector.component.scss']
})
export class LanguageSelectorComponent {
  private readonly languageService = inject(LanguageService);

  @Output() readonly languageSelected = new EventEmitter<SupportedLanguage>();

  readonly currentLang = this.languageService.currentLang;
  readonly languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'fi', label: 'Suomi' },
    { code: 'en', label: 'English' }
  ];

  selectLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language);
    this.languageSelected.emit(language);
  }
}
