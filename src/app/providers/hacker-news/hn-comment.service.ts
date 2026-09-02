import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommentService, TopicDetails, Comment } from '@app/models/comment-service.interface';

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
  private baseUrl = 'https://hn.algolia.com/api/v1';

  getTopicDetails(topicId: string): Observable<TopicDetails> {
    return this.http.get<AlgoliaStoryResponse>(`${this.baseUrl}/items/${topicId}`).pipe(
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

    return this.http.get<AlgoliaStoryResponse>(`${this.baseUrl}/items/${topicId}`).pipe(
      map(story => {
        if (!story || !story.children) return [];

        // Paginointi 1. tason kommenteille
        const pagedChildren = story.children.slice(startOffset, startOffset + limit);

        return pagedChildren
          .filter(c => c.text !== null) // Suodatetaan poistetut
          .map(c => this.mapAlgoliaComment(c, topicId));
      }),
      catchError(() => of([]))
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

  /**
   * Rekyrsiivinen mäppäys Algolian puurakenteesta sovelluksesi Comment-malliin
   */
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
      isExpanded: true,
      isCollapsed: false
    };
  }
}