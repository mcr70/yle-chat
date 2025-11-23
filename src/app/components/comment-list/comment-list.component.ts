import { Component, OnInit } from '@angular/core';
import { Comment, CommentService } from '../../services/comment.service';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CommentItemComponent } from '../comment-item/comment-item.component';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  imports: [
    CommonModule, 
    HttpClientModule,
    CommentItemComponent
  ]
})
export class CommentListComponent implements OnInit {

  comments: Comment[] = [];

  currentOffset: number = 0;
  readonly limit: number = 10;
  hasMoreComments: boolean = true;
  isLoading: boolean = false;

  // ⭐ UUSI: nickname-filtteri
  nicknameFilter: string = '';

  constructor(private commentService: CommentService) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.commentService.getComments(this.currentOffset, this.limit).subscribe({
      next: (newComments) => {
        this.comments = [...this.comments, ...newComments];
        this.currentOffset += this.limit;

        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }

        // ⭐ Tärkeä: merkitse nickname heti kun kommentteja tulee lisää
        if (this.nicknameFilter.trim().length > 0) {
          this.commentService.markNickname(this.comments, this.nicknameFilter);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Kommenttien lataus epäonnistui:', err);
        this.isLoading = false;
      }
    });
  }

  loadMoreComments(): void {
    this.loadComments();
  }

  // ⭐ Tämä metodi kutsutaan kun käyttäjä syöttää nicknamea
  onNicknameChanged(value: string): void {
    console.log('Nickname filter changed to:', value);
    this.nicknameFilter = value;
    this.commentService.markNickname(this.comments, value);
  }
}
