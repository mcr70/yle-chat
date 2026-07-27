/**
 * Service to manage article reading history using local storage.
 */
import { Injectable } from '@angular/core';

const HISTORY_ENABLED = false; // Set to false to disable history tracking
const HISTORY_STORAGE_KEY = 'articleHistory';
const HISTORY_MAX_ITEMS = 20;

export interface ArticleHistoryItem {
  id: string;
  title: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  
  constructor() {
    if (HISTORY_ENABLED) {
      if (!sessionStorage.getItem(HISTORY_STORAGE_KEY)) {
        sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify([]));
      }
    }
  }

  /**
   * Get stored article history.
   */
  getHistory(): ArticleHistoryItem[] {
    const json = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    return json ? (JSON.parse(json) as ArticleHistoryItem[]) : [];
  }

  /**
   * Add or update an article in the history.
   */
  addOrUpdateArticle(id: string, title: string): void {
    if (!HISTORY_ENABLED) return;

    if (!id || !title) return;

    let history = this.getHistory();

    history = history.filter(item => item.id !== id); // Remove existing entry if any
    
    const newItem: ArticleHistoryItem = {
      id: id,
      title: title,
      timestamp: Date.now()
    };

    history.unshift(newItem); // Add to the front

    if (history.length > HISTORY_MAX_ITEMS) {
      history = history.slice(0, HISTORY_MAX_ITEMS); // Keep only the latest MAX_ITEMS
    }

    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }


  /**
   * Clears history items matching the given article IDs.
   * @param ids Article IDs to remove from history.
   */
  clear(ids: string[]): void {
    if (!HISTORY_ENABLED) return;

    if (!ids || ids.length === 0) {
      return;
    }

    let history = this.getHistory();
    
    history = history.filter(item => !ids.includes(item.id));
    
    sessionStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  }
}