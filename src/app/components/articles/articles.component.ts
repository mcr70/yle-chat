import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, EMPTY, merge, Observable, Subject } from 'rxjs';
import { catchError, finalize, ignoreElements, switchMap, tap } from 'rxjs/operators';

import { YleArticlesService } from '@services/yle-articles.service';
import { SpinnerComponent } from '@components/spinner/spinner.component';

@Component({
  selector: 'app-articles',
  templateUrl: './articles.component.html',
  styleUrls: ['./articles.component.scss'],
  imports: [CommonModule, SpinnerComponent]
})
export class ArticlesComponent implements OnInit {

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

  constructor(private articlesService: YleArticlesService) { }

  ngOnInit(): void {
    // Initial load runs immediately on init, merged with manual refresh clicks
    const loadSource$ = merge(this.refreshTrigger);

    loadSource$.pipe(
      switchMap(() => {
        // Prevent NG0100 ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.articlesLoading.next(true);
        }, 0);

        return this.articlesService.getArticles().pipe(
          tap(data => {
            this.articlesData$.next(data);
          }),
          finalize(() => {
            this.articlesLoading.next(false);
          }),
          catchError(() => EMPTY),
          ignoreElements()
        );
      })
    ).subscribe();

    // Trigger the initial load automatically
    this.refreshArticles();
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