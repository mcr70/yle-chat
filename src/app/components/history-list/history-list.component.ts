import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HistoryService, ArticleHistoryItem } from '../../services/history.service';

@Component({
  selector: 'app-history-list',
  templateUrl: './history-list.component.html',
  styleUrls: ['./history-list.component.scss'],
  imports: [CommonModule]
})
export class HistoryListComponent implements OnInit {
  
  historyItems: ArticleHistoryItem[] = [];

  @Output() articleSelected = new EventEmitter<string>(); // sends selected article ID to parent component

  constructor(private historyService: HistoryService) {}

  ngOnInit(): void {
    this.loadHistory();
  }
  

  loadHistory(): void {
    this.historyItems = this.historyService.getHistory();
  }

  selectArticle(articleId: string): void {
    this.articleSelected.emit(articleId);
    this.loadHistory(); // Refresh history to reflect the updated order
  }
}