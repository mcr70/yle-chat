import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionStateService {
  private readonly STORAGE_KEY_PREFIX = 'app_selected_article_';

  // Get saved article ID for a specific provider
  getSelectedArticleId(providerId: string): string | null {
    try {
      return sessionStorage.getItem(`${this.STORAGE_KEY_PREFIX}${providerId}`);
    } catch (e) {
      console.warn('Failed to read from sessionStorage:', e);
      return null;
    }
  }

  // Save selected article ID for a specific provider
  setSelectedArticleId(providerId: string, articleId: string): void {
    if (!articleId) return;
    try {
      sessionStorage.setItem(`${this.STORAGE_KEY_PREFIX}${providerId}`, articleId);
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
    }
  }
}