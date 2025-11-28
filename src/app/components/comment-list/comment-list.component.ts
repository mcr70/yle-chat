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

  articleId: string = '74-20195254'; // default article ID
  currentOffset: number = 0;
  readonly limit: number = 10;

  comments: Comment[] = [];
  hideUnmarkedTopLevel: boolean = false;
  hasMoreComments: boolean = true;
  isLoading: boolean = false;

  nicknameFilter: string = '';

  private filterFoundMatches: boolean = false;

  constructor(private commentService: CommentService) {}

  ngOnInit(): void {
    this.loadComments();
  }

  loadComments(reset: boolean = false): void {
    if (this.isLoading) return;
    this.isLoading = true;

    if (reset) {
        this.comments = [];
        this.currentOffset = 0;
        this.hasMoreComments = true;
    }
    
    // ⭐ KUTSU PALVELUA UUDELLA ARTICLE ID:LLÄ
    this.commentService.getComments(this.articleId, this.currentOffset, this.limit).subscribe({
      next: (newComments) => {
        // ... (muu logiikka pysyy samana)
        this.comments = [...this.comments, ...newComments];
        this.currentOffset += this.limit;

        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }

        if (this.nicknameFilter.trim().length > 0) {
          this.commentService.markNickname(this.comments, this.nicknameFilter);
        }

        this.isLoading = false;
      },
      error: (err) => {
        // ⭐ VIRHEEN HALLINTA TÄHÄN ⭐
        console.error('Kommenttien lataus epäonnistui (404 tms.):', err.status, err.message);
        
        // Nollaa tila, jotta uudet kutsut ovat mahdollisia
        this.isLoading = false; 
        this.hasMoreComments = false;
        
        // Tyhjennä vanhat kommentit, jotta virhe ei jää näkyviin
        if (reset) {
           this.comments = [];
        }
        // console.log("Tilaus palautettu virheen jälkeen.");
      }
      // ... (error handling)
    });
  }

  loadMoreComments(): void {
    this.loadComments();
  }

  // ⭐ Tämä metodi kutsutaan kun käyttäjä syöttää nicknamea
  onNicknameChanged(value: string): void {
    this.nicknameFilter = value;
    
    // Suorita merkkaus (joka nollaa liput, jos 'value' on tyhjä)
    this.commentService.markNickname(this.comments, value);

    // ⭐ TARKISTA ONSUMAT: Etsi, onko merkittyjä kommentteja olemassa
    this.filterFoundMatches = this.comments.some(comment => 
        comment.hasNickname === true
    );
    
    // Jos osumia ei enää ole, pakota piilotustila pois päältä.
    if (!this.filterFoundMatches) {
        this.hideUnmarkedTopLevel = false;
    }
  }

  get filteredComments(): Comment[] {
    if (!this.hideUnmarkedTopLevel) {
        return this.comments; // Jos suodatin ei ole päällä, näytä kaikki
    }

    // Jos suodatin on päällä, palauta vain ne juurikommentit, jotka on merkitty
    return this.comments.filter(comment => {
        // hasNickname on true vain, jos se itse tai jokin lapsi täsmää filtteriin
        return comment.hasNickname === true;
    });
  }  

  get isHideUnmarkedEnabled(): boolean {
      // Valintaruutu on käytettävissä (enabled) vain, jos löydettiin osumia
      return this.filterFoundMatches;
  }  

  onArticleIdChanged(value: string): void {
    const rawInput = value.trim();
    let newArticleId = rawInput;

    if (rawInput.includes('yle.fi/a/')) {
        const match = rawInput.match(/(\d+-\d+)(?:#.*)?$/);
        
        if (match && match[1]) {
            newArticleId = match[1]; 
        } else {
            newArticleId = ''; 
        }
    }

    this.articleId = newArticleId;
    
    if (this.articleId.trim().length > 0) {
        this.loadComments(true); 
    } else {
        this.comments = [];
        this.hasMoreComments = false;
        this.isLoading = false;
    }
  }


}
