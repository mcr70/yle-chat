import { Component, OnInit } from '@angular/core';
import { Comment, CommentService } from '../../services/comment.service';
import { CommonModule } from '@angular/common'; // <-- TUO TÄMÄ
import { HttpClientModule } from '@angular/common/http';
// import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  imports: [CommonModule, HttpClientModule]
})
export class CommentListComponent implements OnInit {
  comments: Comment[] = [];
  errorMessage: string = '';

  constructor(private commentService: CommentService) { }

  ngOnInit(): void {
    this.fetchComments();
  }

  fetchComments(): void {
    this.commentService.getComments().subscribe({
      next: (data) => {
        // Suoraan saamasi JSON on ylätason kommenttien lista
        this.comments = data;
      },
      error: (err) => {
        console.error('Virhe kommenttien latauksessa:', err);
        this.errorMessage = 'Kommenttien lataus epäonnistui. Yritä myöhemmin uudelleen.';
      }
    });
  }

  // Muotoilee päivämäärän luettavaan muotoon
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fi-FI');
  }
}