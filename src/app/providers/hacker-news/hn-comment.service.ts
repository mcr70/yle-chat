import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { CommentService, TopicDetails, Comment } from '@app/models/comment-service.interface';

interface HNItemRaw {
  id: number;
  by?: string;
  text?: string;
  time: number;
  score?: number;
  title?: string;
  url?: string;
  descendants?: number;
  kids?: number[];
  parent?: number;
  deleted?: boolean;
  dead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class HNCommentService implements CommentService {
  private http = inject(HttpClient);
  private baseUrl = 'https://hacker-news.firebaseio.com/v0';

  getTopicDetails(topicId: string): Observable<TopicDetails> {
    return this.fetchItem(parseInt(topicId, 10)).pipe(
      map(item => {
        if (!item) {
          throw new Error(`Topic '${topicId}' not found`);
        }
        return {
          title: item.title || '',
          articleLink: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          isLocked: false,
          acceptedCommentsCount: item.descendants || 0,
          externalId: item.id.toString()
        };
      })
    );
  }

  getComments(topicId: string, offset: number | string, limit: number): Observable<Comment[]> {
    const id = parseInt(topicId, 10);
    const startOffset = typeof offset === 'number' ? offset : parseInt(offset, 10) || 0;

    return this.fetchItem(id).pipe(
      switchMap(story => {
        if (!story || !story.kids || story.kids.length === 0) {
          return of([]);
        }

        const pagedKidIds = story.kids.slice(startOffset, startOffset + limit);
        if (pagedKidIds.length === 0) {
          return of([]);
        }

        return forkJoin(
          pagedKidIds.map(kidId => this.fetchCommentTree(kidId, topicId))
        );
      }),
      map(comments => comments.filter((c): c is Comment => c !== null))
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

  // --- Rekyyrsiivinen kommenttipuun haku (1. ja 2. tason vastaukset) ---

  private fetchCommentTree(commentId: number, topCommentId: string): Observable<Comment | null> {
    return this.fetchItem(commentId).pipe(
      switchMap(raw => {
        if (!raw || raw.deleted || raw.dead || !raw.text) {
          return of(null);
        }

        const baseComment: Comment = {
          id: raw.id.toString(),
          parentId: raw.parent ? raw.parent.toString() : null,
          author: raw.by || 'Anonyymi',
          content: raw.text,
          likes: raw.score || 0,
          createdAt: new Date(raw.time * 1000).toISOString(),
          replies: [],
          topCommentId: topCommentId,
          isLiked: false,
          isExpanded: true,
          isCollapsed: false
        };

        if (!raw.kids || raw.kids.length === 0) {
          return of(baseComment);
        }

        // Haetaan eka taso alavastauksia (rajoitetaan 5 suosituimpaan vastaukseen)
        const childRequests = raw.kids.slice(0, 5).map(childId => 
          this.fetchCommentTree(childId, topCommentId)
        );

        return forkJoin(childRequests).pipe(
          map(replies => {
            baseComment.replies = replies.filter((r): r is Comment => r !== null);
            return baseComment;
          })
        );
      })
    );
  }

  private fetchItem(id: number): Observable<HNItemRaw | null> {
    return this.http.get<HNItemRaw>(`${this.baseUrl}/item/${id}.json`).pipe(
      catchError(() => of(null))
    );
  }
}