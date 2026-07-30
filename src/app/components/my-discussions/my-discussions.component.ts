import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, EMPTY, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, filter, finalize, switchMap, tap } from 'rxjs/operators';

import { Provider } from '@app/models/provider';
import { GroupedDiscussion } from '@app/models/my-history-service.interface';
import { ProviderManager } from '@app/models/provider';

import { SpinnerComponent } from '@components/spinner/spinner.component';
import { SessionStateService } from '@app/services/session-state.service';

@Component({
  selector: 'app-my-discussions',
  templateUrl: './my-discussions.component.html',
  styleUrls: ['./my-discussions.component.scss'],
  standalone: true,
  imports: [ CommonModule, SpinnerComponent ]
})
export class MyDiscussionsComponent implements OnInit, OnDestroy {

  discussionsData$: BehaviorSubject<GroupedDiscussion[]> = new BehaviorSubject<GroupedDiscussion[]>([]);
  public readonly myDiscussions$: Observable<GroupedDiscussion[]> = this.discussionsData$.asObservable();
  
  // Initialize with BehaviorSubject to guarantee immediate state for the template pipe
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$: Observable<boolean> = this.isLoggedInSubject.asObservable();

  private refreshTrigger = new Subject<void>();
  private discussionsLoading = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.discussionsLoading.asObservable();

  private subscription = new Subscription();
  public provider!: Provider;

  @Output() discussionSelected = new EventEmitter<GroupedDiscussion>(); 
  @Output() articleIdFilterChange = new EventEmitter<string>();

  displayLimit = 5;

  constructor(
    private providerManager: ProviderManager,
    private route: ActivatedRoute,
    private sessionStateService: SessionStateService  
  ) {}

  ngOnInit(): void {
    // Resolve active provider ID from route or parent route
    const providerId = 
      this.route.snapshot.paramMap.get('provider') || 
      this.route.snapshot.parent?.paramMap.get('provider') || 
      'yle';

    this.provider = this.providerManager.getProvider(providerId);

    // Guard against providers without history capability or missing service
    if (!this.provider.capabilities.supportsUserHistory || !this.provider.myHistoryService) {
      this.isLoggedInSubject.next(false);
      return;
    }

    // Determine authentication state stream
    const auth$ = (this.provider.capabilities.supportsAuth && this.provider.authService)
      ? this.provider.authService.isLoggedIn$
      : of(true);

    // Keep component auth state synchronized with the template
    const authSub = auth$.subscribe(loggedIn => {
      this.isLoggedInSubject.next(loggedIn);
    });
    this.subscription.add(authSub);

    // Trigger data fetch on auth state change (if logged in) or manual refresh
    const loadTrigger$ = merge(
      auth$.pipe(filter(isLoggedIn => isLoggedIn)),
      this.refreshTrigger
    );

    const fetchSub = loadTrigger$.pipe(
      switchMap(() => {
        if (!this.provider.myHistoryService) {
          return EMPTY;
        }

        // Avoid NG0100 ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.discussionsLoading.next(true);
        }, 0);

        return this.provider.myHistoryService.fetchMyDiscussions().pipe(
          tap(data => {
            this.discussionsData$.next(data);
          }),
          finalize(() => {
            this.discussionsLoading.next(false);
          }),
          catchError((err) => {
            console.error('Failed to fetch user discussions:', err);
            return EMPTY;
          })
        );
      })
    ).subscribe();

    this.subscription.add(fetchSub);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  selectDiscussion(discussion: GroupedDiscussion): void {
    this.sessionStateService.setSelectedArticleId(this.provider.id, discussion.articleId);
    this.discussionSelected.emit(discussion);
    this.articleIdFilterChange.emit(discussion.articleId);
  }  

  openDiscussion(discussion: any): void {
    if (discussion.url) {
      window.open(discussion.url, '_blank');
    }
  }

  refreshDiscussions(): void {
    this.refreshTrigger.next(); 
  }  

  getTooltipForComments(comments: { content: string, date?: Date }[]): string {
    if (!comments || comments.length === 0) {
      return 'Ei kommentteja.';
    }
    
    return comments
      .map((comment) => {
        const snippet = comment.content.slice(0, 100).trim();
        return `- ${snippet}${comment.content.length > 100 ? '...' : ''}`;
      })
      .join('\r\n\r\n');
  }  
}