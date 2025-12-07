
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, merge, Observable, of, Subject } from 'rxjs';
import { filter, finalize, switchMap } from 'rxjs/operators';

import { AuthService } from '@services/auth.service';
import { YleHistoryService, MyDiscussion, GroupedDiscussion } from '@services/yle-history.service';

@Component({
  selector: 'app-my-discussions',
  templateUrl: './my-discussions.component.html',
  styleUrls: ['./my-discussions.component.scss'],
  imports: [ CommonModule ]
})
export class MyDiscussionsComponent implements OnInit {

  myDiscussions$!: Observable<GroupedDiscussion[]>;
  isLoggedIn$!: Observable<boolean>;

  private refreshTrigger = new Subject<void>();
  private discussionsLoading = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.discussionsLoading.asObservable();

  @Output() discussionSelected = new EventEmitter<GroupedDiscussion>(); 
  @Output() articleIdFilterChange = new EventEmitter<string>();
  @Output() discussionsLoaded = new EventEmitter<GroupedDiscussion[]>();

  constructor(
    private authService: AuthService,
    private historyService: YleHistoryService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    // Luodaan stream, joka laukaisee latauksen joko kirjautumisen TAI napin painalluksen jälkeen.
    const initialLoad$ = this.isLoggedIn$.pipe(
      filter(isLoggedIn => isLoggedIn) // Ladataan vain, kun kirjautunut sisään
    );
    
    // Yhdistetään aloituslataus (initialLoad$) ja napin painallus (refreshTrigger)
    const loadSource$ = merge(initialLoad$, this.refreshTrigger);
    
    this.myDiscussions$ = loadSource$.pipe(
      switchMap(() => {
        
        // Estä NG0100-virhe siirtämällä lataustilan asetus seuraavaan sykliin
        setTimeout(() => {
          this.discussionsLoading.next(true);
        }, 0); 
        
        return this.historyService.fetchMyDiscussions().pipe(
            // Lataus pois päältä, kun valmis
            finalize(() => {
              this.discussionsLoading.next(false);
            })
        );
      })
    );

    // @Output discussions loaded
    this.myDiscussions$.subscribe(discussions => {
      this.discussionsLoaded.emit(discussions);
    });    
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