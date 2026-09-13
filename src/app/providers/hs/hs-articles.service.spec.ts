import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HSArticlesService } from './hs-articles.service';

describe('HSArticlesService', () => {
  let service: HSArticlesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HSArticlesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HSArticlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Verifies service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests fetching and transforming HS lane items into ArticleListItem format
  it('should fetch and map lane items correctly', () => {
    const mockLaneItems = [
      {
        id: 12345,
        title: 'HS Test Article',
        category: 'Uutiset',
        displayDate: '2026-03-01T12:00:00Z',
        commentsCount: 15
      }
    ];

    let resultArticles: any[] = [];
    service.getArticles().subscribe(articles => {
      resultArticles = articles;
    });

    const req = httpMock.expectOne(req => req.url.includes('/hs-api/api/laneitems/438218/list'));
    expect(req.request.method).toBe('GET');
    req.flush(mockLaneItems);

    expect(resultArticles.length).toBe(1);
    expect(resultArticles[0].id).toBe('12345');
    expect(resultArticles[0].title).toBe('HS Test Article');
    expect(resultArticles[0].commentCount).toBe(15);
    expect(resultArticles[0].isActive).toBe(true);
  });
});
