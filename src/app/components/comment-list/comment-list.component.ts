import { Component, OnInit, OnDestroy, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subscription, forkJoin, of } from 'rxjs';

import { Provider } from '@app/models/provider';
import { Comment, TopicDetails } from '@app/models/comment-service.interface';

import { CommentItemComponent } from '@components/comment-item/comment-item.component';
import { MyDiscussionsComponent } from '@components/my-discussions/my-discussions.component';

import { ArticleHistoryItem, HistoryService } from '@services/history.service';
import { HistoryListComponent } from '@components/history-list/history-list.component';
import { ArticlesComponent } from '@components/articles/articles.component';
import { ToolbarComponent } from '@components/toolbar/toolbar.component';
import { GroupedDiscussion } from '@app/models/my-history-service.interface';
import { PendingReply, PendingReplyService } from '@services/pending-reply.service';
import { ProviderManager } from '@app/models/provider';

import { SpinnerComponent } from '@components/spinner/spinner.component';
import { SessionStateService } from '@app/services/session-state.service';
import { RefreshService } from '@app/services/resfresh.service';


type SortOption = 'newest' | 'oldest' | 'mostLiked' | 'mostReplies';

const CURRENT_INFO_VERSION = '1.0';
const INFO_VERSION_KEY = 'app_info_seen_version';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss', './new-main-comment.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    CommentItemComponent, ToolbarComponent, MyDiscussionsComponent,
    ArticlesComponent, RouterModule
]
})
export class CommentListComponent implements OnInit, OnDestroy {

  @ViewChild(HistoryListComponent) historyListComponent!: HistoryListComponent;

  public provider!: Provider;

  private subscription = new Subscription();

  private authSubscription?: Subscription;

  private isManualInput = false;
  private currentProviderId: string = 'yle';

  activeSort: SortOption = 'mostLiked';
  sidebarWidth = 320;
  isMobileMenuOpen = false;

  articleId: string = '';
  articleTitle: string = '';

  topicDetails: TopicDetails | null = null;
  commentsLocked: boolean = false; 
  pendingMainComments: PendingReply[] = [];

  currentOffset: number = 0;
  readonly limit: number = 1000;

  comments: Comment[] = [];
  hasMoreComments: boolean = true;
  isLoading: boolean = false;

  nicknameFilter: string = '';
  currentMatchIndex: number = -1; 
  activeTargetId: string | null = null;

  showNewCommentForm: boolean = false;
  newCommentText: string = '';

  isInfoModalOpen = false;
  showScrollTop: boolean = false;

  private currentRouteArticleId: string | null = null;


  constructor(
    private providerManager: ProviderManager,
    private historyService: HistoryService,
    private pendingReplyService: PendingReplyService,
    private sessionStateService: SessionStateService,
    private refreshService: RefreshService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.currentProviderId = params.get('provider') || 'yle';
      const idFromUrl = params.get('id');

      const articleChanged =
        this.currentRouteArticleId !== null &&
        this.currentRouteArticleId !== idFromUrl;

      this.currentRouteArticleId = idFromUrl;

      if (articleChanged) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      this.setupProvider(this.currentProviderId);

      if (idFromUrl) {
        this.articleId = idFromUrl;
        this.sessionStateService.setSelectedArticleId(this.currentProviderId, idFromUrl);
        this.loadComments(true);
      } 
      else {
        const history = this.historyService.getHistory();
        
        if (history && history.length > 0) {
          const latestArticle = history[0];
          this.articleTitle = latestArticle.title || '';
          this.articleId = latestArticle.id;
          
          this.sessionStateService.setSelectedArticleId(this.currentProviderId, latestArticle.id);

          this.loadComments(true); 
        }
      }
    });

    this.subscription.add(
      this.refreshService.refresh$.subscribe(() => {
        console.log('CommentListComponent: Päivitetään kommentit...');
        this.loadComments(true); 
      })
    );
    
    this.checkIfInfoModalShouldOpen();
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }

    this.subscription.unsubscribe();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }


  private setupProvider(providerId: string): void {
    this.provider = this.providerManager.getProvider(providerId);

    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
      this.authSubscription = undefined;
    }

    if (this.provider.capabilities.supportsAuth && this.provider.authService) {
      this.authSubscription = this.provider.authService.isLoggedIn$.subscribe(() => {
        if (this.articleId) {
          this.loadComments(true); 
        }
      });
    }
  }

  toggleNewCommentForm(): void {
    if (this.commentsLocked || !this.articleId || !this.provider.capabilities.supportsReplying) return;
    this.showNewCommentForm = !this.showNewCommentForm;
    if (!this.showNewCommentForm) {
      this.newCommentText = '';
    }
  }

  submitNewComment(): void {
    if (!this.newCommentText.trim() || !this.articleId || !this.provider.commentService.postComment) return;

    this.isLoading = true;

    this.provider.commentService.postComment(this.articleId, this.newCommentText.trim(), undefined).subscribe({
      next: (newCommentData) => {
        console.log('Main comment sent, got response:', newCommentData);

        const newMainComment: PendingReply = {
          parentId: null,
          replyId: newCommentData.id,
          content: this.newCommentText.trim(),
          articleId: this.articleId
        };

        this.pendingReplyService.addPendingReply(newMainComment);
        this.pendingMainComments.unshift(newMainComment);

        this.newCommentText = '';
        this.showNewCommentForm = false;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to submit new main comment:', err);
        this.isLoading = false;
      }
    });
  }

  loadComments(reset: boolean = false): void {
    if (this.isLoading) return;
    if (!this.articleId) {
        this.resetState();
        return;
    }

    this.pendingMainComments = this.pendingReplyService.getPendingRepliesForArticle(this.articleId)
      .filter(r => r.parentId === null);
    this.isLoading = true;

    let topicDetails$: Observable<TopicDetails | undefined> = reset 
      ? this.provider.commentService.getTopicDetails(this.articleId) 
      : of(undefined);

    const fetchOffset = reset ? 0 : this.currentOffset;

    console.log(`Load comments for ${this.articleId}, offset ${this.currentOffset}, limit ${this.limit}`);
    const comments$: Observable<Comment[]> = this.provider.commentService.getComments(this.articleId, fetchOffset, this.limit);

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
        else {
          this.comments = [...this.comments, ...newComments];
          this.currentOffset += newComments.length;
        }

        if (newComments.length < this.limit) {
          this.hasMoreComments = false;
        }
        
        if (this.nicknameFilter.trim().length > 0) {
          this.provider.commentService.markNickname(this.comments, this.nicknameFilter);
        }        
        
        if (this.historyListComponent) { 
          this.historyListComponent.reloadHistory(); 
        }

        this.isLoading = false; 
        this.currentMatchIndex = -1;
        this.handleInitialAnchor();

        this.cleanupPendingReplies(); 
        this.applySorting();
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


  applySorting(): void {
    if (!this.comments || this.comments.length === 0) return;

    switch (this.activeSort) {
      case 'newest':
        this.comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;

      case 'oldest':
        this.comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;

      case 'mostLiked':
        this.comments.sort((a, b) => b.likes - a.likes);
        break;

      case 'mostReplies':
        this.comments.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
        break;
    }
  }


  private resetState(): void {
    this.comments = [];
    this.currentOffset = 0;
    this.hasMoreComments = false;
    this.topicDetails = null;
    this.articleTitle = '';
    this.commentsLocked = false;
    this.isLoading = false;
    this.currentMatchIndex = -1;
    this.showNewCommentForm = false;
    this.newCommentText = '';
  }

  loadMoreComments(): void {
    this.loadComments();
  }

  onNicknameChanged(value: string): void {
    this.nicknameFilter = value;
    this.provider.commentService.markNickname(this.comments, value);

    this.currentMatchIndex = -1;

  }

  get filteredComments(): Comment[] {
    return this.comments; 
  }  

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : 'auto';
  }  

  onArticleIdChanged(rawInput: string): void {
    const parsedId = this.parseArticleIdFromUrl(rawInput);
    
    if (!parsedId) {
        if (rawInput === '') {
             this.router.navigate([`/${this.currentProviderId}/comments`]);
             this.articleId = '';
        }
        return; 
    }
    
    this.sessionStateService.setSelectedArticleId(this.currentProviderId, parsedId);

    const currentUrlId = this.route.snapshot.paramMap.get('id');

    if (currentUrlId !== parsedId) {
      this.navigateToArticle(parsedId);
    }

    this.articleId = parsedId;
  }

  handleArticleSelected(articleData: ArticleHistoryItem): void {
    if (this.isManualInput) {
      this.articleId = articleData.id;
      return; 
    }    

    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto'; 

    this.navigateToArticle(articleData.id);
  }

  handleDiscussionSelected(discussion: GroupedDiscussion): void {
    if (this.isManualInput) {
      this.articleId = discussion.articleId;
      return; 
    }

    this.isMobileMenuOpen = false;
    document.body.style.overflow = 'auto'; 
    
    this.navigateToArticle(discussion.articleId);
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
    }, 150);
  }

  ensureCommentIsVisible(nodes: any[], targetId: string): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        node.isCollapsed = false;
        return true; 
      }

      if (node.replies && node.replies.length > 0) {
        const foundInChildren = this.ensureCommentIsVisible(node.replies, targetId);
        if (foundInChildren) {
          node.isCollapsed = false;
          node.isExpanded = true;
          return true;
        }
      }
    }
    return false;
  }

  openInfoModal(): void { 
    this.isInfoModalOpen = true;
  }

  closeInfoModal(): void {
    this.isInfoModalOpen = false;
    localStorage.setItem(INFO_VERSION_KEY, CURRENT_INFO_VERSION);
  }

  // Listen to skrolling events to show/hide the scroll-to-top button
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const isMobile = window.innerWidth <= 600;
    this.showScrollTop = isMobile ? window.scrollY > 300: window.scrollY > 5000;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }



  private checkIfInfoModalShouldOpen(): void {
    const savedVersion = localStorage.getItem(INFO_VERSION_KEY);

    if (!savedVersion || savedVersion !== CURRENT_INFO_VERSION) {
      this.isInfoModalOpen = true;
    }
  }

  private navigateToArticle(articleId: string): void {
    this.router.navigate([`/${this.currentProviderId}/comments`, articleId]);
  }

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

    this.pendingMainComments = this.pendingReplyService.getPendingRepliesForArticle(this.articleId)
      .filter(r => r.parentId === null);
  }

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
    
    setTimeout(() => {
      const isFoundInData = this.ensureCommentIsVisible(this.comments, commentId);
      
      if (isFoundInData) {
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
        }, 100);
      }
    }, 600);
  }
}