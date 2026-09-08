import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
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

  private userCookie: string | null = null;
  private authHex: string | null = null;

  private readonly proxyUrl = '/hn-api'; 

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

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
      responseType: 'text'
    }).pipe(
      switchMap(response => {
        const loginCookie = response.headers.get('x-hn-cookie') || '';

        const testHeaders = loginCookie
          ? new HttpHeaders({ 'x-hn-cookie': loginCookie })
          : new HttpHeaders();

        return this.http.get(`${this.proxyUrl}/news`, {
          headers: testHeaders,
          observe: 'response',
          responseType: 'text'
        }).pipe(
          map(verificationResponse => {
            const htmlPage = verificationResponse.body || '';
            const sessionCookie = loginCookie || verificationResponse.headers.get('x-hn-cookie') || '';

            // Kaapataan authHex-token kirjautuneen sivun HTML-koodista
            const authMatch = htmlPage.match(/logout\?auth=([a-f0-9]+)/);
            const authHex = authMatch ? authMatch[1] : undefined;

            if (!authHex || !sessionCookie) {
              throw new Error('Kirjautuminen epäonnistui: Tarkista tunnus ja salasana.');
            }

            this.authHex = authHex;

            const finalCookie = sessionCookie;

            this.userCookie = finalCookie;
            this.isLoggedInSubject.next(true);
            this.userSubject.next(username);

            this.saveSession(username, finalCookie, this.authHex || undefined);

            return {
              success: true,
              username,
              cookie: finalCookie,
              authHex: this.authHex
            };
          })
        );
      }),
      catchError(error => {
        console.error('HN Login failed:', error);
        return throwError(() => error);
      })
    );
  }
  
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
        if (username && cookie) {
          this.userCookie = cookie;
          this.authHex = authHex || null;
          this.isLoggedInSubject.next(true);
          this.userSubject.next(username);
        } else {
          this.clearSession();
        }
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