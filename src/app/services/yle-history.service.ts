/**
 * https://datacloud.api.yle.fi/v2/tv/history?limit=20&exclude_sub_accounts=true&fetch_comments=true
 *   - GET
 *   - Cookie: -b 'ylelogin=1b0b4764b6cc...'
 */

interface YleHistoryItem {
  collectorreceived: number;
  content_type: string;
  yle_id: string;
  type: string;
  application?: string; 
  comment?: {
    id: string;
    content: string;
    title: string;
    url: string;
  };
}

export interface MyDiscussion {
  id: string;
  title: string;
  url: string;
  commentContent: string;
}


export interface GroupedDiscussion {
  articleId: string;
  articleTitle: string;
  lastCommentTimestamp: number;
  commentCount: number;
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YleHistoryService {
  private readonly PROXY_PREFIX = '';//'/yle-history';
  //private readonly API_URL = '/v2/tv/history?limit=40&exclude_sub_accounts=true&fetch_comments=true';
  private readonly API_URL = '/v3/history?limit=40';

  constructor(private http: HttpClient) { }

  /**
   * Fetch users Yle history and filter out everything else other than comments.
   */
  fetchMyDiscussions(): Observable<GroupedDiscussion[]> {
    return this.http.get<any[]>(this.PROXY_PREFIX + this.API_URL, {
      withCredentials: true 
    }).pipe(
      // Filter only comments
      map(items => items.filter(item => item.entity_type === 'article_comment')),

      // transform to GroupedDiscussion format
      map(commentItems => {
        const groups = new Map<string, GroupedDiscussion>();

        commentItems.forEach(item => {
          const id = item.entity_id; // article ID
          
          if (!groups.has(id)) {
            groups.set(id, {
              articleId: id,
              articleTitle: item.article_title || 'Nimetön artikkeli',
              lastCommentTimestamp: item.timestamp,
              commentCount: 1
            });
          } else {
            const group = groups.get(id)!;
            group.commentCount++;

            if (item.timestamp > group.lastCommentTimestamp) {
              group.lastCommentTimestamp = item.timestamp;
            }
          }
        });

        return Array.from(groups.values())
          .sort((a, b) => b.lastCommentTimestamp - a.lastCommentTimestamp);
      })
    );
  }
    
}