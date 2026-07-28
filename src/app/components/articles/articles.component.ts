import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, EMPTY, merge, Observable, Subject, Subscription } from 'rxjs';
import { catchError, finalize, ignoreElements, switchMap, tap } from 'rxjs/operators';

import { Provider, ProviderManager } from '@app/models/provider';
import { SpinnerComponent } from '@components/spinner/spinner.component';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  imports: [CommonModule, SpinnerComponent]
})
export class ArticlesComponent implements OnInit, OnDestroy {

  // Data storage and public stream for template
  private articlesData$ = new BehaviorSubject<any[]>([]);
  public readonly articles$: Observable<any[]> = this.articlesData$.asObservable();

  // Triggers and loading states
  private refreshTrigger = new Subject<void>();
  private articlesLoading = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.articlesLoading.asObservable();

  // Outputs to change active article in the main panel
  @Output() articleSelected = new EventEmitter<any>();
  @Output() articleIdFilterChange = new EventEmitter<string>();

  public provider!: Provider;
  private subscription = new Subscription();

  constructor(
    private providerManager: ProviderManager,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Resolve active provider ID from route or parent route
    const providerId = 
      this.route.snapshot.paramMap.get('provider') || 
      this.route.snapshot.parent?.paramMap.get('provider') || 
      'yle';

    this.provider = this.providerManager.getProvider(providerId);

    // Guard against providers without article listing capability
    if (!this.provider.capabilities.supportsArticleListing || !this.provider.articleService) {
      return;
    }

    // Initial load runs immediately on init, merged with manual refresh clicks
    const loadSource$ = merge(this.refreshTrigger);

    const sub = loadSource$.pipe(
      switchMap(() => {
        if (!this.provider.articleService) {
          return EMPTY;
        }

        // Prevent NG0100 ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.articlesLoading.next(true);
        }, 0);

        return this.provider.articleService.getArticles().pipe(
          tap(data => {
            this.articlesData$.next(data);
          }),
          finalize(() => {
            this.articlesLoading.next(false);
          }),
          catchError((err) => {
            console.error('Failed to fetch articles:', err);
            return EMPTY;
          }),
          ignoreElements()
        );
      })
    ).subscribe();

    this.subscription.add(sub);

    // Trigger the initial load automatically
    this.refreshArticles();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Handle article selection click
  selectArticle(event: Event, article: any): void {
    event.preventDefault();
    this.articleSelected.emit(article);
    this.articleIdFilterChange.emit(article.id);
  }

  // Trigger manual or initial reload
  refreshArticles(): void {
    this.refreshTrigger.next();
  }
}