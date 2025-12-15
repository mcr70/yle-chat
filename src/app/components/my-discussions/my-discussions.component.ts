
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, EMPTY, merge, Observable, of, Subject } from 'rxjs';
import { catchError, filter, finalize, ignoreElements, switchMap, tap } from 'rxjs/operators';

import { AuthService } from '@services/auth.service';
import { YleHistoryService, MyDiscussion, GroupedDiscussion } from '@services/yle-history.service';
import { HistoryService } from '@app/services/history.service';

@Component({
  selector: 'app-my-discussions',
  templateUrl: './my-discussions.component.html',
  styleUrls: ['./my-discussions.component.scss'],
  imports: [ CommonModule ]
})
export class MyDiscussionsComponent implements OnInit {

  // discussionData is the one fetched, myDiscussions is the one used in template
  discussionsData$: BehaviorSubject<GroupedDiscussion[]> = new BehaviorSubject<GroupedDiscussion[]>([]);
  public readonly myDiscussions$: Observable<GroupedDiscussion[]> = this.discussionsData$.asObservable();  isLoggedIn$!: Observable<boolean>;


  private refreshTrigger = new Subject<void>();
  private discussionsLoading = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.discussionsLoading.asObservable();

  @Output() discussionSelected = new EventEmitter<GroupedDiscussion>(); 
  @Output() articleIdFilterChange = new EventEmitter<string>();


  constructor(
    private authService: AuthService,
    private yleHistory: YleHistoryService,
    private historyService: HistoryService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    const initialLoad$ = this.isLoggedIn$.pipe(
      filter(isLoggedIn => isLoggedIn) // Load only if logged in
    );
    
    // Load only if logged in or refresh button clicked
    const loadSource$ = merge(initialLoad$, this.refreshTrigger);
    
    loadSource$.pipe(
      switchMap(() => {
        
        // Prevent NG0100 -error
        setTimeout(() => {
          this.discussionsLoading.next(true);
        }, 0); 
        
        return this.yleHistory.fetchMyDiscussions().pipe(
            tap(data => { 
                this.discussionsData$.next(data); // Updated loaded data with new data once it succeeds
            }),
            
            finalize(() => {
              this.discussionsLoading.next(false); // Stop loading indicator
            }),
            
            catchError(() => EMPTY), 
            ignoreElements() // don't pass on elements
        );
      })
    ).subscribe();
 
  }

  
  selectDiscussion(discussion: GroupedDiscussion): void {
    this.discussionSelected.emit(discussion);
    this.articleIdFilterChange.emit(discussion.articleId);
  }  


  openDiscussion(discussion: MyDiscussion): void {
    window.open(discussion.url, '_blank');
  }

  refreshDiscussions(): void {
    this.refreshTrigger.next(); 
  }  

  getTooltipForComments(comments: { content: string, date?: Date }[]): string {
    if (!comments || comments.length === 0) {
      return 'Ei kommentteja.';
    }
    
    return comments
      .map((comment, index) => {
        const snippet = comment.content.slice(0, 100).trim();
        return `- ${snippet}${comment.content.length > 100 ? '...' : ''}`;
      })
      .join('\r\n\r\n'); // two linebreaks 
  }  

}