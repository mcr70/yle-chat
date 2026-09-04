import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ArticleService, ArticleListItem } from '@app/models/article-service.interface';

interface HNItemRaw {
  id: number;
  title?: string;
  time: number;
  descendants?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HNArticleService implements ArticleService {
  private http = inject(HttpClient);
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';

  getArticles(): Observable<ArticleListItem[]> {
    return this.http.get<number[]>(`${this.baseUrl}/topstories.json`).pipe(
      map(ids => ids.slice(0, 30)),
      switchMap(ids => {
        if (ids.length === 0) return of([]);
        return forkJoin(ids.map(id => this.fetchItem(id)));
      }),
      map(items =>
        items
          .filter((item): item is HNItemRaw => item !== null && !!item.title)
          .map(item => ({
            id: item.id.toString(),
            title: item.title || '',
            commentCount: item.descendants || 0,
            isActive: true,
            published: item.time ? new Date(item.time * 1000) : null
          }))
      )
    );
  }

  private fetchItem(id: number): Observable<HNItemRaw | null> {
    return this.http.get<HNItemRaw>(`${this.baseUrl}/item/${id}.json`).pipe(
      catchError(() => of(null))
    );
  }
}