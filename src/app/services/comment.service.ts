/**
 * Service for fetching and processing comments from Yle Comments API.
 * 
 * 
 * Restrictions
 *   - "Order must be one the following created_at:desc, created_at:asc, relevance:desc"
 *   - "Limit must be between 1 and 20"
 *   - "Only authenticated users can like comments"
 * 
 * 
 * API endpoint examples:
 *   - accepted:
 *     curl "https://comments.api.yle.fi/v2/topics/74-20194923/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc&limit=10&offset=0"
 *       - order: relevance:desc | created_at:desc | created_at:asc
 *       - limit: 1-20
 *       - offset: 0+
 * 
 *   - login, sets cookie: "ylelogin=...", which is needed for like/unlike
 *     curl -v -X POST "https://login.api.yle.fi/v1/user/login?app_id=tunnus_shared_ui_202004_prod&app_key=0aded2b7c4387042dbfb19cfcf152663&initiating_app=uutiset" -d 'username=...&password=...'
 * 
 *   - logout, invalidates cookie:
 *     curl -v -b "ylelogin=9a379db791bd15999..." \
 *          -X DELETE "https://login.api.yle.fi/v1/user/login?app_id=tunnus_shared_ui_202004_prod&app_key=0aded2b7c4387042dbfb19cfcf152663&initiating_app=uutiset"
 * 
 *   - like:
 *     curl -b "ylelogin=9a379db791bd15999..." \
 *          -X POST "https://comments.api.yle.fi/v1/topics/74-20196472/comments/33-6031200c-0d86-4409-8cb6-73ab512ba94e/like?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D"
 * 
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';


export interface Comment {
  id: string;
  author: string;
  content: string;
  likes: number;
  createdAt: string;
  children: Comment[]; 
  parentId: string | null; 
  topCommentId: string; 
  isExpanded?: boolean;

  hasNickname?: boolean; // Marks if comment matches nickname filter
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private PROXY_PREFIX = '';//'/yle-api';
  private apiBaseTemplate = '/v2/topics/{articleId}/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc';

  constructor(private http: HttpClient) { }



  /**
   * Gets comments for a specific article with pagination.
   * 
   * @param articleId article identifier
   * @param offset starting offset 
   * @param limit  number of comments to fetch (max 20)
   * @returns 
   */
  getComments(articleId: string, offset: number, limit: number): Observable<Comment[]> {
    console.log(`Fetching comments for articleId=${articleId}, offset=${offset}, limit=${limit}`);  

    if (!articleId || articleId.trim().length === 0) {
        return new Observable(observer => observer.next([])).pipe(map(() => []));
    }

    const baseUrl = this.apiBaseTemplate.replace('{articleId}', articleId);
    const apiUrl = `${this.PROXY_PREFIX}${baseUrl}&limit=${limit}&offset=${offset}`;

    return this.http.get<Comment[]>(apiUrl).pipe(
      map(data => this.buildCommentTree(data))
    );
  }

  /**
   * Flattens a nested comment structure into a flat list.
   */
  private flattenComments(comments: Comment[]): Comment[] {
    const flatList: Comment[] = [];

    comments.forEach(comment => {
      flatList.push(comment);
      if (comment.children && comment.children.length > 0) {
        flatList.push(...this.flattenComments(comment.children));
      }
      comment.children = []; 
    });

    return flatList;
  }

  /**
   * Builds a hierarchical comment tree from a flat list of comments.
   */
  private buildCommentTree(apiData: Comment[]): Comment[] {
    const allComments = this.flattenComments(apiData);
    
    const commentMap = new Map<string, Comment>();
    const tree: Comment[] = [];

    allComments.forEach(comment => {
      commentMap.set(comment.id, comment);
    });

    allComments.forEach(comment => {
      const parentId = comment.parentId;

      if (parentId) {
        const parent = commentMap.get(parentId);
        
        if (parent) {
          parent.children.push(comment);
        } else {
          tree.push(comment); // parent not found, treat as top-level
        }
      } else {
        tree.push(comment); // no parentId, top-level comment
      }
    });

    return tree;
  }


  /**
   * Marks comments that match the given nickname.
   * 
   * @param comments 
   * @param nickname 
   * @returns 
   */
  markNickname(comments: Comment[], nickname: string | null): void {
    this.clearNicknameFlags(comments);

    if (!nickname || nickname.trim().length === 0) {
      return;
    }

    this.markRecursive(comments, nickname.trim());
  }


  private clearNicknameFlags(comments: Comment[]): void {
    for (const comment of comments) {
      comment.hasNickname = false;

      if (comment.children?.length) {
        this.clearNicknameFlags(comment.children);
      }
    }
  }


  private markRecursive(comments: Comment[], nickname: string): boolean {
    let foundInSubTree = false;

    const lowercasedNickname = nickname ? nickname.toLowerCase() : '';

    for (const comment of comments) {
        const ownMatch = comment.author
            && comment.author.toLowerCase().startsWith(lowercasedNickname);

        const childMatch = comment.children?.length
            ? this.markRecursive(comment.children, nickname)
            : false;
            
        comment.hasNickname = ownMatch || childMatch; // set flag if current comment or child matches

        if (comment.hasNickname) {
            foundInSubTree = true; 
        }
    }

    return foundInSubTree; 
  }
}