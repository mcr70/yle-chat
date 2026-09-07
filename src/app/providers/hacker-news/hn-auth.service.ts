import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AuthService } from '@app/models/auth-service.interface';

export interface HNLoginResponse {
  success: boolean;
  username: string;
  cookie: string;
  authHex?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HNAuthService implements AuthService {
  requiresCredentials = true;

  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  private userSubject = new BehaviorSubject<string | null>(null);
  user$: Observable<string | null> = this.userSubject.asObservable();

  // local storage session data
  private userCookie: string | null = null;
  private authHex: string | null = null;

  private readonly proxyUrl = '/hn-api'; 

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  /**
   * Login to Hacker News using username and password.
   */
login(username?: string, password?: string): Observable<HNLoginResponse> {
  if (!username || !password) {
    return throwError(() => new Error('Username and password are required'));
  }

  const body = new HttpParams()
    .set('acct', username)
    .set('pw', password);

  const headers = new HttpHeaders({
    'Content-Type': 'application/x-www-form-urlencoded'
  });

  return this.http.post(`${this.proxyUrl}/login`, body.toString(), { 
    headers,
    observe: 'response',
    responseType: 'text' // Estetään JSON-parsintavirhe
  }).pipe(
    map(response => {
      // Luetaan Set-Cookie vastauksen otsakkeista
      const cookieHeader = response.headers.get('set-cookie') || response.headers.get('x-hn-cookie') || '';
      
      const successData: HNLoginResponse = {
        success: true,
        username: username,
        cookie: cookieHeader
      };

      this.userCookie = cookieHeader;
      this.isLoggedInSubject.next(true);
      this.userSubject.next(username);

      this.saveSession(username, cookieHeader);
      return successData;
    }),
    catchError(error => {
      console.error('HN Login failed:', error);
      return throwError(() => error);
    })
  );
}


  /**
   * Logout from Hacker News and clear session data.
   */
  logout(): Observable<boolean> {
    const logout$: Observable<unknown> = this.authHex
      ? this.http.get(`${this.proxyUrl}/logout`, {
          params: {
            auth: this.authHex,
            goto: 'news'
          },
          headers: {
            'x-hn-cookie': this.userCookie || ''
          },
          responseType: 'text'
        })
      : of(null);

    return logout$.pipe(
      tap(() => this.clearSession()),
      map(() => true),
      catchError((err) => {
        console.warn('HN Logout API failed, clearing local session anyway:', err);
        this.clearSession();
        return of(true);
      })
    );
  }


  /**
   * Returns the active HN cookie for other services (such as commenting/voting)
   */
  getUserCookie(): string | null {
    return this.userCookie;
  }

  private saveSession(username: string, cookie: string, authHex?: string): void {
    const sessionData = { username, cookie, authHex };
    localStorage.setItem('hn_session', JSON.stringify(sessionData));
  }

  private restoreSession(): void {
    const saved = localStorage.getItem('hn_session');
    if (saved) {
      try {
        const { username, cookie, authHex } = JSON.parse(saved);
        this.userCookie = cookie;
        this.authHex = authHex || null;
        this.isLoggedInSubject.next(true);
        this.userSubject.next(username);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  private clearSession(): void {
    this.userCookie = null;
    this.authHex = null;
    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);
    localStorage.removeItem('hn_session');
  }
}