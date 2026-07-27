import { Injectable } from '@angular/core';
import { CommentProvider } from '@app/models/comment-provider.interface';
import { YleCommentService } from '@services/yle-comment.service';

@Injectable({
  providedIn: 'root'
})
export class CommentServiceManager {

  constructor(
    private yleService: YleCommentService,
  ) {}

  /**
   * Returns the appropriate comment provider based on the providerId.
   */
  getProvider(providerId: string): CommentProvider {
    // currently only Yle is supported
    return this.yleService;
  }

}