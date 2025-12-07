
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TitleFetchService {

  constructor(private http: HttpClient) {}

  private readonly PROXY_PREFIX = '';//'/yle-news';
  private readonly TITLE_REGEX = /<title>(.*?)<\/title>/i;

  fetchTitle(articleId: string): Observable<string> {
    if (!articleId) {
      return of("Otsikko puuttuu");
    }
    
    const url = `${this.PROXY_PREFIX}/a/${articleId}`;

    // get the HTML content and extract the title
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(htmlText => {
        const match = htmlText.match(this.TITLE_REGEX);
        
        if (match && match[1]) {
          return match[1].replace(/ - Yle.*$/, '').trim(); 
        }
        return `Otsikko ID:lle ${articleId} puuttuu`;
      }),
      catchError(() => of(`Otsikko ID:lle ${articleId} (virhe)`))
    );
  }
}