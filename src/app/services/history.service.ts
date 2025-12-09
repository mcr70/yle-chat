/**
 * Service to manage article reading history using local storage.
 */
import { Injectable } from '@angular/core';

export interface ArticleHistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  
  private readonly STORAGE_KEY = 'articleHistory';
  private readonly MAX_ITEMS = 20; 

  constructor() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }
  }

  /**
   * Get stored article history.
   */
  getHistory(): ArticleHistoryItem[] {
    const json = localStorage.getItem(this.STORAGE_KEY);
    return json ? (JSON.parse(json) as ArticleHistoryItem[]) : [];
  }

  /**
   * Add or update an article in the history.
   */
  addOrUpdateArticle(id: string, title: string): void {
    //console.log(`addOrUpdateArticle(${id}, ${title})`)

    if (!id || !title) return;

    let history = this.getHistory();

    history = history.filter(item => item.id !== id); // Remove existing entry if any
    
    const newItem: ArticleHistoryItem = {
      id: id,
      title: title,
      timestamp: Date.now()
    };

    history.unshift(newItem); // Add to the front

    if (history.length > this.MAX_ITEMS) {
      history = history.slice(0, this.MAX_ITEMS); // Keep only the latest MAX_ITEMS
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }


  /**
   * Clears history items matching the given article IDs.
   * @param ids Article IDs to remove from history.
   */
  clear(ids: string[]): void {
    if (!ids || ids.length === 0) {
      return;
    }

    let history = this.getHistory();
    
    history = history.filter(item => !ids.includes(item.id));
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  }
}