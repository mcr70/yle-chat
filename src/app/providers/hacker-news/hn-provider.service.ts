import { Injectable, inject } from '@angular/core';
import { Provider, ProviderCapabilities } from '@app/models/provider';
import { HNArticleService } from './hn-article.service';
import { HNCommentService } from './hn-comment.service';

@Injectable({
  providedIn: 'root'
})
export class HNProvider implements Provider {
  readonly id = 'hn';
  readonly displayName = 'Hacker News';

  readonly capabilities: ProviderCapabilities = {
    supportsAuth: false,
    supportsUserHistory: false,
    supportsArticleListing: true,
    supportsLiking: false,
    supportsReplying: false
  };

  articleService = inject(HNArticleService);
  commentService = inject(HNCommentService);
}