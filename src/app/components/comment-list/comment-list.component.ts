import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs'; // Tarvitaan forkJoin asynkroniseen lataukseen

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

  private readonly YLE_ID_REGEX = /^\d{2}-\d{8}$/

  private isManualInput = false;

  articleId: string = ''
  articleTitle: string = '';

  topicDetails: TopicDetails | null = null;
  commentsLocked: boolean = false; 

  currentOffset: number = 0;
  readonly limit: number = 20;

  private MIN_LOADING_TIME_MS = 500;

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


  loadTopicDetails(): Observable<TopicDetails> {
    if (!this.articleId) {
        throw new Error("Article ID is missing."); 
    }

    this.topicDetails = null;
    this.articleTitle = '';
    this.commentsLocked = false;
    
    return this.commentService.getTopicDetails(this.articleId);
  }


  loadComments(reset: boolean = false): void {
    if (this.isLoading) return;
    if (!this.articleId) {
        this.resetState();
        return;
    }
    
    this.isLoading = true;
    const startTime = Date.now();

    // 1. Määritellään ladattavat elementit
    // Ladataan Topic Details vain resetoidessa
    let topicDetails$: Observable<TopicDetails | undefined> = reset 
      ? this.loadTopicDetails() 
      : new Observable<undefined>();
    
    let comments$: Observable<Comment[]>;

    // Jos reset, nollataan tila ennen latauspyyntöä
    if (reset) {
        this.comments = [];
        this.currentOffset = 0;
        this.hasMoreComments = true;
    }

    comments$ = this.commentService.getComments(this.articleId, this.currentOffset, this.limit);

    // 2. Tehdään lataus yhdessä forkJoinilla
    const combinedLoad$: Observable<any> = forkJoin({
        details: topicDetails$,
        comments: comments$
    });


    combinedLoad$.subscribe({
      next: (response) => {
        // Käsittely Topic Details:
        if (response.details) {
            const details = response.details as TopicDetails;
            this.topicDetails = details;
            this.articleTitle = details.title; 
            this.commentsLocked = details.isLocked; 
            const finalTitle = details.title || this.articleId;
            this.historyService.addOrUpdateArticle(this.articleId, finalTitle);
        }

        // Käsittely Kommentit:
        const newComments = response.comments as Comment[];
        this.comments = [...this.comments, ...newComments];
        this.currentOffset += this.limit;

        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }
        
        // nickname filter
        if (this.nicknameFilter.trim().length > 0) {
          this.commentService.markNickname(this.comments, this.nicknameFilter);
        }        

        // ... (viive ja siivous)
        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        const remainingDelay = Math.max(0, this.MIN_LOADING_TIME_MS - elapsedTime);
        
        if (this.historyListComponent) { 
          this.historyListComponent.reloadHistory(); 
        }

        this.cleanupPendingReplies(); 

        setTimeout(() => { 
          this.isLoading = false;
        }, remainingDelay);
      },
      error: (err: any) => {
        console.error('Lataus epäonnistui (Topic/Kommentit):', err.status, err.message);
        this.isLoading = false; 
        this.hasMoreComments = false;

        if (reset) { 
          this.resetState();
        }
      }
    });
  }
  

  private resetState(): void {
    this.comments = [];
    this.currentOffset = 0;
    this.hasMoreComments = false;
    this.topicDetails = null;
    this.articleTitle = '';
    this.commentsLocked = false;
    this.filterFoundMatches = false;
    this.hideUnmarkedTopLevel = false;
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

 
  // Called when user is typing into article-id inpout field
  onArticleIdChanged(newValue: string) {
    const rawInput = newValue.trim();
    let newArticleId = rawInput;
    
    // Tarkistetaan onko syöte URL ja parsitaan siitä ID
    if (rawInput.includes('yle.fi/a/')) {
        const match = rawInput.match(/(\d+-\d+)(?:#.*)?$/);
        if (match && match[1]) {
            newArticleId = match[1]; 
        } else {
            newArticleId = ''; 
        }
    }

    const isNewValue = newArticleId !== this.articleId || (newArticleId === '' && this.articleId !== '');
    const isValidId = newArticleId === '' || this.YLE_ID_REGEX.test(newArticleId);

    if (true || isNewValue) {
      this.isManualInput = true;      
      this.articleId = newArticleId;
      
      if (isValidId) {
          this.loadComments(true); 
      } else {
          this.resetState();
      }

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
    
    this.loadComments(true); 
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