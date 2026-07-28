import { Observable } from "rxjs";

export interface TopicDetails {
  title: string;
  articleLink? : string;
  isLocked: boolean;
  acceptedCommentsCount: number;
  externalId: string;
}

export interface Comment {
  parentId: string | null; 
  id: string;
  author: string;
  content: string;
  likes: number;
  createdAt: string;
  replies: Comment[];

  isExpanded?: boolean; // For UI purposes
  isCollapsed?: boolean; // For UI purposes
  
  topCommentId: string; 
  isLiked: boolean

  hasNickname?: boolean; // Marks if comment matches nickname filter
}

export interface CommentService {
  getComments(topicId: string, offset: number | string, limit: number): Observable<Comment[]>;
  getTopicDetails(topicId: string): Observable<TopicDetails>;
  markNickname(comments: Comment[], nickname: string | null): void;

  likeComment?(topicId: string, commentId: string): Observable<any>;
  unlikeComment?(topicId: string, commentId: string): Observable<any>;
  postComment?(topicId: string, content: string, parentId?: string): Observable<any>;
}
