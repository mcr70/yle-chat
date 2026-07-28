import { Injectable } from "@angular/core";
import { ProviderCapabilities } from "@app/models/provider";
import { Provider } from "@app/models/provider";
import { YleCommentService } from "./yle-comment.service";
import { YleAuthService } from "./yle-auth.service";
import { YleHistoryService } from "./yle-my-history.service";
import { YleArticlesService } from "./yle-articles.service";

@Injectable({ providedIn: 'root' })
export class YleProvider implements Provider {
  readonly id = 'yle';
  readonly displayName = 'Yle kommentointi';

  readonly capabilities: ProviderCapabilities = {
    supportsAuth: true,
    supportsUserHistory: true,
    supportsArticleListing: true,
    supportsLiking: true,
    supportsReplying: true
  };

  constructor(
    public commentService: YleCommentService,
    public authService: YleAuthService,
    public myHistoryService: YleHistoryService,
    public articleService: YleArticlesService
  ) {}
}