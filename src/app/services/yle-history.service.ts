/**
 * https://datacloud.api.yle.fi/v2/tv/history?limit=20&exclude_sub_accounts=true&fetch_comments=true
 *   - GET
 *   - Cookie: -b 'ylelogin=1b0b4764b6cce6b85265597dcd64f9cde89d30bb9476a7582af86c69919d9c87'
 * 
 */

interface YleHistoryItem {
  collectorreceived: number;
  content_type: string;
  yle_id: string;
  type: string;
  application?: string; // 'comments' kommenteille
  comment?: {
    id: string;
    content: string;
    title: string;
    url: string;
  };
}

export interface MyDiscussion {
  id: string;
  title: string;
  url: string;
  commentContent: string;
}


export interface GroupedDiscussion {
  articleId: string; // Yle Artikkeli ID (esim. 74-20197403)
  title: string;
  url: string;
  comments: { content: string, date?: Date }[]; // Lista kaikista käyttäjän kommenteista
  latestCommentContent: string; // Viimeisin kommentti snippetiksi
}


import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class YleHistoryService {
  private readonly PROXY_PREFIX = '/yle-history';
  private readonly API_URL = '/v2/tv/history?limit=20&exclude_sub_accounts=true&fetch_comments=true';

  constructor(private http: HttpClient) { }

  /**
   * Hakee käyttäjän Yle-historian ja suodattaa siitä kommentoidut artikkelit.
   * Palauttaa tyhjän taulukon, jos käyttäjä ei ole kirjautunut tai eväste on vanhentunut (HTTP 401/403).
   */
  fetchMyDiscussions(): Observable<GroupedDiscussion[]> {
    console.log('YleHistoryService: Hakee käyttäjän keskusteluhistorian.');
    
    return this.http.get<YleHistoryItem[]>(this.PROXY_PREFIX + this.API_URL, {
      withCredentials: true 
    }).pipe(
      // 1. Suodata vain kommentit ja poista tyhjät
      map(items => items.filter(item => item.application === 'comments' && item.comment && item.comment.url)),      
      // Muunna GroupedDiscussion-tyyppiseksi
      map(commentItems => {
        
        const groupedDiscussionsMap = new Map<string, GroupedDiscussion>();
        
        commentItems.forEach(item => {
          const articleId = this.parseArticleIdFromUrl(item.comment!.url);
          const commentContent = item.comment!.content;
          
          if (!articleId) return; // Ohita, jos ID:tä ei saatu parsittua

          if (groupedDiscussionsMap.has(articleId)) {
            // Jos artikkeli on jo listalla, lisää vain uusi kommentti
            const existing = groupedDiscussionsMap.get(articleId)!;
            existing.comments.push({ content: commentContent });
            existing.latestCommentContent = commentContent; // Päivitä tuorein kommentti
            
          } else {
            // Luo uusi ryhmä
            groupedDiscussionsMap.set(articleId, {
              articleId: articleId,
              title: item.comment!.title,
              url: item.comment!.url,
              latestCommentContent: commentContent,
              comments: [{ content: commentContent }]
            });
          }
        });

        // Muunna Map takaisin arrayksi
        return Array.from(groupedDiscussionsMap.values());
      }),      
      // Käsittele virhe, jos käyttäjä ei ole kirjautunut (401 tai 403)
      catchError(error => {
        console.error('HistoryService: Virhe historiatiedon hakemisessa.', error);        
        if (error.status === 401 || error.status === 403) {
          console.warn('HistoryService: Käyttäjä ei ole kirjautunut. Palautetaan tyhjä lista.');
          return of([]); // Palautetaan tyhjä lista
        }
        // Muut virheet heitetään eteenpäin
        return throwError(() => new Error('Virhe historiatiedon hakemisessa.'));
      })
    );
  }

  private parseArticleIdFromUrl(url: string): string {
    // Käytetään säännöllistä lauseketta etsimään /a/ jälkeen tuleva ID-muoto.
    // (\d+-\d+) etsii muotoa numero-numero
    const match = url.match(/\/a\/(\d+-\d+)$/);
    if (match && match[1]) {
      return match[1];
    }
    // Jos parsinta epäonnistuu, palautetaan turvallisesti tyhjä merkkijono
    return ''; 
  }  
}