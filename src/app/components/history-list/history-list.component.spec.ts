import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideTranslateService } from '@ngx-translate/core';
import { HistoryListComponent } from './history-list.component';
import { HistoryService, ArticleHistoryItem } from '@services/history.service';

describe('HistoryListComponent', () => {
  let component: HistoryListComponent;
  let fixture: ComponentFixture<HistoryListComponent>;
  let historyService: HistoryService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryListComponent],
      providers: [
        provideTranslateService(),
        HistoryService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryListComponent);
    component = fixture.componentInstance;
    historyService = TestBed.inject(HistoryService);
    fixture.detectChanges();
  });

  // Verifies component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Tests loading history items into signal
  it('should load history items from HistoryService', () => {
    const mockItems: ArticleHistoryItem[] = [
      { id: 'art-1', title: 'Test Article 1', timestamp: 12345 }
    ];

    historyService.getHistory = () => mockItems;
    component.loadHistory();

    expect(component.historyItems().length).toBe(1);
    expect(component.historyItems()[0].id).toBe('art-1');
  });

  // Tests emitting articleSelected when selectArticle is called
  it('should emit articleSelected event when selecting an article', () => {
    const item: ArticleHistoryItem = { id: 'art-1', title: 'Test Article 1', timestamp: 12345 };
    let emittedItem: ArticleHistoryItem | null = null;

    component.articleSelected.subscribe(selected => {
      emittedItem = selected;
    });

    component.selectArticle(item);
    expect(emittedItem).toEqual(item);
  });
});
