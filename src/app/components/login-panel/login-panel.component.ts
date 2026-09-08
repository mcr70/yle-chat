import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, Subscription } from 'rxjs';

import { Provider } from '@app/models/provider';
import { AuthService } from '@app/models/auth-service.interface';
import { ProviderManager } from '@app/models/provider';

@Component({
  selector: 'app-login-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './login-panel.component.html',
  styleUrls: ['./login-panel.component.scss'] 
})
export class LoginPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() provider?: Provider; // ALLOW PROVIDER FROM PARENT

  usernameDisplay = 'Käyttäjä'; 
  loginUsername = ''; 
  loginPassword = '';

  username = '';
  password = '';
  isLoginFormVisible: boolean = false;

  loginError: string | null = null;  
  
  public isLoggedIn$: Observable<boolean> = of(false);
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
      this.isLoggedIn$ = this.authService.isLoggedIn$;

      const userSub = this.authService.user$.subscribe(usernameFromService => {
        if (usernameFromService && typeof usernameFromService === 'string') {
          this.usernameDisplay = usernameFromService; 
        } else {
          this.usernameDisplay = 'Käyttäjä'; 
        }
      });

      this.subscription.add(userSub);
    } else {
      this.authService = undefined;
      this.isLoggedIn$ = of(false);
    }
  }

  openLoginForm(): void {
    if (!this.authService) return;

    if (this.authService.requiresCredentials) {
      this.isLoginFormVisible = true;
    } else {
      this.executeLogin();
    }
  }

  closeLoginForm(): void {
    this.isLoginFormVisible = false;
    this.loginUsername = '';
    this.loginPassword = '';
  }

  submitLogin(): void {
    if (this.loginUsername && this.loginPassword) {
      this.executeLogin(this.loginUsername, this.loginPassword);
    } else {
      console.error('Tunnus tai salasana puuttuu.');
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