import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { MyHistoryService, GroupedDiscussion } from '@app/models/my-history-service.interface';
import { HNAuthService } from './hn-auth.service';

interface AlgoliaCommentHit {
  story_id: number | null;
  story_title: string | null;
  created_at_i: number;
  objectID: string;
}

interface AlgoliaSearchResponse {
  hits: AlgoliaCommentHit[];
}

@Injectable({
  providedIn: 'root'
})
export class HNMyHistoryService implements MyHistoryService {
  private http = inject(HttpClient);
  private authService = inject(HNAuthService);

  private readonly algoliaBaseUrl = 'https://hn.algolia.com/api/v1';

  /**
   * fetches the user's discussions (comments) from Hacker News via the Algolia API, grouped by story/article.
   * @returns Observable<GroupedDiscussion[]> - an observable that emits an array of grouped discussions
   */
  fetchMyDiscussions(): Observable<GroupedDiscussion[]> {
    return this.authService.user$.pipe(
      switchMap(username => {
        if (!username) {
          return of([]);
        }

        const url = `${this.algoliaBaseUrl}/search_by_date?tags=comment,author_${username}`;

        return this.http.get<AlgoliaSearchResponse>(url).pipe(
          map(response => this.groupCommentsByStory(response.hits || []))
        );
      }),
      catchError(err => {
        console.error('HNMyHistoryService: Failed to fetch user discussions', err);
        return of([]);
      })
    );
  }

  /**
   * helper method to group comments by storyId and count the number of comments per story
   * @param hits AlgoliaCommentHit[] - the array of comment hits from Algolia
   * @returns GroupedDiscussion[] - the grouped discussions with articleId, title, last comment timestamp, and comment count
   */
  private groupCommentsByStory(hits: AlgoliaCommentHit[]): GroupedDiscussion[] {
    const map = new Map<string, GroupedDiscussion>();

    for (const hit of hits) {
      if (!hit.story_id) continue;

      const articleId = hit.story_id.toString();
      const timestampMs = hit.created_at_i * 1000;
      const existing = map.get(articleId);

      if (existing) {
        existing.commentCount += 1;
        if (timestampMs > existing.lastCommentTimestamp) {
          existing.lastCommentTimestamp = timestampMs;
        }
      } else {
        map.set(articleId, {
          articleId,
          articleTitle: hit.story_title || 'Tuntematon artikkeli',
          lastCommentTimestamp: timestampMs,
          commentCount: 1
        });
      }
    }

    // sort descending by lastCommentTimestamp
    return Array.from(map.values()).sort(
      (a, b) => b.lastCommentTimestamp - a.lastCommentTimestamp
    );
  }
}