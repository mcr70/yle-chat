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

// src/app/services/history.service.ts

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
  fetchMyDiscussions(): Observable<MyDiscussion[]> {
    console.log('YleHistoryService: Hakee käyttäjän keskusteluhistorian.');
    return this.http.get<YleHistoryItem[]>(this.PROXY_PREFIX + this.API_URL, {
      // TÄRKEÄÄ: Selaimen täytyy lähettää automaattisesti 'ylelogin'-eväste mukana.
      withCredentials: true 
    }).pipe(
      // Suodata vain kommentit
      //delay(3000), // Pysäyttää datan 3 sekunniksi
      map(items => items.filter(item => item.application === 'comments' && item.comment)),
      
      // Muunna MyDiscussion-tyyppiseksi
      map(commentItems => commentItems.map(item => ({
        id: this.parseArticleIdFromUrl(item.comment!.url), //item.comment!.id,
        title: item.comment!.title,
        url: item.comment!.url,
        commentContent: item.comment!.content
      }))),
      
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