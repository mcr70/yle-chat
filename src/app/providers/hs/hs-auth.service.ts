import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, of, throwError, timer } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '@app/models/auth-service.interface';

@Injectable({
  providedIn: 'root'
})
export class HSAuthService implements AuthService {
  private readonly http = inject(HttpClient);

  private readonly clientId = '28ae90c0-f243-4163-8934-54b18296d6ae';
  private readonly service = 'helsinginsanomat';
  private readonly hsCallbackUri = 'https://www.hs.fi/api/safe/v1/web/access-token';

  private readonly currentUserSubject = new BehaviorSubject<string | null>(null);
  public readonly user$ = this.currentUserSubject.asObservable();

  private readonly isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();

  /**
   * Opens Sanoma login in a pop-up window and handles authentication.
   */
  public login(): Observable<any> {
    const authSubject = new Subject<any>();
    const state = crypto.randomUUID();

    const authUrl = this.buildAuthUrl(state);
    const popup = this.openPopupWindow(authUrl.toString());

    if (!popup) {
      return throwError(() => new Error('Popup window blocked by browser.'));
    }

    // Interval watcher to check popup URL & closure state
    const pollTimer$ = timer(0, 500);
    const destroy$ = new Subject<void>();

    pollTimer$.pipe(takeUntil(destroy$)).subscribe(() => {
      // 1. User manually closed the popup without completing flow
      if (popup.closed) {
        destroy$.next();
        destroy$.complete();
        authSubject.error(new Error('Authentication cancelled by user.'));
        return;
      }

      // 2. Poll location safely (catching CORS restriction errors until redirected)
      try {
        const currentUrl = popup.location.href;

        if (currentUrl.includes('code=')) {
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get('code');
          const returnedState = urlParams.get('state');

          // Clean up popup and watcher
          destroy$.next();
          destroy$.complete();
          popup.close();

          // State Validation
          if (returnedState && returnedState !== state) {
            authSubject.error(new Error('State mismatch error (possible CSRF).'));
            return;
          }

          if (code) {
            this.exchangeCodeForToken(code).subscribe({
              next: (res) => {
                this.currentUserSubject.next('hs-user');
                this.isLoggedInSubject.next(true);
                authSubject.next(res);
                authSubject.complete();
              },
              error: (err) => authSubject.error(err)
            });
          } else {
            authSubject.error(new Error('Authorization code missing from response.'));
          }
        }
      } catch {
        // Expected Cross-Origin exception while user is navigating tili.sanoma.fi
      }
    });

    return authSubject.asObservable();
  }

  private buildAuthUrl(state: string): URL {
    const authUrl = new URL('https://tili.sanoma.fi/kirjaudu');
    authUrl.searchParams.set('client_id', this.clientId);
    authUrl.searchParams.set('service', this.service);
    authUrl.searchParams.set('state', state);

    authUrl.searchParams.set('redirect_uri', this.hsCallbackUri);
    authUrl.searchParams.set('temporaryTokenRedirectUri', this.hsCallbackUri);
    authUrl.searchParams.set('temporaryTokenClientId', this.clientId);
    authUrl.searchParams.set('generateTemporaryTokens', 'true');
    authUrl.searchParams.set('cancel_uri', 'https://www.hs.fi/jsRedirect/?target=%2F');

    authUrl.searchParams.set('googleAuth', 'true');
    authUrl.searchParams.set('appleAuth', 'true');
    authUrl.searchParams.set('facebookAuth', 'true');

    return authUrl;
  }

  private openPopupWindow(url: string): Window | null {
    const width = 500;
    const height = 680;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    return window.open(
      url,
      'SanomaLogin',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );
  }

  /**
   * Exchanges the OAuth code for an access token session via proxy.
   */
  private exchangeCodeForToken(code: string): Observable<any> {
    const tokenUrl = `/hs-api/api/safe/v1/web/access-token?code=${encodeURIComponent(code)}`;

    return this.http.get(tokenUrl, {
      withCredentials: true,
      responseType: 'text'
    });
  }

  public logout(): Observable<boolean> {
    this.currentUserSubject.next(null);
    this.isLoggedInSubject.next(false);
    return of(true);
  }
}