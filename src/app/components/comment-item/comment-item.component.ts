import { Component, Input, OnInit, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { Provider } from '@app/models/provider';
import { Comment } from '@app/models/comment-service.interface';

import { PendingReplyService, PendingReply } from '@services/pending-reply.service'; 
import { ProviderManager } from '@app/models/provider';
import { SafeHtmlPipe } from '@app/pipes/safe-html.pipe';

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, TranslatePipe] 
})
export class CommentItemComponent implements OnInit, OnDestroy {

  private authSubscription: Subscription | undefined;
  
  // Allow provider injection from parent
  @Input() provider!: Provider;
  showCopiedTooltip = signal(false);

  @Input() articleId!: string;
  @Input() comment!: Comment;
  @Input() level: number = 0; 
  @Input() isLocked: boolean = true;

  isLoggedIn = signal(false);
  isReplying = signal(false);

  replyText = signal('');

  isHoveringReplyButton = signal(false);  
  pendingReply = signal<PendingReply | null>(null);
  showPendingCopiedTooltip = signal(false);

  constructor(
    private providerManager: ProviderManager,
    private pendingReplyService: PendingReplyService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    if (!this.provider) {
      const providerId = this.route.snapshot.paramMap.get('provider') || 'yle';
      this.provider = this.providerManager.getProvider(providerId);
    }

    if (this.comment.isExpanded === undefined) {
      this.comment.isExpanded = false;
    }

    this.checkPendingStatus();

    if (this.provider.capabilities.supportsAuth && this.provider.authService) {
      this.authSubscription = this.provider.authService.isLoggedIn$.subscribe(isLoggedIn => {
        this.isLoggedIn.set(isLoggedIn);
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
      this.showCopiedTooltip.set(true);
      setTimeout(() => {
        this.showCopiedTooltip.set(false);
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
      return 'COMMENTS.REPLY_UNSUPPORTED';
    }
    if (this.isLocked) {
      return 'COMMENTS.DISCUSSION_CLOSED';
    }
    if (this.pendingReply()) {
      return 'COMMENTS.PENDING_TOOLTIP';
    }
    if (this.provider.capabilities.supportsAuth && !this.isLoggedIn()) { 
      return 'COMMENTS.LOGIN_TO_REPLY';
    }
    return null;
  }

  toggleReplyForm(): void {
    const canReply = this.provider.capabilities.supportsAuth ? this.isLoggedIn() : true;
    
    if (canReply && this.provider.capabilities.supportsReplying) {
      this.isReplying.update(v => !v);
    }
  }

  sendReply(): void {
    if (this.isReplyDisabled || !this.provider.commentService.postComment) {
      console.warn("Attempted to send reply when locked or not supported");
      return;
    }

    if (!this.replyText().trim()) return;

    const parentId = this.comment.id;
    
    this.provider.commentService.postComment(this.articleId, this.replyText(), parentId).subscribe({
      next: (newCommentData) => {
        console.log('Reply sent, got response:', newCommentData);
        
        const newReply: PendingReply = {
          parentId: this.comment.id,
          replyId: newCommentData.id, 
          content: this.replyText(),
          articleId: this.articleId
        };

        this.pendingReplyService.addPendingReply(newReply);
        this.pendingReply.set(newReply);

        this.isReplying.set(false);
        this.replyText.set('');
      },
      error: (err) => {
        console.error('Failed to send reply', err);
      }
    });
  }

  copyPendingReply(): void {
    const pending = this.pendingReply();
    if (!pending) return;

    navigator.clipboard.writeText(pending.content).then(() => {
      this.showPendingCopiedTooltip.set(true);
      setTimeout(() => {
        this.showPendingCopiedTooltip.set(false);
      }, 1500);
    }).catch(err => {
      console.error('Copy failed: ', err);
    });
  }

  cancelPendingReply(): void {
    const pending = this.pendingReply();
    if (!pending) return;

    this.pendingReplyService.removePendingReply(pending.replyId);    
    this.pendingReply.set(null);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fi-FI');
  }

  isSpecialComment(): boolean {
    return this.comment.hasNickname === true;
  }  

  onMouseEnter(): void {
    if (this.pendingReply()) {
      this.isHoveringReplyButton.set(true);
    }
  }

  private checkPendingStatus(): void {
    const pendingReplies = this.pendingReplyService.getPendingRepliesForArticle(this.articleId);
    this.pendingReply.set(pendingReplies.find(r => r.parentId === this.comment.id) || null);
  }
}