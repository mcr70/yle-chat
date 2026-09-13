import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HNProvider } from './hn-provider.service';
import { HNArticleService } from './hn-article.service';
import { HNCommentService } from './hn-comment.service';
import { HNAuthService } from './hn-auth.service';
import { HNMyHistoryService } from './hn-my-hostory.service';

describe('HNProvider', () => {
  let provider: HNProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        HNProvider,
        HNArticleService,
        HNCommentService,
        HNAuthService,
        HNMyHistoryService
      ]
    });
    provider = TestBed.inject(HNProvider);
  });

  // Verifies provider creation
  it('should be created', () => {
    expect(provider).toBeTruthy();
  });

  // Verifies provider properties
  it('should have correct ID and display name', () => {
    expect(provider.id).toBe('hn');
    expect(provider.displayName).toBe('Hacker News');
  });

  // Verifies provider capabilities
  it('should have correct capabilities for Hacker News', () => {
    expect(provider.capabilities.supportsAuth).toBe(true);
    expect(provider.capabilities.supportsUserHistory).toBe(true);
    expect(provider.capabilities.supportsArticleListing).toBe(true);
    expect(provider.capabilities.supportsLiking).toBe(false);
    expect(provider.capabilities.supportsReplying).toBe(true);
  });
});
