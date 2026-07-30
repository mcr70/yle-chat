import { Routes, UrlMatchResult, UrlSegment } from '@angular/router';
import { CommentListComponent } from '@components/comment-list/comment-list.component'; 
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { ProviderSelectionComponent } from './components/provider-selection/provider-selection.component';

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
  // 1. select provider page (default route)
  { path: '', component: ProviderSelectionComponent, pathMatch: 'full' },

  // 2. Provider-specific comment listing routes
  { path: ':provider/comments/:id', component: CommentListComponent },
  { path: ':provider/comments', component: CommentListComponent },

  // 3. Fallback route for unknown paths under a known provider prefix
  {
    matcher: providerFallbackMatcher,
    redirectTo: ':provider/comments'
  },

  // 4. Authentication callback route
  { path: 'auth-callback', component: AuthCallbackComponent },

  // 5. Unknown routes redirect to the home page
  { path: '**', redirectTo: '', pathMatch: 'full' }
];