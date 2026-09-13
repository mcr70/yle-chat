import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { YleProvider } from './yle-provider.service';
import { YleCommentService } from './yle-comment.service';
import { YleAuthService } from './yle-auth.service';
import { YleHistoryService } from './yle-my-history.service';
import { YleArticlesService } from './yle-articles.service';

describe('YleProvider', () => {
  let provider: YleProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        YleProvider,
        YleCommentService,
        YleAuthService,
        YleHistoryService,
        YleArticlesService
      ]
    });
    provider = TestBed.inject(YleProvider);
  });

  // Verifies provider initialization
  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  // Verifies provider id and displayName
  it('should have correct ID and display name', () => {
    expect(provider.id).toBe('yle');
    expect(provider.displayName).toBe('Yle');
  });

  // Verifies capability flags for Yle
  it('should have correct capabilities configured', () => {
    expect(provider.capabilities.supportsAuth).toBe(true);
    expect(provider.capabilities.supportsUserHistory).toBe(true);
    expect(provider.capabilities.supportsArticleListing).toBe(true);
    expect(provider.capabilities.supportsLiking).toBe(true);
    expect(provider.capabilities.supportsReplying).toBe(true);
  });
});
