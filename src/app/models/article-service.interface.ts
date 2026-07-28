import { Observable } from "rxjs";

export interface ArticleListItem {
  id: string;
  title: string;
  commentCount: number;
  isActive: boolean;
  published: Date | null;
  category?: string;
}

export interface ArticleService {
  getArticles(): Observable<ArticleListItem[]>;
}