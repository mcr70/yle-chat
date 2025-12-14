import { Injectable } from '@angular/core';

export interface PendingReply {
  parentId: string;  // ID of the comment being replied to
  replyId: string;   // The temporary ID of the reply (received from POST)
  content: string;   // The content of the reply (for hover/tooltip)
  articleId: string; // The ID of the article (for article-specific cleanup)
}

@Injectable({ providedIn: 'root' })
export class PendingReplyService {
  private readonly STORAGE_KEY = 'pending_replies';

  /**
   * Get all the pending replies for the given article 
   * @param articleId 
   * @returns 
   */
  getPendingRepliesForArticle(articleId: string): PendingReply[] {
    return this.getPendingReplies().filter(r => r.articleId === articleId);
  }

  /**
   * Add new pending reply to service
   * @param reply 
   */
  addPendingReply(reply: PendingReply): void {
    const replies = this.getPendingReplies();
    if (!replies.some(r => r.replyId === reply.replyId)) {
      replies.push(reply);
      this.savePendingReplies(replies);
    }
  }

  /**
   * Removes a pending reply if it has been marked at published.
   * @param replyId 
   */
  removePendingReply(replyId: string): void {
    let replies = this.getPendingReplies();
    replies = replies.filter(r => r.replyId !== replyId);
    this.savePendingReplies(replies);
  }

// ----------------------------------------------------------------------------

  private getPendingReplies(): PendingReply[] {
    const data = localStorage.getItem(this.STORAGE_KEY);

    return data ? JSON.parse(data) : [];
  }

  private savePendingReplies(replies: PendingReply[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(replies));
  }

}