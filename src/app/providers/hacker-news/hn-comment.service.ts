import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { CommentService, TopicDetails, Comment } from '@app/models/comment-service.interface';
import { HNAuthService } from './hn-auth.service';

interface AlgoliaComment {
  id: number;
  author: string;
  text: string | null;
  created_at: string;
  parent_id: number | null;
  children: AlgoliaComment[];
}

interface AlgoliaStoryResponse {
  id: number;
  title: string;
  url: string;
  points: number;
  children: AlgoliaComment[];
}

@Injectable({
  providedIn: 'root'
})
export class HNCommentService implements CommentService {
  private http = inject(HttpClient);
  private authService = inject(HNAuthService);

  private readonly algoliaBaseUrl = 'https://hn.algolia.com/api/v1';
  private readonly proxyUrl = '/hn-api';

  getTopicDetails(topicId: string): Observable<TopicDetails> {
    return this.http.get<AlgoliaStoryResponse>(`${this.algoliaBaseUrl}/items/${topicId}`).pipe(
      map(story => ({
        title: story.title || '',
        articleLink: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        isLocked: false,
        acceptedCommentsCount: story.children ? story.children.length : 0,
        externalId: story.id.toString()
      }))
    );
  }

  getComments(topicId: string, offset: number | string, limit: number): Observable<Comment[]> {
    const startOffset = typeof offset === 'number' ? offset : parseInt(offset, 10) || 0;

    return this.http.get<AlgoliaStoryResponse>(`${this.algoliaBaseUrl}/items/${topicId}`).pipe(
      map(story => {
        if (!story || !story.children) return [];

        const pagedChildren = story.children.slice(startOffset, startOffset + limit);

        return pagedChildren
          .filter(c => c.text !== null)
          .map(c => this.mapAlgoliaComment(c, topicId));
      }),
      catchError(() => of([]))
    );
  }

  
  postComment(topicId: string, content: string, parentId?: string): Observable<any> {
    const targetParentId = parentId || topicId;
    const cookie = this.authService.getUserCookie();

    if (!cookie) {
      return throwError(() => new Error('Kirjaudu sisään lähettääksesi kommentin.'));
    }

    const requestHeaders = new HttpHeaders({
      'x-hn-cookie': cookie
    });

    const replyUrl = `${this.proxyUrl}/reply?id=${targetParentId}`;

    return this.http.get(replyUrl, {
      headers: requestHeaders,
      responseType: 'text'
    }).pipe(
      switchMap((htmlPage: string) => {
        if (htmlPage.includes('You have to be logged in to reply')) {
          return throwError(() => new Error('HN Istunto vanhentunut. Kirjaudu uudelleen sisään.'));
        }

        const hmacMatch = htmlPage.match(/name="hmac"\s+value="([^"]+)"/);
        const gotoMatch = htmlPage.match(/name="goto"\s+value="([^"]*)"/);

        if (!hmacMatch || !hmacMatch[1]) {
          return throwError(() => new Error('HMAC-turvatokenia ei löytynyt sivulta.'));
        }

        const hmac = hmacMatch[1];
        const gotoPath = (gotoMatch && gotoMatch[1]) ? gotoMatch[1] : `item?id=${topicId}#${targetParentId}`;

        const body = new HttpParams()
          .set('parent', targetParentId)
          .set('goto', gotoPath)
          .set('hmac', hmac)
          .set('text', content);

        // Älä aseta Referer- tai Cookie-otsakkeita täällä – selain kieltää ne
        const postHeaders = new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-hn-cookie': cookie
        });

        return this.http.post(`${this.proxyUrl}/comment`, body.toString(), {
          headers: postHeaders,
          responseType: 'text'
        });
      }),
      map((responseHtml: string) => {
        console.log('=== HN COMMENT RESPONSE HTML ===');
        console.log(responseHtml);

        if (responseHtml.includes('You have to be logged in') || responseHtml.includes('Unknown or expired link')) {
          throw new Error('HN hylkäsi kommentin.');
        }
        return { success: true };
      }),
      catchError(err => {
        console.error('HN Comment posting failed:', err);
        return throwError(() => err);
      })
    );
  }

  markNickname(comments: Comment[], nickname: string | null): void {
    if (!nickname) {
      comments.forEach(c => {
        c.hasNickname = false;
        if (c.replies?.length) this.markNickname(c.replies, null);
      });
      return;
    }

    const lowerNick = nickname.toLowerCase();
    const checkComment = (comment: Comment) => {
      comment.hasNickname = comment.author.toLowerCase().includes(lowerNick);
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.forEach(checkComment);
      }
    };

    comments.forEach(checkComment);
  }

  private mapAlgoliaComment(raw: AlgoliaComment, topCommentId: string): Comment {
    return {
      id: raw.id.toString(),
      parentId: raw.parent_id ? raw.parent_id.toString() : null,
      author: raw.author || 'Anonyymi',
      content: raw.text || '',
      likes: 0,
      createdAt: raw.created_at,
      replies: (raw.children || [])
        .filter(child => child.text !== null)
        .map(child => this.mapAlgoliaComment(child, topCommentId)),
      topCommentId: topCommentId,
      isLiked: false,
      isExpanded: false,
      isCollapsed: false
    };
  }
}