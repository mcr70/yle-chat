import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';

import { Provider } from '@app/models/provider';
import { AuthService } from '@app/models/auth-service.interface';
import { ProviderManager } from '@app/models/provider';

@Component({
  selector: 'app-login-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-panel.component.html',
  styleUrls: ['./login-panel.component.scss'] 
})
export class LoginPanelComponent implements OnInit, OnDestroy {
  usernameDisplay = 'Käyttäjä'; 
  loginUsername = ''; 
  loginPassword = '';

  username = '';
  password = '';
  isLoginFormVisible: boolean = false;

  loginError: string | null = null;  
  
  public isLoggedIn$: Observable<boolean> = of(false);
  public provider!: Provider;
  private authService?: AuthService;
  private subscription = new Subscription();

  constructor(
    private providerManager: ProviderManager,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Resolve active provider ID from route or parent route
    const providerId = 
      this.route.snapshot.paramMap.get('provider') || 
      this.route.snapshot.parent?.paramMap.get('provider') || 
      'yle';

    this.provider = this.providerManager.getProvider(providerId);

    // Ensure provider supports authentication
    if (this.provider.capabilities.supportsAuth && this.provider.authService) {
      this.authService = this.provider.authService;
      this.isLoggedIn$ = this.authService.isLoggedIn$;

      const userSub = this.authService.user$.subscribe(usernameFromService => {
        if (usernameFromService && typeof usernameFromService === 'string') {
          this.usernameDisplay = usernameFromService; 
        } else {
          this.usernameDisplay = 'Käyttäjä'; 
        }
      });

      this.subscription.add(userSub);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  openLoginForm(): void {
    if (!this.authService) return;

    // Check if the service requires username/password input via modal
    if (this.authService.requiresCredentials) {
      this.isLoginFormVisible = true; // Open Yle modal
    } else {
      // HS / Popup flow: Call login directly without showing the form modal!
      this.executeLogin();
    }
  }

  closeLoginForm(): void {
    this.isLoginFormVisible = false;
    this.username = '';
    this.password = '';
  }

  // Provdes username & password for login
  submitLogin(): void {
    if (this.loginUsername && this.loginPassword) {
      this.executeLogin(this.loginUsername, this.loginPassword);
    } else {
      console.error('Tunnus tai salasana puuttuu.');
    }
  }

  logout(): void {
    if (!this.authService) {
      return;
    }

    this.authService.logout().subscribe(() => {
      this.loginUsername = '';
      this.loginPassword = '';
    });
  }

  logoutAndCloseMenu(): void {
    this.logout(); 
  }  

  /**
   * Internal helper to execute the login call
   */
  private executeLogin(username?: string, password?: string): void {
    if (!this.authService) return;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.closeLoginForm();
      },
      error: (error) => {
        console.error('Kirjautuminen epäonnistui:', error);
      }
    });
  }
}