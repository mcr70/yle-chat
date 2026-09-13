import { TestBed } from '@angular/core/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { PendingReplyService, PendingReply } from './pending-reply.service';

describe('PendingReplyService', () => {
  let service: PendingReplyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PendingReplyService]
    });
    service = TestBed.inject(PendingReplyService);
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  // Verifies service creation
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Tests adding and retrieving pending replies for an article
  it('should add pending reply and retrieve it by article ID', () => {
    const reply: PendingReply = {
      parentId: null,
      replyId: 'reply-1',
      content: 'This is a test comment',
      articleId: 'article-100'
    };

    service.addPendingReply(reply);
    const result = service.getPendingRepliesForArticle('article-100');

    expect(result.length).toBe(1);
    expect(result[0]).toEqual(reply);
  });

  // Tests that duplicates with the same replyId are not added
  it('should not add duplicate replies with the same replyId', () => {
    const reply: PendingReply = {
      parentId: null,
      replyId: 'reply-duplicate',
      content: 'Duplicate comment',
      articleId: 'article-100'
    };

    service.addPendingReply(reply);
    service.addPendingReply(reply);
    const result = service.getPendingRepliesForArticle('article-100');

    expect(result.length).toBe(1);
  });

  // Tests filtering replies by articleId
  it('should only return pending replies matching the specified articleId', () => {
    service.addPendingReply({
      parentId: null,
      replyId: 'reply-a',
      content: 'Comment A',
      articleId: 'article-1'
    });
    service.addPendingReply({
      parentId: null,
      replyId: 'reply-b',
      content: 'Comment B',
      articleId: 'article-2'
    });

    const article1Replies = service.getPendingRepliesForArticle('article-1');
    const article2Replies = service.getPendingRepliesForArticle('article-2');

    expect(article1Replies.length).toBe(1);
    expect(article1Replies[0].replyId).toBe('reply-a');
    expect(article2Replies.length).toBe(1);
    expect(article2Replies[0].replyId).toBe('reply-b');
  });

  // Tests removing pending replies by reply ID
  it('should remove pending reply by replyId', () => {
    service.addPendingReply({
      parentId: null,
      replyId: 'reply-to-remove',
      content: 'Will be removed',
      articleId: 'article-1'
    });

    service.removePendingReply('reply-to-remove');
    const result = service.getPendingRepliesForArticle('article-1');

    expect(result.length).toBe(0);
  });

  // Tests cleanup of expired pending replies (older than 12 hours)
  it('should filter out expired items older than 12 hours', () => {
    const expiredTimestamp = Date.now() - (13 * 60 * 60 * 1000);
    const expiredItem = {
      parentId: null,
      replyId: 'expired-1',
      content: 'Old comment',
      articleId: 'article-1',
      timestamp: expiredTimestamp
    };

    sessionStorage.setItem('pending_replies', JSON.stringify([expiredItem]));

    const result = service.getPendingRepliesForArticle('article-1');
    expect(result.length).toBe(0);
  });
});
