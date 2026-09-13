import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { Provider } from '@app/models/provider';
import { AuthError, AuthErrorCode, AuthService } from '@app/models/auth-service.interface';
import { ProviderManager } from '@app/models/provider';

@Component({
  selector: 'app-login-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './login-panel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./login-panel.component.scss'] 
})
export class LoginPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() provider?: Provider; // ALLOW PROVIDER FROM PARENT

  usernameDisplay = signal('Käyttäjä'); 
  loginUsername = ''; 
  loginPassword = '';

  isLoginFormVisible = signal(false);

  loginError = signal<string | null>(null);  
  loginErrorPulse = signal(false);
  isLoggingIn = signal(false);
  private loginErrorPulseTimeout?: ReturnType<typeof setTimeout>;
  
  public isLoggedIn = signal(false);
  private authService?: AuthService;
  private subscription = new Subscription();

  constructor(
    private providerManager: ProviderManager,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.setupAuthService();
  }

  /**
   * React to changes in the input properties, particularly the provider.
   * @param changes The changes detected in the input properties.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['provider']) {
      this.setupAuthService();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private setupAuthService(): void {
    // Reset subscription when provider changes
    this.subscription.unsubscribe();
    this.subscription = new Subscription();

    // Resolve provider from Input or Route as fallback
    if (!this.provider) {
      const providerId = 
        this.route.snapshot.paramMap.get('provider') || 
        this.route.snapshot.parent?.paramMap.get('provider') || 
        'yle';
      this.provider = this.providerManager.getProvider(providerId);
    }

    // Ensure provider supports authentication
    if (this.provider?.capabilities.supportsAuth && this.provider.authService) {
      this.authService = this.provider.authService;

      this.subscription.add(
        this.authService.isLoggedIn$.subscribe(loggedIn => {
          this.isLoggedIn.set(loggedIn);
        })
      );

      const userSub = this.authService.user$.subscribe(usernameFromService => {
        if (usernameFromService && typeof usernameFromService === 'string') {
          this.usernameDisplay.set(usernameFromService); 
        } else {
          this.usernameDisplay.set('Käyttäjä'); 
        }
      });

      this.subscription.add(userSub);
    } else {
      this.authService = undefined;
      this.isLoggedIn.set(false);
    }
  }

  openLoginForm(): void {
    if (!this.authService) return;

    this.loginError.set(null);

    if (this.authService.requiresCredentials) {
      this.isLoginFormVisible.set(true);
    } else {
      this.executeLogin();
    }
  }

  closeLoginForm(): void {
    this.isLoginFormVisible.set(false);
    this.loginUsername = '';
    this.loginPassword = '';
    this.loginError.set(null);
    this.loginErrorPulse.set(false);
  }

  submitLogin(): void {
    if (this.loginUsername.trim() && this.loginPassword) {
      this.executeLogin(this.loginUsername, this.loginPassword);
    } else {
      this.showLoginError('AUTH.REQUIRED_FIELDS');
    }
  }

  logout(): void {
    if (!this.authService) return;

    this.authService.logout().subscribe(() => {
      this.loginUsername = '';
      this.loginPassword = '';
    });
  }

  logoutAndCloseMenu(): void {
    this.logout(); 
  }  

  private executeLogin(username?: string, password?: string): void {
    if (!this.authService) return;

    this.loginError.set(null);
    this.isLoggingIn.set(true);

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoggingIn.set(false);
        this.closeLoginForm();
      },
      error: (error) => {
        this.isLoggingIn.set(false);
        this.showLoginError(this.getLoginErrorKey(error));
        console.error('Login failed:', error);
      }
    });
  }

  private getLoginErrorKey(error: unknown): string {
    const code = error instanceof AuthError
      ? error.code
      : (error as { code?: AuthErrorCode } | null)?.code;

    switch (code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return 'AUTH.INVALID_CREDENTIALS';
      case 'AUTH_CANCELLED':
        return 'AUTH.LOGIN_CANCELLED';
      case 'AUTH_POPUP_BLOCKED':
        return 'AUTH.POPUP_BLOCKED';
      default:
        return 'AUTH.LOGIN_FAILED';
    }
  }

  private showLoginError(errorKey: string): void {
    this.loginError.set(errorKey);
    this.loginErrorPulse.set(false);

    if (this.loginErrorPulseTimeout) {
      clearTimeout(this.loginErrorPulseTimeout);
    }

    this.loginErrorPulseTimeout = setTimeout(() => {
      this.loginErrorPulse.set(true);
    }, 10);
  }
}