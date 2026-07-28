import { Observable } from "rxjs";

export interface AuthService {
  isLoggedIn$: Observable<boolean>;
  user$: Observable<string | null>;
  login(username: string, password: string): Observable<any>;
  logout(): Observable<any>;
}
