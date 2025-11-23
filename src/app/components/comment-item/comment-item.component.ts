import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

// Käytetään samaa Comment-rajapintaa kuin aiemmin
import { Comment } from '../../services/comment.service'; 

@Component({
  selector: 'app-comment-item',
  templateUrl: './comment-item.component.html',
  styleUrls: ['./comment-item.component.scss'],
  standalone: true,
  imports: [CommonModule] // Tarvitaan *ngIf ja *ngFor
})
export class CommentItemComponent {
  @Input() comment!: Comment;
  @Input() level: number = 0; // Käytetään sisennystä varten

  // UUSI TILA: Kontrolloi lapsien näkyvyyttä
  isExpanded: boolean = true; 

  ngOnInit(): void {
    // Voi olla hyödyllistä asettaa lapsikommentit (level > 0) oletuksena suljetuiksi
    // Tämä esimerkki jättää ne oletuksena auki.
  }

  // UUSI METODI: Vaihtaa näkyvyystilaa
  toggleReplies(): void {
    this.isExpanded = !this.isExpanded;
  }

  // Muotoilee päivämäärän
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fi-FI');
  }
}