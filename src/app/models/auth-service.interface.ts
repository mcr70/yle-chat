import { Observable } from "rxjs";

export interface AuthService {
  isLoggedIn$: Observable<boolean>;
  user$: Observable<string | null>;

  // Flag to tell the UI whether this service needs form inputs or handles it via popup/redirect
  requiresCredentials?: boolean;

  // Parameters are optional to support both direct API login and popup flows
  login(username?: string, password?: string): Observable<any>;
  logout(): Observable<any>;
}
