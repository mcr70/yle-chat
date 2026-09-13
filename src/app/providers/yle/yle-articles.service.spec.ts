import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { YleArticlesService } from './yle-articles.service';

describe('YleArticlesService', () => {
  let service: YleArticlesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        YleArticlesService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(YleArticlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Verifies service instantiation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests fetching and mapping articles
  it('should fetch articles, filter out inactive zero-comment items, and sort by date', () => {
    const mockResponse = {
      items: [
        {
          content: { contentId: 'art-1' },
          data: {
            headline: { full: 'First Article' },
            topic: { acceptedCommentsCount: 5, isLocked: false },
            datePublished: '2026-01-01T10:00:00Z',
            subjects: [{ title: { fi: 'Uutiset' } }]
          }
        },
        {
          content: { contentId: 'art-2' },
          data: {
            headline: { full: 'Inactive No Comments' },
            topic: { acceptedCommentsCount: 0, isLocked: true },
            datePublished: '2026-01-02T10:00:00Z',
            subjects: [{ title: { fi: 'Talous' } }]
          }
        },
        {
          content: { contentId: 'art-3' },
          data: {
            headline: { full: 'Newer Article' },
            topic: { acceptedCommentsCount: 2, isLocked: false },
            datePublished: '2026-01-03T10:00:00Z',
            subjects: [{ title: { fi: 'Kulttuuri' } }]
          }
        }
      ]
    };

    let resultArticles: any[] = [];
    service.getArticles().subscribe(articles => {
      resultArticles = articles;
    });

    const req = httpMock.expectOne(req => req.url.includes('/v1/layout-fragment/ylefi-front-page'));
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    // art-2 should be filtered out because it has 0 comments and is locked
    expect(resultArticles.length).toBe(2);
    // art-3 is newer than art-1, so it should be first
    expect(resultArticles[0].id).toBe('art-3');
    expect(resultArticles[1].id).toBe('art-1');
  });
});
