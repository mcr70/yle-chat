
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, merge, Observable, of, Subject } from 'rxjs';
import { delay, filter, finalize, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { YleHistoryService, MyDiscussion } from '../../services/yle-history.service';

@Component({
  selector: 'app-my-discussions',
  templateUrl: './my-discussions.component.html',
  styleUrls: ['./my-discussions.component.scss'],
  imports: [ CommonModule ]
})
export class MyDiscussionsComponent implements OnInit {

  myDiscussions$!: Observable<MyDiscussion[]>;
  isLoggedIn$!: Observable<boolean>;

  private refreshTrigger = new Subject<void>();
  private discussionsLoading = new BehaviorSubject<boolean>(false);
  isLoading$: Observable<boolean> = this.discussionsLoading.asObservable(); // Käytetään tätä templatessa

  @Output() discussionSelected = new EventEmitter<MyDiscussion>(); 
  @Output() articleIdFilterChange = new EventEmitter<string>();

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
  }

  
  selectDiscussion(discussion: MyDiscussion): void {
    console.log('Avataan keskustelu ID:lle:', discussion.id,);

    this.discussionSelected.emit(discussion);

    this.articleIdFilterChange.emit(discussion.id);
  }  

  // Tämä funktio ohjaa keskusteluun
  openDiscussion(discussion: MyDiscussion): void {
    // TÄRKEÄÄ: Ota huomioon aiempi logiikkasi, kuinka artikkelinäkymä päivittyy.
    // Koska tavoite on, että "kaikki toimii niin kuin tähänkin asti",
    // tarvitset ehkä output-emitterin tai jaetun palvelun päivittämään näkymän.
    
    // Nyt avataan linkki suoraan (yksinkertaisin tapa):
    window.open(discussion.url, '_blank');
  }

  refreshDiscussions(): void {
    // Lähetä arvo Subjectiin, joka laukaisee koko latausketjun uudelleen.
    this.refreshTrigger.next(); 
  }  
}