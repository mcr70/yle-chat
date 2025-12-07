import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Comment } from '@services/comment.service'; 

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  imports: [ CommonModule ] 
})
export class CommentItemComponent {
  @Input() comment!: Comment;
  @Input() level: number = 0; 

  ngOnInit(): void {
    if (this.comment.isExpanded === undefined) {
      this.comment.isExpanded = false; //this.level === 0;
    }
  }

  toggleReplies(): void {
    this.comment.isExpanded = !this.comment.isExpanded;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fi-FI');
  }


  isSpecialComment(): boolean {
    return this.comment.hasNickname === true;
  }  
}