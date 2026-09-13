import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { YleHistoryService } from './yle-my-history.service';

describe('YleHistoryService', () => {
  let service: YleHistoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        YleHistoryService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(YleHistoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Verifies service instantiation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests fetching user discussion history and grouping comments by article
  it('should fetch history, filter article comments, and group by article ID', () => {
    const mockHistory = [
      {
        entity_type: 'article_comment',
        entity_id: 'article-1',
        article_title: 'Title 1',
        timestamp: 1000
      },
      {
        entity_type: 'video_view', // Non-comment entity that should be filtered out
        entity_id: 'video-1',
        timestamp: 1500
      },
      {
        entity_type: 'article_comment',
        entity_id: 'article-1',
        article_title: 'Title 1',
        timestamp: 2000
      },
      {
        entity_type: 'article_comment',
        entity_id: 'article-2',
        article_title: 'Title 2',
        timestamp: 1800
      }
    ];

    let discussions: any[] = [];
    service.fetchMyDiscussions().subscribe(res => {
      discussions = res;
    });

    const req = httpMock.expectOne(req => req.url.includes('/v3/history'));
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);

    expect(discussions.length).toBe(2);
    // article-1 has latest timestamp (2000) > article-2 (1800)
    expect(discussions[0].articleId).toBe('article-1');
    expect(discussions[0].commentCount).toBe(2);
    expect(discussions[0].lastCommentTimestamp).toBe(2000);

    expect(discussions[1].articleId).toBe('article-2');
    expect(discussions[1].commentCount).toBe(1);
  });
});
