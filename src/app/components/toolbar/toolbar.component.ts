import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginPanelComponent } from '@components/login-panel/login-panel.component';
import { RefreshService } from '@app/services/resfresh.service';
import { SpinnerComponent } from '@components/spinner/spinner.component';

const CURRENT_INFO_VERSION = '1.0';
const INFO_VERSION_KEY = 'app_info_seen_version';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, LoginPanelComponent, SpinnerComponent],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss', './info-dialog.scss']
})
export class ToolbarComponent implements OnInit {
  @Input() title: string = '';
  @Input() showHomeButton: boolean = true;
  @Input() showMenuToggle: boolean = false;
  @Input() showLoginButton: boolean = false;

  // Event emitted when the menu toggle button is clicked (mobile view)
  @Output() toggleMenu = new EventEmitter<void>();

  isRefreshing: boolean = false;
  isInfoModalOpen: boolean = false;

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
    this.isInfoModalOpen = true;
  }

  closeInfoModal(): void {
    this.isInfoModalOpen = false;
    localStorage.setItem(INFO_VERSION_KEY, CURRENT_INFO_VERSION);
  }

  onRefresh(): void {
    this.refreshService.triggerRefresh();

    this.isRefreshing = true;
    setTimeout(() => {
      this.isRefreshing = false;
    }, 1000); // Reset the refresh state after 1 second
  }

  private checkIfInfoModalShouldOpen(): void {
    const savedVersion = localStorage.getItem(INFO_VERSION_KEY);
    if (!savedVersion || savedVersion !== CURRENT_INFO_VERSION) {
      this.isInfoModalOpen = true;
    }
  }
}