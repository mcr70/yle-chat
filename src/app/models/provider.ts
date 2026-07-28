import { CommentService } from './comment-service.interface';
import { AuthService } from './auth-service.interface';
import { ArticleService } from './article-service.interface';
import { MyHistoryService } from './my-history-service.interface';

export interface ProviderCapabilities {
  supportsAuth: boolean;
  supportsUserHistory: boolean;
  supportsArticleListing: boolean;
  supportsLiking: boolean;
  supportsReplying: boolean;
}

export interface Provider {
  id: string;
  displayName: string;
  capabilities: ProviderCapabilities;

  commentService: CommentService;
  authService?: AuthService;
  myHistoryService?: MyHistoryService;
  articleService?: ArticleService;
}

import { Injectable } from '@angular/core';
import { YleProvider } from '@services/yle-provider.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderManager {

  constructor(
    private yleProvider: YleProvider,
  ) {}

  /**
   * Returns the appropriate provider based on the providerId.
   */
  getProvider(providerId: string): Provider {
    // currently only Yle is supported
    return this.yleProvider;
  }

}