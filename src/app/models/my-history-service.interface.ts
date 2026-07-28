import { Observable } from "rxjs";

export interface GroupedDiscussion {
  articleId: string;
  articleTitle: string;
  lastCommentTimestamp: number;
  commentCount: number;
}


export interface MyHistoryService {
  fetchMyDiscussions(): Observable<GroupedDiscussion[]>;
}
