import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoginPanelComponent } from '@components/login-panel/login-panel.component';

const CURRENT_INFO_VERSION = '1.0';
const INFO_VERSION_KEY = 'app_info_seen_version';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, LoginPanelComponent],
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

  isInfoModalOpen: boolean = false;

  constructor(private router: Router) {}

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

  private checkIfInfoModalShouldOpen(): void {
    const savedVersion = localStorage.getItem(INFO_VERSION_KEY);
    if (!savedVersion || savedVersion !== CURRENT_INFO_VERSION) {
      this.isInfoModalOpen = true;
    }
  }
}