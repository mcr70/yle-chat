import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HNArticleService } from './hn-article.service';

describe('HNArticleService', () => {
  let service: HNArticleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HNArticleService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HNArticleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  // Verifies service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests fetching top stories and retrieving item details
  it('should fetch top stories and map items to ArticleListItem array', () => {
    let resultArticles: any[] = [];
    service.getArticles().subscribe(articles => {
      resultArticles = articles;
    });

    // Expect top stories request
    const topReq = httpMock.expectOne('https://hacker-news.firebaseio.com/v0/topstories.json');
    expect(topReq.request.method).toBe('GET');
    topReq.flush([1001]);

    // Expect item request
    const itemReq = httpMock.expectOne('https://hacker-news.firebaseio.com/v0/item/1001.json');
    expect(itemReq.request.method).toBe('GET');
    itemReq.flush({
      id: 1001,
      title: 'HN Test Title',
      time: 1700000000,
      descendants: 42
    });

    expect(resultArticles.length).toBe(1);
    expect(resultArticles[0].id).toBe('1001');
    expect(resultArticles[0].title).toBe('HN Test Title');
    expect(resultArticles[0].commentCount).toBe(42);
  });
});
