import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ArticleListItem, ArticleService } from "@app/models/article-service.interface";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class YleArticlesService implements ArticleService {
  private readonly API_URL = '/v1/layout-fragment/ylefi-front-page?app_id=ukko&app_key=weTyEj7RwTjAzbVr73uSypbcSALJ4xDk';

  constructor(private http: HttpClient) { }

  getArticles(): Observable<ArticleListItem[]>{
    const payload = {
      count: 100,
      excludeContentIds: []
    };

    return this.http.post<any>(this.API_URL, payload).pipe(
      map(response => {
        if (!response || !response.items) return [];
        
        return response.items
          .map((item: any) => ({
            id: item.content?.contentId,
            title: item.data?.headline?.full,
            commentCount: item.data?.topic?.acceptedCommentsCount || 0,
            isActive: item.data?.topic?.isLocked !== undefined ? !item.data.topic.isLocked : false,
            // Convert to Date object for sorting and template pipes
            published: item.data?.datePublished ? new Date(item.data.datePublished) : null,
            category: item.data?.subjects?.[0]?.title?.fi || ''
          }))
          // Filter out articles that have 0 comments and are not active
          .filter((article: any) => !(article.commentCount === 0 && !article.isActive))
          // Sort by publication time: newest first
          .sort((a: any, b: any) => {
            const timeA = a.published ? a.published.getTime() : 0;
            const timeB = b.published ? b.published.getTime() : 0;
            return timeB - timeA;
          });
      })
    );
  }
}