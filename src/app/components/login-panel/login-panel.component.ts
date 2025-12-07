import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-login-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-panel.component.html',
  styleUrls: ['./login-panel.component.scss'] 
})
export class LoginPanelComponent {
  username = '';
  password = '';
  loginError: string | null = null;
  
  isLoggedIn$;

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  onLogin(): void {
    this.loginError = null;

    this.authService.login(this.username, this.password).subscribe(
      response => {
        if (!response) {
            this.loginError = 'Kirjautuminen epäonnistui. Tarkista tunnus/salasana.';
        } else {
            this.password = ''; 
        }
      }
    );
  }

  onLogout(): void {
    this.authService.logout().subscribe(() => {
        this.username = '';
        this.password = '';
    });
  }
}