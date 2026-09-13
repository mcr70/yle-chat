import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HSProvider } from './hs-provider.service';
import { HSCommentService } from './hs-comment.service';
import { HSAuthService } from './hs-auth.service';
import { HSArticlesService } from './hs-articles.service';

describe('HSProvider', () => {
  let provider: HSProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        HSProvider,
        HSCommentService,
        HSAuthService,
        HSArticlesService
      ]
    });
    provider = TestBed.inject(HSProvider);
  });

  // Verifies provider creation
  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  // Verifies ID and display name
  it('should have correct ID and display name', () => {
    expect(provider.id).toBe('hs');
    expect(provider.displayName).toBe('Helsingin Sanomat');
  });

  // Verifies capabilities
  it('should have expected capability configuration', () => {
    expect(provider.capabilities.supportsAuth).toBe(false);
    expect(provider.capabilities.supportsArticleListing).toBe(true);
    expect(provider.capabilities.supportsReplying).toBe(false);
  });
});
