import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Comment, CommentService } from '@services/comment.service'; 
import { Observable } from 'rxjs';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule ] 
})
export class CommentItemComponent {
  isLoggedIn$!: Observable<boolean>;

  isReplying: boolean = false;
  replyText: string = '';

  @Input() articleId!: string; // Needed to make a like/unlike requests
  @Input() comment!: Comment;
  @Input() level: number = 0; 

  constructor(
    private commentService: CommentService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.comment.isExpanded === undefined) {
      this.comment.isExpanded = false;
    }

    this.isLoggedIn$ = this.authService.isLoggedIn$;
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

  toggleReplyForm(): void {
    this.isReplying = !this.isReplying;
    this.replyText = '';
  }


  sendReply(): void {
    if (!this.replyText.trim()) return; // Don't send an empty comment

    const parentId = this.comment.id;
    
    this.commentService.postReply(this.articleId, this.replyText, parentId).subscribe({
      next: (response) => {
          console.log('Vastaus lähetetty onnistuneesti:', response);
          
          this.isReplying = false;
          this.replyText = '';
      },
      error: (err) => {
        console.error('Vastauksen lähetys epäonnistui:', err);
      }
    });
  }


  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fi-FI');
  }


  isSpecialComment(): boolean {
    return this.comment.hasNickname === true;
  }  
}