import { Component, Input, Output, EventEmitter, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LoginPanelComponent } from '@components/login-panel/login-panel.component';
import { RefreshService } from '@app/services/resfresh.service';
import { SpinnerComponent } from '@components/spinner/spinner.component';
import { Provider } from '@app/models/provider';
import { LanguageSelectorComponent } from '@components/language-selector/language-selector.component';

const CURRENT_INFO_VERSION = '1.0';
const INFO_VERSION_KEY = 'app_info_seen_version';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [TranslatePipe, LoginPanelComponent, SpinnerComponent, LanguageSelectorComponent],
  templateUrl: './toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./toolbar.component.scss', './info-dialog.scss']
})
export class ToolbarComponent implements OnInit {
  @Input() provider?: Provider;
  @Input() title: string = '';
  @Input() showHomeButton: boolean = true;
  @Input() showMenuToggle: boolean = false;
  @Input() showLoginButton: boolean = false;

  // Event emitted when the menu toggle button is clicked (mobile view)
  @Output() toggleMenu = new EventEmitter<void>();

  isRefreshing = signal(false);
  isInfoModalOpen = signal(false);
  isPreferencesOpen = signal(false);

  constructor(
    private router: Router,
    private refreshService: RefreshService
  ) {}

  ngOnInit(): void {
    this.checkIfInfoModalShouldOpen();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  onToggleMenu(): void {
    this.toggleMenu.emit();
  }

  openInfoModal(): void {
    this.isInfoModalOpen.set(true);
  }

  closeInfoModal(): void {
    this.isInfoModalOpen.set(false);
    localStorage.setItem(INFO_VERSION_KEY, CURRENT_INFO_VERSION);
  }

  togglePreferences(): void {
    this.isPreferencesOpen.update(v => !v);
  }

  closePreferences(): void {
    this.isPreferencesOpen.set(false);
  }

  onRefresh(): void {
    this.refreshService.triggerRefresh();

    this.isRefreshing.set(true);
    setTimeout(() => {
      this.isRefreshing.set(false);
    }, 1000); // Reset the refresh state after 1 second
  }

  private checkIfInfoModalShouldOpen(): void {
    const savedVersion = localStorage.getItem(INFO_VERSION_KEY);
    if (!savedVersion || savedVersion !== CURRENT_INFO_VERSION) {
      this.isInfoModalOpen.set(true);
    }
  }
}