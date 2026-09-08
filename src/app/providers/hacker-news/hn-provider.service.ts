import { Injectable, inject } from '@angular/core';
import { Provider, ProviderCapabilities } from '@app/models/provider';
import { HNArticleService } from './hn-article.service';
import { HNCommentService } from './hn-comment.service';
import { HNAuthService } from './hn-auth.service';
import { HNMyHistoryService } from './hn-my-hostory.service';

@Injectable({
  providedIn: 'root'
})
export class HNProvider implements Provider {
  readonly id = 'hn';
  readonly displayName = 'Hacker News';

  readonly capabilities: ProviderCapabilities = {
    supportsAuth: true,
    supportsUserHistory: true,
    supportsArticleListing: true,
    supportsLiking: false,
    supportsReplying: true
  };

  articleService = inject(HNArticleService);
  commentService = inject(HNCommentService);
  authService = inject(HNAuthService);
  myHistoryService = inject(HNMyHistoryService);
}