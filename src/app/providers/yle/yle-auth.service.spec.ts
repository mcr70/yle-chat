import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { YleAuthService } from './yle-auth.service';

describe('YleAuthService', () => {
  let service: YleAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        YleAuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(YleAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // Verifies service instantiation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests login without username/password returns error
  it('should throw error when logging in without credentials', () => {
    let hasError = false;
    service.login('', '').subscribe({
      error: () => {
        hasError = true;
      }
    });

    expect(hasError).toBe(true);
  });

  // Tests successful login flow
  it('should handle successful login', () => {
    let success = false;
    service.login('testuser', 'secretpass').subscribe({
      next: () => {
        success = true;
      }
    });

    const req = httpMock.expectOne(req => req.url.includes('/v1/user/login'));
    expect(req.request.method).toBe('POST');
    req.flush({}, { status: 200, statusText: 'OK' });

    expect(success).toBe(true);
    expect(sessionStorage.getItem('isLoggedInFlag')).toBe('true');
  });

  // Tests logout flow
  it('should handle logout', () => {
    let loggedOut = false;
    service.logout().subscribe(() => {
      loggedOut = true;
    });

    const req = httpMock.expectOne(req => req.url.includes('/v1/user/login'));
    expect(req.request.method).toBe('DELETE');
    req.flush({}, { status: 200, statusText: 'OK' });

    expect(loggedOut).toBe(true);
    expect(sessionStorage.getItem('isLoggedInFlag')).toBeNull();
  });
});
