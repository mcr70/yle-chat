import { Component, OnInit } from '@angular/core';
import { Comment, CommentService } from '../../services/comment.service';
import { CommonModule } from '@angular/common'; // <-- TUO TÄMÄ
import { HttpClientModule } from '@angular/common/http';
import { CommentItemComponent } from '../comment-item/comment-item.component';
// import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  imports: [CommonModule, HttpClientModule,
    CommentItemComponent
  ]
})
export class CommentListComponent implements OnInit {
  comments: Comment[] = [];
  currentOffset: number = 0; // Seuraavan haun aloituskohta
  readonly limit: number = 10; // Vakio ladattavien kommenttien määrälle
  hasMoreComments: boolean = true; // Näytetäänkö "Lataa lisää" -nappi
  isLoading: boolean = false; // Ladataanko tietoja parhaillaan (käyttöliittymäpalaute)

  constructor(private commentService: CommentService) { }

  ngOnInit(): void {
    this.loadComments(); // Lataa ensimmäinen erä käynnistyksessä
  }

  loadComments(): void {
    if (this.isLoading) return;
    this.isLoading = true;

    this.commentService.getComments(this.currentOffset, this.limit).subscribe({
      next: (newComments) => {
        // Yhdistetään uudet kommentit olemassa oleviin
        this.comments = [...this.comments, ...newComments];
        
        // Kasvatetaan offsetia seuraavaa hakua varten
        this.currentOffset += this.limit;
        
        // Jos palautettuja kommentteja oli vähemmän kuin pyydetty limit, 
        // oletetaan, että kaikki kommentit on ladattu.
        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Kommenttien lataus epäonnistui:', err);
        this.isLoading = false;
        // Voit lisätä tässä virheviestin käyttäjälle
      }
    });
  }

  loadMoreComments(): void {
    this.loadComments();
  }
}