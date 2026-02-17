import { Observable } from 'rxjs';


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

export interface CommentProvider {
  /**
   * Gets comments for a specific article with pagination.
   * 
   * @param topicId article identifier
   * @param offset starting offset Can be a number or a string token depending on implementation
   * @param limit  number of comments to fetch
   * @returns 
   */
  getComments(topicId: string, offset: number | string, limit: number): Observable<Comment[]>;

  /**
   * Gets topic (article) details, like title and whether it has been locked or not.
   * 
   * @param articleId 
   * @returns 
   */
  getTopicDetails(topicId: string): Observable<TopicDetails>;

  /**
   * Likes a comment
   * 
   * @param topicId
   * @param commentId 
   */
  likeComment(topicId: string, commentId: string): Observable<any>;

  /**
   * Unlikes a comment
   * 
   * @param topicId
   * @param commentId 
   */
  unlikeComment(topicId: string, commentId: string): Observable<any>;

  /**
   * Posts a reply to a comment
   * 
   * @param topicId 
   * @param content 
   * @param parentId 
   * @returns 
   */
  postComment(topicId: string, content: string, parentId?: string): Observable<any>;

  /**
   * Marks comments that match the given nickname.
   * 
   * @param comments 
   * @param nickname 
   */
  markNickname(comments: Comment[], nickname: string | null): void;
}
