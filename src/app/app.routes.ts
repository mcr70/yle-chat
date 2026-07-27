import { Routes } from '@angular/router';
import { CommentListComponent } from '@components/comment-list/comment-list.component'; 

export const routes: Routes = [
  // Default redirect to Yle provider
  { path: '', redirectTo: 'yle/comments', pathMatch: 'full' },

  // Dynamic provider routes
  { path: ':provider/comments/:id', component: CommentListComponent },
  { path: ':provider/comments', component: CommentListComponent },

  // Fallback
  { path: '**', redirectTo: 'yle/comments', pathMatch: 'full' } 
];