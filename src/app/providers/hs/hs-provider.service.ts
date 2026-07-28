import { Injectable } from '@angular/core';
import { ProviderCapabilities, Provider } from '@app/models/provider';
import { HSCommentService } from './hs-comment.service';

@Injectable({ providedIn: 'root' })
export class HSProvider implements Provider {
  readonly id = 'hs';
  readonly displayName = 'Helsingin Sanomat';

  readonly capabilities: ProviderCapabilities = {
    supportsAuth: false,
    supportsUserHistory: false,
    supportsArticleListing: false,
    supportsLiking: false,
    supportsReplying: false
  };

  constructor(
    public commentService: HSCommentService
  ) {}
}