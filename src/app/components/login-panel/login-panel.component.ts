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
  usernameDisplay = 'Käyttäjä'; 
  // Käytä olemassa olevia muuttujia vain lomakkeelle:
  loginUsername = ''; 
  loginPassword = '';

  username = '';
  password = '';
  isLoginFormVisible: boolean = false;

  loginError: string | null = null;  
  
  isLoggedIn$;

  constructor(private authService: AuthService) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    
    this.authService.user$.subscribe(usernameFromService => {
      if (usernameFromService && typeof usernameFromService === 'string') {
          this.usernameDisplay = usernameFromService; 
      } 
      else {
          this.usernameDisplay = 'Käyttäjä'; 
      }
    });
  }

  openLoginForm(): void {
    this.isLoginFormVisible = true;
  }

  closeLoginForm(): void {
    this.isLoginFormVisible = false;
    this.username = '';
    this.password = '';
  }

  submitLogin(): void {
    if (this.loginUsername && this.loginPassword) {
      
      this.authService.login(this.loginUsername, this.loginPassword)
        .subscribe({
          next: (response) => {
            this.closeLoginForm();
          },
          error: (error) => {
            console.error("Kirjautuminen epäonnistui komponenteissa:", error);
          }
        });

    } 
    else {
      console.error('Tunnus tai salasana puuttuu.');
    }
  }



  
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.loginUsername = '';
      this.loginPassword = '';
    });
  }

  logoutAndCloseMenu(): void {
    this.logout(); 
  }  
}