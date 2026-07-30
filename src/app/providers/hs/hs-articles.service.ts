import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ArticleListItem, ArticleService } from '@app/models/article-service.interface';


/**
 * Internal interface matching HS lane items API structure
 */
interface HSLaneItem {
  id: number | string;
  title: string;
  category?: string;
  displayDate?: string;
  commentsCount?: number;
  commentCount?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class HSArticlesService implements ArticleService {
  private readonly http = inject(HttpClient);

  // Default lane item endpoint via local dev proxy
  private readonly laneUrl = '/hs-api/api/laneitems/438218/list?listTemplate=numbered-right';

  /**
   * Fetches articles from HS API and maps raw data to ArticleListItem[]
   */
  public getArticles(): Observable<ArticleListItem[]> {
    console.log('Fetching articles from HS API...');
    return this.http.get<HSLaneItem[]>(this.laneUrl).pipe(
      map((items) => this.mapToArticleListItems(items))
    );
  }

  private mapToArticleListItems(items: HSLaneItem[]): ArticleListItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      id: String(item.id),
      title: item.title || '',
      commentCount: item.commentCount ?? item.commentsCount ?? 0,
      isActive: true,
      published: item.displayDate ? new Date(item.displayDate) : null,
      category: item.category
    }));
  }
}