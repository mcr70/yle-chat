/**
 * HSCommentService.ts
 *
 * This service handles operations related to comments on Helsingin Sanomat articles.
 * This curl command demonstrates how to fetch comments for a specific article using the Helsingin Sanomat commenting API.
 * 
 * First 3 comments:
 *   curl 'https://www.hs.fi/api/commenting/hs/articles/2000012131437/comments/initial?sort=newest&onlyCommentsWithRealNames=false'
 * 
 * All(?) Comments:
 *   curl 'https://www.hs.fi/api/commenting/hs/articles/2000012131437/comments?sort=newest&onlyCommentsWithRealNames=false'
 * 
 * Some articles:
 *   curl 'https://www.hs.fi/api/laneitems/438218/list?listTemplate=numbered-right' | jq '.[] | {title, href}'
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProviderCapabilities } from '@app/models/provider';
import { TopicDetails, Comment } from '@app/models/comment-service.interface';
import { CommentService } from '@app/models/comment-service.interface';

// Raw interface mapping HS API response
interface HSApiUserIdentity {
  displayName?: string;
  realNameId?: string;
}

interface HSApiComment {
  id: number;
  articleId: number;
  comment: string;
  votes?: {
    totalPositiveVotes?: number;
  };
  parentId?: number | null;
  parent?: HSApiComment | null;
  createdAt: number;
  userIdentity?: HSApiUserIdentity;
}

interface HSApiResponse {
  article: {
    id: number;
    title: string;
    commentingVisible: boolean;
    shareUrl: string;
  };
  comments: HSApiComment[];
  totalComments: number;
}

@Injectable({
  providedIn: 'root'
})
export class HSCommentService implements CommentService {
  readonly id = 'hs';
  readonly displayName = 'Helsingin Sanomat';

  readonly capabilities: ProviderCapabilities = {
    supportsAuth: false,
    supportsUserHistory: false,
    supportsArticleListing: false,
    supportsLiking: false,
    supportsReplying: false
  };

  private readonly INITIAL_COMMENTS_URL_TEMPLATE = '/api/commenting/hs/articles/{articleId}/comments';

  constructor(private http: HttpClient) {}

  /**
   * Gets topic (article) details.
   */
  getTopicDetails(articleId: string): Observable<TopicDetails> {
    if (!articleId || articleId.trim().length === 0) {
      return of({ title: '', isLocked: true, acceptedCommentsCount: 0, externalId: '' });
    }

    const url = this.INITIAL_COMMENTS_URL_TEMPLATE.replace('{articleId}', articleId);
    const params = new HttpParams()
      .set('sort', 'newest')
      .set('onlyCommentsWithRealNames', 'false');

    return this.http.get<HSApiResponse>(url, { params }).pipe(
      map(data => ({
        title: data.article?.title || '',
        articleLink: data.article?.shareUrl || `https://www.hs.fi/art-${articleId}.html`,
        isLocked: !data.article?.commentingVisible,
        acceptedCommentsCount: data.totalComments || 0,
        externalId: String(data.article?.id || articleId)
      }))
    );
  }

  /**
   * Gets comments for a specific HS article.
   */
  getComments(articleId: string, offset: number | string, limit: number): Observable<Comment[]> {
    if (!articleId || articleId.trim().length === 0) {
      return of([]);
    }

    const url = this.INITIAL_COMMENTS_URL_TEMPLATE.replace('{articleId}', articleId);
    const params = new HttpParams()
      .set('sort', 'newest')
      .set('onlyCommentsWithRealNames', 'false');

    return this.http.get<HSApiResponse>(url, { params }).pipe(
      map(response => {
        const rawComments = response.comments || [];
        return this.buildCommentTree(rawComments);
      })
    );
  }

  /**
   * Marks comments that match the given nickname.
   */
  markNickname(comments: Comment[], nickname: string | null): void {
    this.clearNicknameFlags(comments);

    if (!nickname || nickname.trim().length === 0) {
      return;
    }

    this.markRecursive(comments, nickname.trim());
  }

  // ---------------------------------------------------------------------
  // Private Helper Methods
  // ---------------------------------------------------------------------

  /**
   * Flattens and maps raw HS comments into internal Comment interface list.
   */
  private flattenComments(hsComments: HSApiComment[]): Comment[] {
    const flatList: Comment[] = [];

    hsComments.forEach(raw => {
      const idStr = String(raw.id);
      const parentIdStr = raw.parentId ? String(raw.parentId) : null;

      const comment: Comment = {
        id: idStr,
        author: raw.userIdentity?.displayName || 'Anonyymi',
        content: this.cleanContent(raw.comment),
        likes: raw.votes?.totalPositiveVotes || 0,
        createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
        parentId: parentIdStr,
        topCommentId: idStr, // Will be resolved during tree build if nested
        isLiked: false,
        replies: []
      };

      flatList.push(comment);

      // Handle nested parent object if HS API returned it inline
      if (raw.parent) {
        flatList.push(...this.flattenComments([raw.parent]));
      }
    });

    return flatList;
  }

  /**
   * Builds a hierarchical comment tree from HS flat/nested data.
   */
  private buildCommentTree(rawComments: HSApiComment[]): Comment[] {
    const allComments = this.flattenComments(rawComments);

    const commentMap = new Map<string, Comment>();
    const tree: Comment[] = [];

    // Deduplicate and index by ID
    allComments.forEach(comment => {
      if (!commentMap.has(comment.id)) {
        commentMap.set(comment.id, comment);
      }
    });

    commentMap.forEach(comment => {
      const parentId = comment.parentId;

      if (parentId) {
        const parent = commentMap.get(parentId);
        if (parent) {
          comment.topCommentId = parent.topCommentId;
          parent.replies.push(comment);
        } else {
          tree.push(comment); // Parent not in current batch, treat as top-level
        }
      } else {
        tree.push(comment);
      }
    });

    return tree;
  }

  private cleanContent(rawContent: string): string {
    if (!rawContent) return '';
    return rawContent.replace(/<br\s*\/?>/gi, '\n').trim();
  }

  private clearNicknameFlags(comments: Comment[]): void {
    for (const comment of comments) {
      comment.hasNickname = false;

      if (comment.replies?.length) {
        this.clearNicknameFlags(comment.replies);
      }
    }
  }

  private markRecursive(comments: Comment[], nickname: string): boolean {
    let foundInSubTree = false;
    const filter = nickname ? nickname.toLowerCase() : '';

    for (const comment of comments) {
      const ownMatch = comment.author && comment.author.toLowerCase().includes(filter);

      const childMatch = comment.replies?.length
        ? this.markRecursive(comment.replies, nickname)
        : false;

      comment.hasNickname = ownMatch || childMatch;

      if (comment.hasNickname) {
        foundInSubTree = true;
      }
    }

    return foundInSubTree;
  }
}