import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Comment, CommentService } from '@services/comment.service'; 
import { Observable, Subscription } from 'rxjs';

import { AuthService } from '@services/auth.service';
import { PendingReplyService, PendingReply } from '@services/pending-reply.service'; // ⭐ UUSI IMPORT ⭐

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule ] 
})
export class CommentItemComponent {
  isLoggedIn: boolean = false;
  isReplying: boolean = false;
  replyText: string = '';

  private authSubscription: Subscription | undefined;

  @Input() articleId!: string; // Needed to make a like/unlike requests
  @Input() comment!: Comment;
  @Input() level: number = 0; 
  @Input() isLocked: boolean = true

  isHoveringReplyButton: boolean = false;  
  pendingReply: PendingReply | null = null;

  constructor(
    private commentService: CommentService,
    private authService: AuthService,
    private pendingReplyService: PendingReplyService
  ) { }


  ngOnInit(): void {
    if (this.comment.isExpanded === undefined) {
      this.comment.isExpanded = false;
    }

    this.checkPendingStatus();

    this.authSubscription = this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });
  }


  get isReplyDisabled(): boolean {
    return this.isLocked;
  }


  toggleReplies(): void {
    this.comment.isExpanded = !this.comment.isExpanded;
  }

  public toggleLike() {
    const articleId = this.articleId; 
    const commentId = this.comment.id;

    if (this.comment.isLiked) { // Unlike
      this.commentService.unlikeComment(articleId, commentId)
        .subscribe({
          next: () => {
            this.comment.isLiked = false;
            this.comment.likes = (this.comment.likes || 0) - 1;
            console.log('Unlike successful.');
          },
          error: (error) => {
            console.error('Unlike failed:', error);
          }
        });
    } 
    else { // Like
      this.commentService.likeComment(articleId, commentId)
        .subscribe({
          next: () => {
            this.comment.isLiked = true;
            this.comment.likes = (this.comment.likes || 0) + 1;
            console.log('Like successful.');
          },
          error: (error) => {
            console.error('Like failed:', error);
          }
        });
    }
  }

  getReplyTooltip(): string | null {
      if (this.isLocked) {
          return 'Keskustelu on suljettu';
      }
      if (this.pendingReply) {
            return `Vastauksesi on käsittelyssä: "${this.pendingReply.content.substring(0, 50)}..."`;
      }
      if (!(this.isLoggedIn)) { 
          return 'Kirjaudu sisään vastataksesi'; 
      }
      return null;
  }

  toggleReplyForm(): void {
    if (this.isLoggedIn) {
      this.isReplying = !this.isReplying;
    }
  }

  sendReply(): void {
    if (this.isReplyDisabled) {
      console.warn("Attempted to send reply to a locked topic");
      return;
    }

    if (!this.replyText.trim()) return; // Don't send an empty comment

    const parentId = this.comment.id;
    
    this.commentService.postReply(this.articleId, this.replyText, parentId).subscribe({
      next: (newCommentData) => {
        console.log('Reply sent, got response:', newCommentData);
        
        const newReply: PendingReply = { // Pending reply
          parentId: this.comment.id,
          replyId: newCommentData.id, 
          content: this.replyText,
          articleId: this.articleId
        };

        this.pendingReplyService.addPendingReply(newReply);
        this.pendingReply = newReply;

        this.isReplying = false;
        this.replyText = '';
      },
      error: (err) => {
        console.error('Failed to send reply', err);
      }
    });
  }


  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fi-FI');
  }


  isSpecialComment(): boolean {
    return this.comment.hasNickname === true;
  }  

  onMouseEnter(): void {
    if (this.pendingReply) {
      this.isHoveringReplyButton = true;
    }
  }

  // -------------------------------------------------------------------------------------
  private checkPendingStatus(): void {
    const pendingReplies = this.pendingReplyService.getPendingRepliesForArticle(this.articleId);
    this.pendingReply = pendingReplies.find(r => r.parentId === this.comment.id) || null;
  }
}