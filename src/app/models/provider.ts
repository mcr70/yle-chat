import { Injectable } from '@angular/core';

import { CommentService } from './comment-service.interface';
import { AuthService } from './auth-service.interface';
import { ArticleService } from './article-service.interface';
import { MyHistoryService } from './my-history-service.interface';

import { YleProvider } from '@providers/yle/yle-provider.service';
import { HSProvider } from '@providers/hs/hs-provider.service';
import { HNProvider } from '@providers/hacker-news/hn-provider.service'
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


@Injectable({
  providedIn: 'root'
})
export class ProviderManager {
  private providers = new Map<string, Provider>();

  constructor(
    private yleProvider: YleProvider,
    private hsProvider: HSProvider,
    private hnProvider: HNProvider
  ) {
    this.providers.set(this.yleProvider.id, this.yleProvider);
    this.providers.set(this.hsProvider.id, this.hsProvider);
    this.providers.set(this.hnProvider.id, this.hnProvider);
  }

  /**
   * Returns the appropriate provider based on the providerId.
   */
  getProvider(providerId: string): Provider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider '${providerId}' not supported.`);
    }
    return provider;
  }

}