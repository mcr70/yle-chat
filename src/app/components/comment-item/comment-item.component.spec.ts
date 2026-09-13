import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CommentItemComponent } from './comment-item.component';
import { Provider } from '@app/models/provider';
import { Comment, CommentService } from '@app/models/comment-service.interface';

describe('CommentItemComponent', () => {
  let component: CommentItemComponent;
  let fixture: ComponentFixture<CommentItemComponent>;

  const mockComment: Comment = {
    id: 'c1',
    parentId: null,
    topCommentId: 'c1',
    author: 'Tester',
    content: 'Hello world',
    createdAt: '2026-03-01T12:00:00Z',
    likes: 2,
    isLiked: false,
    replies: []
  };

  const mockCommentService: CommentService = {
    getComments: () => of([]),
    getTopicDetails: () => of({
      title: 'Topic',
      isLocked: false,
      acceptedCommentsCount: 1,
      externalId: 'art-1'
    }),
    markNickname: () => {},
    likeComment: () => of({ success: true }),
    unlikeComment: () => of({ success: true })
  };

  const mockProvider: Provider = {
    id: 'yle',
    displayName: 'Yle',
    capabilities: {
      supportsAuth: true,
      supportsUserHistory: true,
      supportsArticleListing: true,
      supportsLiking: true,
      supportsReplying: true
    },
    commentService: mockCommentService
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentItemComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideTranslateService()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CommentItemComponent);
    component = fixture.componentInstance;
    component.provider = mockProvider;
    component.comment = { ...mockComment };
    component.articleId = 'art-1';
    component.isLoggedIn.set(true);
    fixture.detectChanges();
  });

  // Verifies component creation
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Tests liking a comment updates isLiked and likes count
  it('should like comment when toggleLike is called on unliked comment', () => {
    component.comment.isLiked = false;
    component.comment.likes = 2;

    component.toggleLike();

    expect(component.comment.isLiked).toBe(true);
    expect(component.comment.likes).toBe(3);
  });

  // Tests unliking a comment decrements likes count
  it('should unlike comment when toggleLike is called on liked comment', () => {
    component.comment.isLiked = true;
    component.comment.likes = 3;

    component.toggleLike();

    expect(component.comment.isLiked).toBe(false);
    expect(component.comment.likes).toBe(2);
  });

  // Tests that toggleLike does not like if user is not logged in
  it('should not like comment if user is not logged in', () => {
    component.isLoggedIn.set(false);
    component.comment.isLiked = false;
    component.comment.likes = 2;

    component.toggleLike();

    expect(component.comment.isLiked).toBe(false);
    expect(component.comment.likes).toBe(2);
  });
});
