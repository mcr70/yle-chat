import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthError, AuthService } from '@app/models/auth-service.interface';

@Injectable({
  providedIn: 'root'
})
export class YleAuthService implements AuthService {
  private readonly LOGIN_PROXY_PREFIX = '';//'/yle-login';
  
  private readonly APP_PARAMS = 'app_id=tunnus_shared_ui_202004_prod&app_key=0aded2b7c4387042dbfb19cfcf152663&initiating_app=uutiset';

  private userSubject = new BehaviorSubject<string | null>(null); 
  user$: Observable<string | null> = this.userSubject.asObservable();

  private loggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedInSubject.asObservable();
  
  requiresCredentials = true; // Yle login requires username/password input

  constructor(private http: HttpClient) {
    this.restoreSession();
  }


  /**
   * Login user with username and password
   * @param username 
   * @param password 
   * @returns 
   */
  login(username?: string, password?: string): Observable<unknown> {
    if (!username || !password) {
      return throwError(() => new AuthError('AUTH_INVALID_CREDENTIALS'));
    }

    const url = `${this.LOGIN_PROXY_PREFIX}/v1/user/login?${this.APP_PARAMS}`;
    
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    return this.http.post(url, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      withCredentials: true,
      observe: 'response' 
    }).pipe(
      tap(response => {
        // 'ylelogin' should be stored in cookies
        if (response.status === 200 || response.status === 204) {
          this.loggedInSubject.next(true);
          this.userSubject.next(username)

          sessionStorage.setItem('isLoggedInFlag', 'true');
        }
        else {
          throw new AuthError(
            response.status === 401 || response.status === 403
              ? 'AUTH_INVALID_CREDENTIALS'
              : 'AUTH_LOGIN_FAILED'
          );
        }
      }),
      catchError(error => {
        this.loggedInSubject.next(false);
        console.warn('failed to login');
        sessionStorage.setItem('isLoggedInFlag', 'false');

        return throwError(() => new AuthError(
          error?.status === 401 || error?.status === 403
            ? 'AUTH_INVALID_CREDENTIALS'
            : 'AUTH_LOGIN_FAILED',
          error?.message
        ));
      })
    );
  }


  /**
   * Logs user out
   * 
   * @returns 
   */
  logout(): Observable<any> {
    const url = `${this.LOGIN_PROXY_PREFIX}/v1/user/login?${this.APP_PARAMS}`;

    return this.http.delete(url, {
      withCredentials: true, 
      observe: 'response'
    }).pipe(
      tap(response => {
        this.loggedInSubject.next(false);
        sessionStorage.removeItem('isLoggedInFlag');
      }),
      catchError(error => {
        this.loggedInSubject.next(false);
        sessionStorage.removeItem('isLoggedInFlag');

        return of(null);
      })
    );
  }



  private restoreSession() {
    const wasLoggedIn = sessionStorage.getItem('isLoggedInFlag') === 'true';
    if (wasLoggedIn) {
      this.loggedInSubject.next(true);
    }
  }

}