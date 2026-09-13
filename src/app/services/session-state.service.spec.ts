import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { SessionStateService } from './session-state.service';

describe('SessionStateService', () => {
  let service: SessionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionStateService]
    });
    service = TestBed.inject(SessionStateService);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // Verifies service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests saving and retrieving selected article ID for a provider
  it('should store and retrieve article ID by provider', () => {
    service.setSelectedArticleId('yle', 'article-123');
    const result = service.getSelectedArticleId('yle');

    expect(result).toBe('article-123');
  });

  // Tests returning null when no article has been selected
  it('should return null when no article ID is saved for provider', () => {
    const result = service.getSelectedArticleId('hs');

    expect(result).toBeNull();
  });

  // Tests that empty/falsy article ID is ignored
  it('should not store empty article ID', () => {
    service.setSelectedArticleId('yle', '');
    const result = service.getSelectedArticleId('yle');

    expect(result).toBeNull();
  });
});
