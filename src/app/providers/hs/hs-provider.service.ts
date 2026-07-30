import { Injectable } from '@angular/core';
import { ProviderCapabilities, Provider } from '@app/models/provider';
import { HSCommentService } from './hs-comment.service';
import { HSAuthService } from './hs-auth.service';
import { HSArticlesService } from './hs-articles.service';

@Injectable({ providedIn: 'root' })
export class HSProvider implements Provider {
  readonly id = 'hs';
  readonly displayName = 'Helsingin Sanomat';

  readonly capabilities: ProviderCapabilities = {
    supportsAuth: false,
    supportsUserHistory: false,
    supportsArticleListing: true,
    supportsLiking: false,
    supportsReplying: false
  };

  constructor(
    public commentService: HSCommentService,
    public authService: HSAuthService,
    public articleService: HSArticlesService
  ) {}
}