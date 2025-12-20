
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';

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
    CommentItemComponent, HistoryListComponent, LoginPanelComponent, MyDiscussionsComponent,
    RouterModule
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
    private pendingReplyService: PendingReplyService,
    private router: Router,
    private route: ActivatedRoute
  ) {}


  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const idFromUrl = params.get('id');

      if (idFromUrl) {
        this.articleId = idFromUrl;
        this.loadComments(true);
      } 
      else {
        // No ide from url, load latest from history
        const history = this.historyService.getHistory();
        
        if (history && history.length > 0) {
          const latestArticle = history[0];
          this.articleId = latestArticle.id;
          this.articleTitle = latestArticle.title || '';

          this.loadComments(true); 
        }
      }
    });
    
    this.authService.isLoggedIn$.subscribe(() => {
        if (this.articleId) {
            this.loadComments(true); 
        }
    });
}

  loadTopicDetails(): Observable<TopicDetails> {
    if (!this.articleId) {
        throw new Error("Article ID is missing."); 
    }

    this.topicDetails = null;
    this.articleTitle = '';
    this.commentsLocked = false;
    
    console.log(`Load topic details for ${this.articleId}`)
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

    let topicDetails$: Observable<TopicDetails | undefined> = reset 
      ? this.commentService.getTopicDetails(this.articleId) 
      : of(undefined);

    let comments$: Observable<Comment[]>;


    const fetchOffset = reset ? 0 : this.currentOffset;

    console.log(`Load comments for ${this.articleId}, offset ${this.currentOffset}, limit ${this.limit}`);
    comments$ = this.commentService.getComments(this.articleId, fetchOffset, this.limit);

    const combinedLoad$: Observable<any> = forkJoin({
        details: topicDetails$,
        comments: comments$
    });


    combinedLoad$.subscribe({
      next: (response) => {
        if (response.details) {
            const details = response.details as TopicDetails;
            this.topicDetails = details;
            this.articleTitle = details.title; 
            this.commentsLocked = details.isLocked; 
            const finalTitle = details.title || this.articleId;
            this.historyService.addOrUpdateArticle(this.articleId, finalTitle);
        }

        const newComments = response.comments as Comment[];

        if (reset) {
          if (this.comments.length > 0) {
            this.transferCommentState(this.comments, newComments);
          }

          this.comments = newComments;
          this.currentOffset = newComments.length;
          this.hasMoreComments = true;
        } 
        else { // Load more adds into existing list, leaving existing state intact
          this.comments = [...this.comments, ...newComments];
          this.currentOffset += newComments.length;
        }

        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }
        
        if (this.nicknameFilter.trim().length > 0) {
          this.commentService.markNickname(this.comments, this.nicknameFilter);
        }        

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
        console.error('Failed to load (Topic/Comments):', err.status, err.message);
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
    this.isLoading = false;
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
  onArticleIdChanged(rawInput: string): void {
    const parsedId = this.parseArticleIdFromUrl(rawInput);
    
    if (!parsedId) {
        if (rawInput === '') {
             this.router.navigate(['/']);
             this.articleId = '';
        }
        return; 
    }
    
    const currentUrlId = this.route.snapshot.paramMap.get('id');

    if (currentUrlId !== parsedId) {
        this.router.navigate(['/comments', parsedId]);
    }

    this.articleId = parsedId;
  }


  // Called when an article is selected from history
  handleArticleSelected(articleData: ArticleHistoryItem): void {
    if (this.isManualInput) {
      this.articleId = articleData.id;
      return; 
    }    

    this.router.navigate(['/comments', articleData.id]);

  }


  // Called when an article is selected from own discussion list
  handleDiscussionSelected(discussion: GroupedDiscussion): void {
    if (this.isManualInput) {
      this.articleId = discussion.articleId;
      return; 
    }
    
    this.router.navigate(['/comments', discussion.articleId]);
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


  /**
   * Yle article ID is in format XX-XXXXXXXX
   * @param input 
   * @returns 
   */
  private parseArticleIdFromUrl(input: string): string | null {
    if (!input) {
        return null;
    }
    
    const yleIdMatch = input.match(/(\d{2}-\d{8})/);
    
    if (yleIdMatch && yleIdMatch[1]) {
        return yleIdMatch[1];
    }
    
    if (!input.includes(' ')) {
        return input;
    }

    return null; 
  }


  /**
   * After new comments are loaded, transfer the expanded/collapsed state
   * of comments from old list to new list based on comment IDs.
   * 
   * @param oldComments 
   * @param newComments 
   */
  private transferCommentState(oldComments: Comment[], newComments: Comment[]): void {
    const expandedStateMap = new Map<string, boolean>();

    const collectState = (list: Comment[]) => {
      list.forEach(comment => {
        if (comment.isExpanded !== undefined) {
          expandedStateMap.set(comment.id, comment.isExpanded);
        }
        if (comment.children && comment.children.length > 0) {
          collectState(comment.children);
        }
      });
    };

    collectState(oldComments);

    const applyState = (list: Comment[]) => {
      list.forEach(comment => {
        if (expandedStateMap.has(comment.id)) {
          comment.isExpanded = expandedStateMap.get(comment.id);
        }
        if (comment.children && comment.children.length > 0) {
          applyState(comment.children);
        }
      });
    };

    applyState(newComments);
  }

}