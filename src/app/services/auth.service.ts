import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly LOGIN_PROXY_PREFIX = '/yle-login';
  
  private readonly APP_PARAMS = 'app_id=tunnus_shared_ui_202004_prod&app_key=0aded2b7c4387042dbfb19cfcf152663&initiating_app=uutiset';

  private loggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.loggedInSubject.asObservable();
  
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const url = `${this.LOGIN_PROXY_PREFIX}/v1/user/login?${this.APP_PARAMS}`;
    
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);

    console.log('Sending login request to URL:', url);  

    return this.http.post(url, body.toString(), {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded'
      }),
      withCredentials: true,
      observe: 'response' 
    }).pipe(
      tap(response => {
        // Jos vastaus onnistuu (200/204), selain on tallentanut ylelogin-evästeen
        if (response.status === 200 || response.status === 204) {
          this.loggedInSubject.next(true);
          console.log('Kirjautuminen onnistui. Eväste asetettu.');
        }
      }),
      catchError(error => {
        this.loggedInSubject.next(false);
        // Jos virhe (esim. 401 Unauthorized), palauta null
        return of(null);
      })
    );
  }

  logout(): Observable<any> {
    const url = `${this.LOGIN_PROXY_PREFIX}/v1/user/login?${this.APP_PARAMS}`;

    // Käytä DELETE-metodia ja withCredentials lähettääksesi evästeen mitätöitäväksi
    return this.http.delete(url, {
      withCredentials: true, 
      observe: 'response'
    }).pipe(
      tap(response => {
        // Oletetaan uloskirjautumisen onnistuvan
        this.loggedInSubject.next(false);
        console.log('Uloskirjautuminen onnistui.');
      }),
      catchError(error => {
        this.loggedInSubject.next(false);
        return of(null);
      })
    );
  }
}