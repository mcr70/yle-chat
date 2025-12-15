
import { Routes } from '@angular/router';
import { CommentListComponent } from '@components/comment-list/comment-list.component'; 

export const routes: Routes = [
  { path: 'comments/:id', component: CommentListComponent },   
  { path: '', component: CommentListComponent }, 
  { path: '**', redirectTo: '', pathMatch: 'full' } 
];