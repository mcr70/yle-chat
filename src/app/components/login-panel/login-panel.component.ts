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
    this.isLoginFormVisible = true;
  }

  closeLoginForm(): void {
    this.isLoginFormVisible = false;
    this.username = '';
    this.password = '';
  }

  submitLogin(): void {
    if (!this.authService) {
      console.error('Authentication is not supported by the current provider.');
      return;
    }

    if (this.loginUsername && this.loginPassword) {
      this.authService.login(this.loginUsername, this.loginPassword)
        .subscribe({
          next: () => {
            this.closeLoginForm();
          },
          error: (error) => {
            console.error('Kirjautuminen epäonnistui komponenteissa:', error);
          }
        });
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
}