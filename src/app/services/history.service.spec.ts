import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { HistoryService } from './history.service';

describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistoryService]
    });
    service = TestBed.inject(HistoryService);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // Verifies that the service instance is initialized
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Verifies getHistory returns empty array when storage is empty
  it('should return empty array when no history exists in sessionStorage', () => {
    const history = service.getHistory();
    expect(history).toEqual([]);
  });

  // Verifies getHistory returns parsed items when data is populated in sessionStorage
  it('should return parsed history items from sessionStorage', () => {
    const mockItems = [
      { id: '1', title: 'Article 1', timestamp: 1000 }
    ];
    sessionStorage.setItem('articleHistory', JSON.stringify(mockItems));

    const history = service.getHistory();
    expect(history).toEqual(mockItems);
  });

  // Verifies addOrUpdateArticle handles disabled flag safely without throwing
  it('should handle addOrUpdateArticle safely when history is disabled', () => {
    expect(() => {
      service.addOrUpdateArticle('123', 'Test Article');
    }).not.toThrow();
  });

  // Verifies clear handles empty/missing input safely
  it('should handle clear safely', () => {
    expect(() => {
      service.clear(['123']);
      service.clear([]);
    }).not.toThrow();
  });
});
