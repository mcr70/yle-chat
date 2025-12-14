import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


import { TopicDetails, Comment, CommentService } from '@services/comment.service';
import { CommentItemComponent } from '@components/comment-item/comment-item.component';
import { MyDiscussionsComponent } from '@components/my-discussions/my-discussions.component';

import { ArticleHistoryItem, HistoryService } from '@services/history.service';
import { HistoryListComponent } from '@components/history-list/history-list.component';
import { LoginPanelComponent } from '@components/login-panel/login-panel.component';
import { GroupedDiscussion } from '@services/yle-history.service';
import { AuthService } from '@services/auth.service';
import { PendingReplyService } from '@services/pending-reply.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss'],
  imports: [
    CommonModule, FormsModule,
    HttpClientModule,
    CommentItemComponent, HistoryListComponent, LoginPanelComponent, MyDiscussionsComponent
  ]
})
export class CommentListComponent implements OnInit {

  @ViewChild(HistoryListComponent) historyListComponent!: HistoryListComponent;

  private isManualInput = false; // Controls for how the article id has been set in ui

  articleId: string = ''
  articleTitle: string = '';

  topicDetails: TopicDetails | null = null;
  commentsLocked: boolean = false; 

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
    private authService: AuthService,
    private pendingReplyService: PendingReplyService
  ) {}

  ngOnInit(): void {
    const history = this.historyService.getHistory();
    
    if (history && history.length > 0) {
      const latestArticle = history[0];
      this.articleId = latestArticle.id;
      this.articleTitle = latestArticle.title || '';

      this.loadComments(true); 
    }

    // Reload comments, in case of auth change, to update like/unlike statuses
    this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.loadComments(true); 
    });    
  }


  loadTopicDetails(): void {
    if (!this.articleId) {
      this.topicDetails = null;
      this.articleTitle = '';
      this.commentsLocked = false;
      return;
    }

    this.commentService.getTopicDetails(this.articleId).subscribe({
      next: (details: TopicDetails) => {
        this.topicDetails = details;
        this.articleTitle = details.title; 
        this.commentsLocked = details.isLocked; 

        const finalTitle = details.title || this.articleId;
        this.historyService.addOrUpdateArticle(this.articleId, finalTitle);
      },
      error: (err) => {
        // Jos API-kutsu epäonnistuu (esim. topicia ei löydy), nollaa tila.
        console.error('Artikkelin tietojen lataus epäonnistui:', err);
        this.topicDetails = null;
        this.articleTitle = this.articleId; // Käytä ID:tä otsikkona virhetilanteessa
        this.commentsLocked = true; // Oletetaan lukituksi varmuuden vuoksi
      }
    });
  }


  loadComments(reset: boolean = false): void {
    if (this.isLoading) return;
    this.isLoading = true;

    if (reset && this.articleId) {
        this.loadTopicDetails(); 
    }

    if (reset) { // Reset happens if the articleId changes
      this.comments = [];
      this.currentOffset = 0;
      this.hasMoreComments = true;
    }

    console.log(`Loading ${this.articleId}, ${this.articleTitle}, offset=${this.currentOffset}, limit=${this.limit}`)

    const startTime = Date.now();

    this.commentService.getComments(this.articleId, this.currentOffset, this.limit).subscribe({
      next: (newComments) => {
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
        
        // reload
        if (this.historyListComponent) { 
          this.historyListComponent.reloadHistory(); 
        }

        this.cleanupPendingReplies(); // Check if pending replies have been published and cleanup

        setTimeout(() => { // Make sure loading spinner is visible for minimum time
          this.isLoading = false;
        }, remainingDelay);
      },
      error: (err: any) => {
        console.error('Kommenttien lataus epäonnistui (404 tms.):', err.status, err.message);
        this.isLoading = false; 
        this.hasMoreComments = false;

        if (reset) { 
          this.comments = []; 
        }
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

 
  // Callend when user is typing into article-id inpout field
  onArticleIdChanged(newValue: string) {
    const rawInput = newValue.trim();
    let newArticleId = rawInput;
    
    if (rawInput.includes('yle.fi/a/')) {
        const match = rawInput.match(/(\d+-\d+)(?:#.*)?$/);
        if (match && match[1]) {
            newArticleId = match[1]; 
        } else {
            newArticleId = ''; 
        }
    }

    if (newArticleId !== this.articleId || (newArticleId === '' && this.articleId !== '')) {
      this.isManualInput = true;      
      this.articleId = newArticleId;
      this.loadComments(true); 

      setTimeout(() => {
          this.isManualInput = false;
      }, 0); 
    }
  }


  // Called when an article is selected from history
  handleArticleSelected(articleData: ArticleHistoryItem): void {
    if (this.isManualInput) {
      this.articleId = articleData.id;
      return; 
    }    

    this.articleId = articleData.id; 
    this.historyService.addOrUpdateArticle(this.articleId, this.articleTitle || this.articleId);
    
    if (this.historyListComponent) { 
        this.historyListComponent.reloadHistory(); 
    }
    
    this.loadComments(true);
  }


  // Called when an article is selected from own discussion list
  handleDiscussionSelected(discussion: GroupedDiscussion): void {
    if (this.isManualInput) {
      this.articleId = discussion.articleId;
      return; 
    }

    this.articleId = discussion.articleId;
    
    this.loadComments(true); // loadComments gets automatically called due to [(ngModel)] in html
  }


  private cleanupPendingReplies(): void {
    const pendingReplies = this.pendingReplyService.getPendingRepliesForArticle(this.articleId);
    if (!pendingReplies.length) return;

    const loadedReplyIds = new Set<string>();
    
    const findReplyIds = (comments: Comment[]) => {
      for (const comment of comments) {
        loadedReplyIds.add(comment.id);
        if (comment.children) {
            findReplyIds(comment.children);
        }
      }
    };

    findReplyIds(this.comments);


    for (const pending of pendingReplies) {
        if (loadedReplyIds.has(pending.replyId)) {
            console.log(`Pending reply ${pending.replyId} approved`);
            this.pendingReplyService.removePendingReply(pending.replyId);
        }
    }
  }

}
