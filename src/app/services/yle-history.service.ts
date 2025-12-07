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
  title: string;
  url: string;
  comments: { content: string, date?: Date }[]; // List of user commants
  latestCommentContent: string; 
}


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YleHistoryService {
  private readonly PROXY_PREFIX = '';//'/yle-history';
  private readonly API_URL = '/v2/tv/history?limit=40&exclude_sub_accounts=true&fetch_comments=true';

  constructor(private http: HttpClient) { }

  /**
   * Fetch users Yle history and filter out everything else other than comments.
   */
  fetchMyDiscussions(): Observable<GroupedDiscussion[]> {
    console.log('Fetch users comment history');
    
    return this.http.get<YleHistoryItem[]>(this.PROXY_PREFIX + this.API_URL, {
      withCredentials: true 
    }).pipe(
      // Filter only comments
      map(items => items.filter(item => item.application === 'comments' && item.comment && item.comment.url)),      
      // Convert to GroupedDiscussion
      map(commentItems => {
        
        const groupedDiscussionsMap = new Map<string, GroupedDiscussion>();
        
        commentItems.forEach(item => {
          const articleId = this.parseArticleIdFromUrl(item.comment!.url);
          const commentContent = item.comment!.content;
          
          if (!articleId) return; // Skip, if failed to get articleId 

          if (groupedDiscussionsMap.has(articleId)) {
            // If article is already found, add CommentContent into comments
            const existing = groupedDiscussionsMap.get(articleId)!;
            existing.comments.push({ content: commentContent });
            existing.latestCommentContent = commentContent; // Päivitä tuorein kommentti
            
          } 
          else {
            // Creste new GroupedDiscussion
            groupedDiscussionsMap.set(articleId, {
              articleId: articleId,
              title: item.comment!.title,
              url: item.comment!.url,
              latestCommentContent: commentContent,
              comments: [{ content: commentContent }]
            });
          }
        });

        // Map -> Array
        return Array.from(groupedDiscussionsMap.values());
      }),      
      catchError(error => {
        if (error.status === 401 || error.status === 403) {
          console.warn('YleHistoryService: User is not logged in, return empty list');
          return of([]);
        }

        return throwError(() => new Error('Virhe historiatiedon hakemisessa.'));
      })
    );
  }

  private parseArticleIdFromUrl(url: string): string {
    // regex to parse article-id after "/a/<article-id>"
    // article-id is expected to be in format "<number>-<number>""
    const match = url.match(/\/a\/(\d+-\d+)$/);
    if (match && match[1]) {
      return match[1];
    }
    
    return ''; 
  }  
}