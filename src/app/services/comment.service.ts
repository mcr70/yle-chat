import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Määritellään datan tyypit (käytännössä vain ne kentät, joita tarvitaan)
// comment.service.ts

export interface Comment {
  id: string;
  author: string;
  content: string;
  likes: number;
  createdAt: string;
  // HUOM: Tämä saattaa sisältää litteitä lapsia API:sta, tai olla tyhjä
  children: Comment[]; 
  parentId: string | null; 
  topCommentId: string; // Tämä on tärkeä, apitunniste kaikille säikeen kommenteille
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
  getComments_old(): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.apiUrl);
  }


getComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.apiUrl).pipe(
      map(data => this.buildCommentTree(data))
    );
  }

  /**
   * Apufunktio: Kerää rekursiivisesti kaikki kommentit yhteen litteään listaan.
   */
  private flattenComments(comments: Comment[]): Comment[] {
    const flatList: Comment[] = [];

    comments.forEach(comment => {
      // Lisää nykyinen kommentti
      flatList.push(comment);
      
      // Jos kommentilla on lapsia, litistä ne ja lisää listaan
      if (comment.children && comment.children.length > 0) {
        flatList.push(...this.flattenComments(comment.children));
      }
      // TÄRKEÄÄ: Tyhjennetään lapset alkuperäisestä objektista, 
      // jotta hierarkia voidaan rakentaa puhtaasti parentId:n mukaan.
      comment.children = []; 
    });

    return flatList;
  }

  /**
   * Rakentaa litteästä listasta puumaisen hierarkian parentId:n perusteella.
   * Tämä on sama peruslogiikka kuin aiemmin, mutta toimii nyt varmasti litteällä listalla.
   */
  private buildCommentTree(apiData: Comment[]): Comment[] {
    // 1. Litistä koko API:sta saatu data
    const allComments = this.flattenComments(apiData);
    
    const commentMap = new Map<string, Comment>();
    const tree: Comment[] = [];

    // 2. Tallenna kaikki kommentit mappiin ID:n mukaan
    allComments.forEach(comment => {
      commentMap.set(comment.id, comment);
    });

    // 3. Järjestä kommentit hierarkiaan
    allComments.forEach(comment => {
      const parentId = comment.parentId;

      if (parentId) {
        // Kyseessä on vastaus (lapsi)
        const parent = commentMap.get(parentId);
        
        if (parent) {
          // Siirrä lapsi oikean vanhemman children-taulukkoon
          parent.children.push(comment);
        } else {
          // Vanhempaa ei löydy (esim. se ei ollut mukana tässä haussa),
          // mutta meidän tapauksessamme tämä ei pitäisi tapahtua, 
          // koska latasimme kaikki kommentit.
          tree.push(comment); 
        }
      } else {
        // Ylätason kommentti (parentId on null)
        tree.push(comment);
      }
    });

    return tree;
  }
}