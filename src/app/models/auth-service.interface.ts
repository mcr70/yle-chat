import { Observable } from "rxjs";

export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_CANCELLED'
  | 'AUTH_POPUP_BLOCKED';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = 'AuthError';
  }
}

export interface AuthService {
  isLoggedIn$: Observable<boolean>;
  user$: Observable<string | null>;

  // Flag to tell the UI whether this service needs form inputs or handles it via popup/redirect
  requiresCredentials?: boolean;

  // Parameters are optional to support both direct API login and popup flows
  login(username?: string, password?: string): Observable<unknown>;
  logout(): Observable<any>;
}
