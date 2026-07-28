import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Provider } from '@app/models/provider';
import { Comment } from '@app/models/comment-service.interface';

import { PendingReplyService, PendingReply } from '@services/pending-reply.service'; 
import { ProviderManager } from '@app/models/provider';

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule ] 
})
export class CommentItemComponent implements OnInit, OnDestroy {

  private authSubscription: Subscription | undefined;
  public provider!: Provider;
  showCopiedTooltip: boolean = false;

  @Input() articleId!: string;
  @Input() comment!: Comment;
  @Input() level: number = 0; 
  @Input() isLocked: boolean = true;

  isLoggedIn: boolean = false;
  isReplying: boolean = false;
  isCollapsed: boolean = false;

  replyText: string = '';

  isHoveringReplyButton: boolean = false;  
  pendingReply: PendingReply | null = null;

  constructor(
    private providerManager: ProviderManager,
    private pendingReplyService: PendingReplyService
  ) { }

  ngOnInit(): void {
    this.provider = this.providerManager.getProvider(this.articleId);

    if (this.comment.isExpanded === undefined) {
      this.comment.isExpanded = false;
    }

    this.checkPendingStatus();

    if (this.provider.capabilities.supportsAuth && this.provider.authService) {
      this.authSubscription = this.provider.authService.isLoggedIn$.subscribe(isLoggedIn => {
        this.isLoggedIn = isLoggedIn;
      });
    }
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  copyLink(commentId: string): void {
    const baseUrl = window.location.origin + window.location.pathname + window.location.search;
    const shareUrl = `${baseUrl}#comment-${commentId}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      this.showCopiedTooltip = true;
      setTimeout(() => {
        this.showCopiedTooltip = false;
      }, 1500);      
    }).catch(err => {
      console.error('Could not copy link: ', err);
    });
  } 

  get isReplyDisabled(): boolean {
    return this.isLocked || !this.provider.capabilities.supportsReplying;
  }

  toggleCollapse() {
    this.comment.isCollapsed = !this.comment.isCollapsed;
  }

  toggleReplies(): void {
    this.comment.isExpanded = !this.comment.isExpanded;
  }

  public toggleLike() {
    if (!this.provider.capabilities.supportsLiking || !this.provider.commentService.likeComment) {
      return;
    }

    const articleId = this.articleId; 
    const commentId = this.comment.id;

    if (this.comment.isLiked) { // Unlike
      if (this.provider.commentService.unlikeComment) {
        this.provider.commentService.unlikeComment(articleId, commentId)
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
    } 
    else { // Like
      this.provider.commentService.likeComment(articleId, commentId)
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
    if (!this.provider.capabilities.supportsReplying) {
      return 'Vastaaminen ei ole tuettu tällä alustalla';
    }
    if (this.isLocked) {
      return 'Keskustelu on suljettu';
    }
    if (this.pendingReply) {
      return `Vastauksesi on käsittelyssä: "${this.pendingReply.content.substring(0, 50)}..."`;
    }
    if (this.provider.capabilities.supportsAuth && !this.isLoggedIn) { 
      return 'Kirjaudu sisään vastataksesi'; 
    }
    return null;
  }

  toggleReplyForm(): void {
    const canReply = this.provider.capabilities.supportsAuth ? this.isLoggedIn : true;
    
    if (canReply && this.provider.capabilities.supportsReplying) {
      this.isReplying = !this.isReplying;
    }
  }

  sendReply(): void {
    if (this.isReplyDisabled || !this.provider.commentService.postComment) {
      console.warn("Attempted to send reply when locked or not supported");
      return;
    }

    if (!this.replyText.trim()) return;

    const parentId = this.comment.id;
    
    this.provider.commentService.postComment(this.articleId, this.replyText, parentId).subscribe({
      next: (newCommentData) => {
        console.log('Reply sent, got response:', newCommentData);
        
        const newReply: PendingReply = {
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

  private checkPendingStatus(): void {
    const pendingReplies = this.pendingReplyService.getPendingRepliesForArticle(this.articleId);
    this.pendingReply = pendingReplies.find(r => r.parentId === this.comment.id) || null;
  }
}