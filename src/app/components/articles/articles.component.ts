import { Component, OnInit, OnDestroy, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY, merge, Subject, Subscription } from 'rxjs';
import { catchError, finalize, ignoreElements, switchMap, tap } from 'rxjs/operators';

import { Provider, ProviderManager } from '@app/models/provider';
import { SessionStateService } from '@services/session-state.service';
import { RefreshService } from '@app/services/resfresh.service';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  imports: [CommonModule, TranslatePipe]
})
export class ArticlesComponent implements OnInit, OnDestroy {

  // Signals for state
  public articles = signal<any[]>([]);
  public isLoading = signal<boolean>(false);

  // Triggers
  private refreshTrigger = new Subject<void>();

  // Outputs to change active article in the main panel
  @Output() articleSelected = new EventEmitter<any>();
  @Output() articleIdFilterChange = new EventEmitter<string>();

  public provider!: Provider;
  private subscription = new Subscription();

  constructor(
    private providerManager: ProviderManager,
    private route: ActivatedRoute,
    private sessionStateService: SessionStateService,
    private refreshService: RefreshService
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
      console.warn(`Provider ${providerId} does not support article listing or lacks an article service.`);
      return;
    }

    // Initial load runs immediately on init, merged with manual refresh clicks
    const loadSource$ = merge(this.refreshTrigger);

    const sub = loadSource$.pipe(
      switchMap(() => {
        if (!this.provider.articleService) {
          return EMPTY;
        }

        this.isLoading.set(true);

        return this.provider.articleService.getArticles().pipe(
          tap(data => {
            this.articles.set(data);
            console.log(`Fetched ${data.length} articles from provider ${this.provider.id}.`);

            // Handle automatic article restoration / default selection
            if (data && data.length > 0) {
              const savedArticleId = this.sessionStateService.getSelectedArticleId(this.provider.id);
              const targetArticle = data.find(a => a.id === savedArticleId) || data[0];

              this.selectArticleInternal(targetArticle);
            }
          }),
          finalize(() => {
            this.isLoading.set(false);
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

    this.subscription.add( // Listen for manual refresh from toolbar or other components
      this.refreshService.refresh$.subscribe(() => {
        this.refreshArticles();
      })
    );


    // Trigger the initial load automatically
    this.refreshArticles();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // Internal selection logic (used both by auto-select and user click)
  private selectArticleInternal(article: any): void {
    this.sessionStateService.setSelectedArticleId(this.provider.id, article.id);
    this.articleSelected.emit(article);
    this.articleIdFilterChange.emit(article.id);
  }

  // Handle article selection click from template
  selectArticle(event: Event, article: any): void {
    event.preventDefault();
    this.selectArticleInternal(article);
  }

  // Trigger manual or initial reload
  refreshArticles(): void {
    this.refreshTrigger.next();
  }
}