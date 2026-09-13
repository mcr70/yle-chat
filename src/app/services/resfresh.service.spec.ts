import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { RefreshService } from './resfresh.service';

describe('RefreshService', () => {
  let service: RefreshService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RefreshService]
    });
    service = TestBed.inject(RefreshService);
  });

  // Verifies that the service instantiates properly
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Verifies that triggerRefresh emits through the refresh$ observable
  it('should emit a notification when triggerRefresh is called', () => {
    let emitted = false;

    const sub = service.refresh$.subscribe(() => {
      emitted = true;
    });

    service.triggerRefresh();

    expect(emitted).toBe(true);
    sub.unsubscribe();
  });
});
