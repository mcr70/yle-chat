/**
 * Service for fetching and processing comments from Yle Comments API.
 * 
 * API Example Call with curl:
 *   curl "https://comments.api.yle.fi/v2/topics/74-20194923/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc&limit=10&offset=0"
 * 
 * Restrictions
 *   - "Order must be one the following created_at:desc, created_at:asc, relevance:desc"
 *   - "Limit must be between 1 and 20"
 */

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
  isExpanded?: boolean;

  hasNickname?: boolean; // Lisätty kenttä tarkistamaan onko nimimerkki asetettu
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {

  private apiBaseUrl =       '/v2/topics/74-20195254/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc';
  private apiBaseTemplate = '/v2/topics/{articleId}/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc';

  private apiPathAndParams = '/v2/topics/74-20195254/comments/accepted?app_id=yle-comments-plugin&app_key=sfYZJtStqjcANSKMpSN5VIaIUwwcBB6D&order=relevance:desc&limit=10&offset=0';
  private apiUrl = `/yle-api${this.apiPathAndParams}`;

  constructor(private http: HttpClient) { }



  /**
   * Hakee kommentit API:sta dynaamisilla sivutusparametreilla.
   * @param offset Aloituskohta (esim. 0, 10, 20)
   * @param limit Ladattavien kommenttien maksimimäärä
   * @returns Observable-virran Comment[] -tyyppisestä datasta.
   */
  getComments(articleId: string, offset: number, limit: number): Observable<Comment[]> {
    console.log(`Fetching comments for articleId=${articleId}, offset=${offset}, limit=${limit}`);  
    // Varmistus
    if (!articleId || articleId.trim().length === 0) {
        return new Observable(observer => observer.next([])).pipe(map(() => []));
    }

    // ⭐ Rakenna URL korvaamalla {articleId} dynaamisesti
    const baseUrl = this.apiBaseTemplate.replace('{articleId}', articleId);
    
    // Rakennetaan lopullinen URL
    const apiUrl = `/yle-api${baseUrl}&limit=${limit}&offset=${offset}`;

    return this.http.get<Comment[]>(apiUrl).pipe(
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


  /**
   * Marks comments that match the given nickname.
   * 
   * @param comments 
   * @param nickname 
   * @returns 
   */
  markNickname(comments: Comment[], nickname: string | null): void {
    // tyhjennä kaikki vanhat merkinnät
    this.clearNicknameFlags(comments);

    if (!nickname || nickname.trim().length === 0) {
      return;
    }

    this.markRecursive(comments, nickname.trim());
  }


  private clearNicknameFlags(nodes: Comment[]): void {
    for (const node of nodes) {
      node.hasNickname = false;
      if (node.children?.length) {
        this.clearNicknameFlags(node.children);
      }
    }
  }

  private markRecursive(nodes: Comment[], nickname: string): boolean {
    let foundInSubTree = false;

    // Varmistus: Älä suorita vertailua, jos nimimerkki on tyhjä
    const lowercasedNickname = nickname ? nickname.toLowerCase() : '';

    for (const node of nodes) {
        
        // 1. Tarkista osuma itsessä
        //const ownMatch = node.author.toLowerCase() === lowercasedNickname;

        const ownMatch = node.author
            && node.author.toLowerCase().startsWith(lowercasedNickname);

        // 2. Tarkista rekursiivisesti lapset
        const childMatch = node.children?.length
            ? this.markRecursive(node.children, nickname)
            : false;
            
        // 3. Aseta merkki: Lippu nousee ylös, jos osuma löytyy itsestä TAI lapsista
        node.hasNickname = ownMatch || childMatch;

        // 4. Päivitä nykyisen haun lippu
        if (node.hasNickname) {
            // Jos yksikin solmu merkitään tällä tasolla, koko alipuu on merkkauksessa.
            foundInSubTree = true; 
        }
    }

    // Palauttaa true, jos lapsissa oli osuma, joka merkkasi myös vanhemman.
    return foundInSubTree; 
  }
}