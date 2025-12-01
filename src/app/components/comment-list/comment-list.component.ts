import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { switchMap, tap, catchError } from 'rxjs/operators'; 

import { Comment, CommentService } from '../../services/comment.service';
import { CommentItemComponent } from '../comment-item/comment-item.component';
import { ArticleHistoryItem, HistoryService } from '../../services/history.service';
import { HistoryListComponent } from '../history-list/history-list.component';
import { TitleFetchService } from '../../services/title-fetch.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  imports: [
    CommonModule, 
    HttpClientModule,
    CommentItemComponent,
    HistoryListComponent
  ]
})
export class CommentListComponent implements OnInit {

  @ViewChild(HistoryListComponent) historyListComponent!: HistoryListComponent;

  articleId: string = ''// '74-20195254'; // default article ID
  articleTitle: string = '';

  currentOffset: number = 0;
  readonly limit: number = 20;

  private MIN_LOADING_TIME_MS = 500; // 0.5 seconds

  comments: Comment[] = [];
  hideUnmarkedTopLevel: boolean = false;
  hasMoreComments: boolean = true;
  isLoading: boolean = false;

  nicknameFilter: string = '';

  private filterFoundMatches: boolean = false;

  constructor(
    private commentService: CommentService,
    private historyService: HistoryService,
    private titleFetchService: TitleFetchService
  ) {}

  ngOnInit(): void {
    const history = this.historyService.getHistory();
    
    if (history && history.length > 0) {
      const latestArticle = history[0];
      this.articleId = latestArticle.id;
      
      this.loadComments(true); 
    }    
  }

loadComments(reset: boolean = false): void {
    if (this.isLoading) return;
    this.isLoading = true;

    if (reset) { // Reset happens if the articleId changes
      this.comments = [];
      this.currentOffset = 0;
      this.hasMoreComments = true;
    }

    const startTime = Date.now();

    // Get comments and title in parallel
    const comments$ = this.commentService.getComments(this.articleId, this.currentOffset, this.limit);
    const title$ = this.titleFetchService.fetchTitle(this.articleId).pipe(
      catchError(() => of(`${this.articleId}`)) // Fallback to articleId on error
    );

    // Use forkJoin to run both requests in parallel and wait for both to complete
    forkJoin({
      newComments: comments$,
      title: title$
    }).subscribe({
      next: (result) => {
        const newComments = result.newComments;
        this.articleTitle = result.title; 

        this.comments = [...this.comments, ...newComments];
        this.currentOffset += this.limit;

        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }
        
        // nickname filter
        if (this.nicknameFilter.trim().length > 0) {
          this.commentService.markNickname(this.comments, this.nicknameFilter);
        }        

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const remainingDelay = Math.max(0, this.MIN_LOADING_TIME_MS - elapsedTime);

        // Update history
        this.historyService.addOrUpdateArticle(this.articleId, this.articleTitle);

        // Päivitys listaan
        if (this.historyListComponent) { 
          this.historyListComponent.reloadHistory(); 
        }

        setTimeout(() => { // Make sure loading spinner is visible for minimum time
          this.isLoading = false;
        }, remainingDelay);
      },
      error: (err: any) => {
        console.error('Kommenttien lataus epäonnistui (404 tms.):', err.status, err.message);
        this.isLoading = false; 
        this.hasMoreComments = false;
        if (reset) { this.comments = []; }
      }
    });
  }

  loadMoreComments(): void {
    this.loadComments();
  }


  onNicknameChanged(value: string): void {
    this.nicknameFilter = value;
    this.commentService.markNickname(this.comments, value);

    this.filterFoundMatches = this.comments.some(comment => 
      comment.hasNickname === true
    );
    
    if (!this.filterFoundMatches) {
      this.hideUnmarkedTopLevel = false;
    }
  }

  get filteredComments(): Comment[] {
    if (!this.hideUnmarkedTopLevel) {
      return this.comments; 
    }

    return this.comments.filter(comment => {
      return comment.hasNickname === true;
    });
  }  

  get isHideUnmarkedEnabled(): boolean {
    return this.filterFoundMatches;
  }  

 

  onArticleIdChanged(newArticleId: string) {
    this.articleId = newArticleId;
    this.loadComments(true); 
  }

  // Called when an article is selected from history
  handleArticleSelected(articleData: ArticleHistoryItem): void {
    console.log('History selected ID:', articleData.id);
    this.articleId = articleData.id; 
    this.loadComments(true);
  }
}
