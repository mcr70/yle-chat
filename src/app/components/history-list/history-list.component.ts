import { Component, Input, Output, EventEmitter, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { HistoryService, ArticleHistoryItem } from '@services/history.service'; 

@Component({
  selector: 'app-history-list',
  templateUrl: './history-list.component.html',
  styleUrls: ['./history-list.component.scss'],
  standalone: true, 
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, TranslatePipe] 
})
export class HistoryListComponent implements OnInit {
    
    historyItems = signal<ArticleHistoryItem[]>([]);
    displayLimit = signal<number>(10); // Limit for displayed history items

    @Input() articleIdFilter: string = ''; 
    @Output() articleSelected = new EventEmitter<ArticleHistoryItem>(); 

    constructor(
      private historyService: HistoryService
    ) {} 

    ngOnInit(): void {
        this.loadHistory(); 
    }

    // Called to reload history from storage
    public reloadHistory(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        const rawItems = this.historyService.getHistory();
        
        this.historyItems.set(rawItems.map(item => ({
            ...item,
            isEditing: false, 
            editableTitle: item.title || item.id 
        })));
    }

    selectArticle(item: ArticleHistoryItem): void {
        this.articleSelected.emit(item);
    }
}