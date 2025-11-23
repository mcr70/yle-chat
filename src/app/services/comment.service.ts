import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Määritellään datan tyypit (käytännössä vain ne kentät, joita tarvitaan)
export interface Comment {
  id: string;
  author: string;
  content: string;
  likes: number;
  createdAt: string; // Esim. "2025-11-23T04:52:18Z"
  children: Comment[]; // Kommentin vastaukset
  parentId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private apiPathAndParams = '/v2/topics/74-20195254/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc&limit=10&offset=0';
  private apiUrl = `/yle-api${this.apiPathAndParams}`;

  constructor(private http: HttpClient) { }

  /**
   * Hakee kommentit API:sta.
   * @returns Observable-virran Comment[] -tyyppisestä datasta.
   */
  getComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.apiUrl);
  }
}