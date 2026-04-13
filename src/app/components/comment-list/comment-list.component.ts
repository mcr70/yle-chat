
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';

import { Comment, CommentProvider, TopicDetails } from '@app/models/comment-provider.interface';
import { CommentItemComponent } from '@components/comment-item/comment-item.component';
import { MyDiscussionsComponent } from '@components/my-discussions/my-discussions.component';

import { ArticleHistoryItem, HistoryService } from '@services/history.service';
import { HistoryListComponent } from '@components/history-list/history-list.component';
import { LoginPanelComponent } from '@components/login-panel/login-panel.component';
import { GroupedDiscussion } from '@services/yle-history.service';
import { AuthService } from '@services/auth.service';
import { PendingReplyService } from '@services/pending-reply.service';
import { CommentServiceManager } from '@app/services/comment-service-manager.service';


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

  private provider!: CommentProvider;
  
  private isManualInput = false;

  sidebarWidth = 320; // Default width of the sidebar in pixels
  isMobileMenuOpen = false; // For mobile view sidebar toggle

  articleId: string = ''
  articleTitle: string = '';

  topicDetails: TopicDetails | null = null;
  commentsLocked: boolean = false; 

  currentOffset: number = 0;
  readonly limit: number = 1000;

  private MIN_LOADING_TIME_MS = 500;

  comments: Comment[] = [];
  hideUnmarkedTopLevel: boolean = false;
  hasMoreComments: boolean = true;
  isLoading: boolean = false;

  nicknameFilter: string = '';
  currentMatchIndex: number = -1; 
  activeTargetId: string | null = null;

  private filterFoundMatches: boolean = false;
  

  constructor(
    private serviceManager: CommentServiceManager,
    //private commentService: YleCommentService,
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
        this.provider = this.serviceManager.getProvider(this.articleId);

        this.loadComments(true);
      } 
      else {
        // No ide from url, load latest from history
        const history = this.historyService.getHistory();
        
        if (history && history.length > 0) {
          const latestArticle = history[0];
          this.articleTitle = latestArticle.title || '';
          this.articleId = latestArticle.id;
          this.provider = this.serviceManager.getProvider(this.articleId);

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

  // ngAfterViewInit(): void {
  //   this.handleInitialAnchor();
  // }

  loadTopicDetails(): Observable<TopicDetails> {
    if (!this.articleId) {
        throw new Error("Article ID is missing."); 
    }

    this.topicDetails = null;
    this.articleTitle = '';
    this.commentsLocked = false;
    
    console.log(`Load topic details for ${this.articleId}`)
    return this.provider.getTopicDetails(this.articleId);
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
      ? this.provider.getTopicDetails(this.articleId) 
      : of(undefined);

    let comments$: Observable<Comment[]>;


    const fetchOffset = reset ? 0 : this.currentOffset;

    console.log(`Load comments for ${this.articleId}, offset ${this.currentOffset}, limit ${this.limit}`);
    comments$ = this.provider.getComments(this.articleId, fetchOffset, this.limit);

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
          this.provider.markNickname(this.comments, this.nicknameFilter);
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
          //this.checkUrlAnchor();
          this.handleInitialAnchor();
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
    this.provider.markNickname(this.comments, value);

    // Reset navigation state
    this.currentMatchIndex = -1;

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

  // Toggle mobile menu visibility
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : 'auto'; // Prevent background scrolling when menu is open
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

    this.isMobileMenuOpen = false; // Close mobile menu if open
    document.body.style.overflow = 'auto'; 

    this.router.navigate(['/comments', articleData.id]);
  }


  // Called when an article is selected from own discussion list
  handleDiscussionSelected(discussion: GroupedDiscussion): void {
    if (this.isManualInput) {
      this.articleId = discussion.articleId;
      return; 
    }

    this.isMobileMenuOpen = false; // Close mobile menu if open
    document.body.style.overflow = 'auto'; 
    
    this.router.navigate(['/comments', discussion.articleId]);
  }


  startResizing(event: MouseEvent) {
    event.preventDefault();

    const startX = event.clientX;
    const startWidth = this.sidebarWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = startWidth + (moveEvent.clientX - startX);
      
      if (currentWidth >= 150 && currentWidth <= 500) {
        this.sidebarWidth = currentWidth;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  }  


  // vvv  Navigation  vvv
  get matches() {
    const filter = (this.nicknameFilter || '').trim().toLowerCase();
    if (filter.length < 2) return [];
    
    const allMatches: any[] = [];
    
    const flatten = (items: any[]) => {
      if (!items || items.length === 0) return;

      items.forEach(item => {
        const name = item.author || ''; 
        
        if (name.toLowerCase().includes(filter)) {
          allMatches.push(item);
        }
        
        if (item.replies && item.replies.length > 0) {
          flatten(item.replies);
        }
      });
    };
    
    flatten(this.comments);
    return allMatches;
  }

  onFilterChange() {
    this.currentMatchIndex = this.matches.length > 0 ? 0 : -1;
  }

  navigateToMatch(direction: 'next' | 'prev') {
    const total = this.matches.length;
    if (total === 0) return;

    if (direction === 'next') {
      this.currentMatchIndex++;
      if (this.currentMatchIndex >= total) this.currentMatchIndex = 0;
    } else {
      this.currentMatchIndex--;
      if (this.currentMatchIndex < 0) this.currentMatchIndex = total - 1;
    }

    const targetComment = this.matches[this.currentMatchIndex];
    this.ensureCommentIsVisible(this.comments, targetComment.id);

    setTimeout(() => {
      const element = document.getElementById(`comment-${targetComment.id}`);
      if (element) {
        const isMobile = window.innerWidth <= 600;
        const headerOffset = isMobile ? 65 : 200;

        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        this.activeTargetId = targetComment.id;
        setTimeout(() => this.activeTargetId = null, 2500);
      }
    }, 150); // delay to ensure comment is expanded and rendered before scrolling
  }

  // 4. recursus function to ensure the target comment is visible by expanding all its parent comments
  ensureCommentIsVisible(nodes: any[], targetId: string): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        node.isCollapsed = false; // make sure the target comment itself is not collapsed
        return true; 
      }

      if (node.replies && node.replies.length > 0) {
        const foundInChildren = this.ensureCommentIsVisible(node.replies, targetId);
        if (foundInChildren) {
          node.isCollapsed = false; // make sure the parent is not collapsed
          node.isExpanded = true;   // make sure replies are visible so child becomes visible
          return true;
        }
      }
    }
    return false;
  }

//  ^^^  Navigation  ^^^

  private cleanupPendingReplies(): void {
    const pendingReplies = this.pendingReplyService.getPendingRepliesForArticle(this.articleId);
    if (!pendingReplies.length) return;

    const loadedReplyIds = new Set<string>();
    
    const findReplyIds = (comments: Comment[]) => {
      for (const comment of comments) {
        loadedReplyIds.add(comment.id);
        if (comment.replies) {
            findReplyIds(comment.replies);
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
    const stateMap = new Map<string, { expanded?: boolean, collapsed?: boolean }>();

    const collectState = (list: Comment[]) => {
      list.forEach(comment => {
        stateMap.set(comment.id, {
          expanded: comment.isExpanded,
          collapsed: comment.isCollapsed
        });
        if (comment.replies && comment.replies.length > 0) {
          collectState(comment.replies);
        }
      });
    };

    collectState(oldComments);

    const applyState = (list: Comment[]) => {
      list.forEach(comment => {
        const savedState = stateMap.get(comment.id);
        if (savedState) {
          if (savedState.expanded !== undefined) comment.isExpanded = savedState.expanded;
          if (savedState.collapsed !== undefined) comment.isCollapsed = savedState.collapsed;
        }
        if (comment.replies && comment.replies.length > 0) {
          applyState(comment.replies);
        }
      });
    };

    applyState(newComments);
  }


  private handleInitialAnchor(): void {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith('#comment-')) return;

    const commentId = hash.replace('#comment-', '');
    
    /* 1. Wait for comments to load */
    setTimeout(() => {
      /* 2. CRITICAL: Expand parents BEFORE looking for the element */
      const isFoundInData = this.ensureCommentIsVisible(this.comments, commentId);
      
      if (isFoundInData) {
        /* 3. Small delay to let Angular render the newly opened branches */
        setTimeout(() => {
          const element = document.getElementById(`comment-${commentId}`);
          
          if (element) {
            const isMobile = window.innerWidth <= 600;
            const headerOffset = isMobile ? 80 : 220;

            const rect = element.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;

            window.scrollTo({
              top: absoluteTop - headerOffset,
              behavior: 'smooth'
            });
            
            this.activeTargetId = commentId;
            setTimeout(() => this.activeTargetId = null, 3000);
          }
        }, 100); /* Wait for DOM to catch up after ensureCommentIsVisible */
      }
    }, 600);
  }
}