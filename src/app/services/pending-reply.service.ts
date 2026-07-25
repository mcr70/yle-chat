import { Injectable } from '@angular/core';

// Public interface: Clean and strictly what components care about
export interface PendingReply {
  parentId: string | null;  // ID of the comment being replied to. If null, it's a top-level comment
  replyId: string;   // The temporary ID of the reply (received from POST)
  content: string;   // The content of the reply (for hover/tooltip)
  articleId: string; // The ID of the article (for article-specific cleanup)
}

// Internal interface: Extends the public interface for storage and cleanup logic
interface StoredPendingReply extends PendingReply {
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class PendingReplyService {
  private readonly STORAGE_KEY = 'pending_replies';
  private readonly MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours timeout for pending replies

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
    const replies = this.getStoredPendingReplies();
    if (!replies.some(r => r.replyId === reply.replyId)) {
      const storedItem: StoredPendingReply = {
        ...reply,
        timestamp: Date.now() // Timestamp added internally here
      };
      replies.push(storedItem);
      this.savePendingReplies(replies);
    }
  }

  /**
   * Removes a pending reply if it has been marked as published.
   * @param replyId 
   */
  removePendingReply(replyId: string): void {
    let replies = this.getStoredPendingReplies();
    replies = replies.filter(r => r.replyId !== replyId);
    this.savePendingReplies(replies);
  }

// ----------------------------------------------------------------------------

  /**
   * Public-facing getter: Returns clean PendingReply objects without internal metadata
   */
  private getPendingReplies(): PendingReply[] {
    return this.getStoredPendingReplies().map(({ timestamp, ...cleanReply }) => cleanReply);
  }

  /**
   * Internal getter: Handles session storage, JSON parsing, and expiration cleanup
   */
  private getStoredPendingReplies(): StoredPendingReply[] {
    const data = sessionStorage.getItem(this.STORAGE_KEY);
    if (!data) return [];

    try {
      const replies: StoredPendingReply[] = JSON.parse(data);
      const now = Date.now();

      // Filter out expired items (older than 12h) automatically
      const validReplies = replies.filter(r => r.timestamp && (now - r.timestamp < this.MAX_AGE_MS));

      // If any expired items were filtered out, save cleaned list back to session storage
      if (validReplies.length !== replies.length) {
        this.savePendingReplies(validReplies);
      }

      return validReplies;
    } catch {
      return [];
    }
  }

  private savePendingReplies(replies: StoredPendingReply[]): void {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(replies));
  }
}