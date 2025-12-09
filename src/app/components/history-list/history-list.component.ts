import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HistoryService, ArticleHistoryItem } from '@services/history.service'; 

@Component({
  selector: 'app-history-list',
  templateUrl: './history-list.component.html',
  styleUrls: ['./history-list.component.scss'],
  standalone: true, 
  imports: [CommonModule, FormsModule] 
})
export class HistoryListComponent implements OnInit {
    
    historyItems: ArticleHistoryItem[] = []; 

    @Input() articleIdFilter: string = ''; 
    @Output() articleSelected = new EventEmitter<ArticleHistoryItem>(); 

    constructor(private historyService: HistoryService) {} 

    ngOnInit(): void {
        this.loadHistory(); 
    }
    
    // Called to reload history from storage
    public reloadHistory(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        this.historyItems = this.historyService.getHistory();
    }

    selectArticle(item: ArticleHistoryItem): void {
        this.articleSelected.emit(item);
    }


    getArticleLink(articleId: string) {
        return `https://yle.fi/a/${articleId}#comments`;
    }

}