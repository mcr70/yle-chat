import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HNMyHistoryService } from './hn-my-hostory.service';
import { HNAuthService } from './hn-auth.service';

describe('HNMyHistoryService', () => {
  let service: HNMyHistoryService;
  let authService: HNAuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HNMyHistoryService,
        HNAuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HNMyHistoryService);
    authService = TestBed.inject(HNAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Verifies service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests returning empty list when user is not logged in
  it('should return empty list when no user is logged in', () => {
    let result: any[] = [];
    service.fetchMyDiscussions().subscribe(discussions => {
      result = discussions;
    });

    expect(result).toEqual([]);
  });
});
