import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { CommentListComponent } from '@components/comment-list/comment-list.component'; 

/**
 * Matcher for handling unknown routes under a known provider prefix.
 * Matches paths like /:provider/anything-else and captures the provider.
 */
export function providerFallbackMatcher(url: UrlSegment[]): UrlMatchResult | null {
  if (url.length >= 1) {
    const provider = url[0].path;
    // Do not match if it's already /:provider/comments
    if (url.length === 1 || (url.length >= 2 && url[1].path !== 'comments')) {
      return {
        consumed: url,
        posParams: { provider: new UrlSegment(provider, {}) }
      };
    }
  }
  return null;
}

export const routes: Routes = [
  // Default redirect to Yle provider
  { path: '', redirectTo: 'yle/comments', pathMatch: 'full' },

  // Dynamic provider routes
  { path: ':provider/comments/:id', component: CommentListComponent },
  { path: ':provider/comments', component: CommentListComponent },

  // Dynamic fallback for any unknown path starting with :provider (e.g. /hs/foo -> /hs/comments)
  {
    matcher: providerFallbackMatcher,
    redirectTo: ':provider/comments'
  },

  // Global fallback
  { path: '**', redirectTo: 'yle/comments', pathMatch: 'full' }
];