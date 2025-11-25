# Project Plan: Social Network Platform

## Overview

A modern social networking platform with user profiles, posts, comments, likes, friendships, activity feeds, and real-time updates. Includes WebSocket-powered live notifications, media uploads, and chronological timeline. Built with TDD principles and optimized for real-time performance.

**Complexity**: Intermediate
**Target Users**: Social platforms, community apps, networking tools

## Technical Stack

- **Backend**: Django 5.2 + Django REST Framework + PostgreSQL + Channels (WebSockets)
- **Frontend**: Vue 3 (Composition API) + TypeScript + Shadcn-vue + Tailwind CSS
- **Real-time**: Django Channels + Redis (Pub/Sub)
- **Infrastructure**: Docker + Redis + Celery
- **Storage**: Local media files (extendable to S3/CloudFlare R2)
- **Caching**: Redis (feeds, profiles)

## Phases

### Phase 1: Backend Foundation - Profiles & Posts (Sessions 1-4)
**Goal**: Build core social features with profiles and posts

#### Session 1: Profile Models + Admin (TDD)
- Create `social` Django app
- Implement Profile model (one-to-one with User)
- Auto-create profile on user creation (signal)
- Profile fields: bio, avatar, cover_photo, location, website
- Follower/following count methods
- Register in Django admin
- Write comprehensive model tests
- **Estimated Time**: 2.5 hours
- **Tests**: ~60 tests

#### Session 2: Post & Media Models (TDD)
- Post model (content, image, video, visibility)
- Video thumbnail auto-generation (Celery task)
- Post visibility logic (public, friends, private)
- Like and Comment models
- Post statistics methods (like_count, comment_count)
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 3: Profile & Post API (TDD)
- ProfileSerializer with stats
- PostSerializer with nested author profile
- Profile viewsets (get, update)
- Post viewsets (list, create, retrieve, update, delete)
- Media upload handling
- **Estimated Time**: 3.5 hours
- **Tests**: ~90 tests

#### Session 4: Likes & Comments API (TDD)
- LikeSerializer, CommentSerializer
- Like/unlike post endpoints
- Comment CRUD with nested replies
- Reaction types (like, love, haha, wow, sad, angry)
- **Estimated Time**: 3 hours
- **Tests**: ~70 tests

**Phase 1 Total**: 12 hours, ~300 tests

---

### Phase 2: Backend - Friendships & Feed (Sessions 5-7)
**Goal**: Implement friendship system and activity feed

#### Session 5: Friendship System (TDD)
- Friendship model (from_user, to_user, status)
- Bidirectional friendship on accept
- Friend request send/accept/reject
- Block user functionality
- Are friends check (class method)
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 6: Friendship API + Permissions (TDD)
- FriendshipSerializer
- List friends, friend requests endpoints
- Send/accept/reject/block endpoints
- Unfriend endpoint
- IsFriend permission class
- **Estimated Time**: 2.5 hours
- **Tests**: ~70 tests

#### Session 7: Activity Feed Generation (TDD)
- Timeline feed (friends' posts, chronological)
- Public feed (all public posts)
- Feed filtering by visibility + friendships
- Query optimization (select_related, prefetch_related)
- Redis caching for feeds (2-minute TTL)
- **Estimated Time**: 3.5 hours
- **Tests**: ~80 tests

**Phase 2 Total**: 9 hours, ~230 tests

---

### Phase 3: Backend - Notifications & Real-time (Sessions 8-9)
**Goal**: Implement notifications and WebSocket support

#### Session 8: Notification System (TDD)
- Notification model (recipient, sender, type, post, comment)
- Notification generation on like/comment/friend request
- Celery tasks for async notification creation
- Mark as read, mark all as read endpoints
- Unread count aggregation
- **Estimated Time**: 3 hours
- **Tests**: ~70 tests

#### Session 9: WebSocket Integration (Django Channels + TDD)
- Install Django Channels + Redis backend
- WebSocket consumer for feed updates (`/ws/feed/`)
- WebSocket consumer for notifications (`/ws/notifications/`)
- Broadcast new post event to followers' feeds
- Broadcast notification event to recipient
- Authentication middleware for WebSockets
- **Estimated Time**: 4 hours
- **Tests**: ~60 tests

**Phase 3 Total**: 7 hours, ~130 tests

---

### Phase 4: Frontend Foundation (Sessions 10-11)
**Goal**: Build type-safe frontend with core components

#### Session 10: API Client + Composables (Code Generation + TDD)
- Generate TypeScript SDK from OpenAPI schema
- Create Zod validation schemas (post, comment, profile)
- Set up React Query for data fetching
- `usePost`, `useFeed` composables
- WebSocket hook (`useWebSocket`)
- **Estimated Time**: 2 hours
- **Tests**: ~40 tests

#### Session 11: Profile Components (TDD)
- ProfileHeader (avatar, cover, username, bio)
- ProfileStats (posts, followers, following)
- ProfileActions (edit, follow/unfollow)
- EditProfileModal (bio, avatar, cover upload)
- FollowButton component
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 4 Total**: 5 hours, ~100 tests

---

### Phase 5: Frontend - Feed & Posts (Sessions 12-14)
**Goal**: Build feed and post creation UI

#### Session 12: Post Components (TDD)
- PostCard (header, content, image/video, actions)
- PostActions (like, comment, share buttons)
- LikeButton with reaction picker (like, love, etc.)
- CommentButton (toggles comment section)
- VideoPlayer component
- **Estimated Time**: 3.5 hours
- **Tests**: ~70 tests

#### Session 13: Create Post UI (TDD)
- CreatePostForm component
- PostContentInput (textarea with char count)
- MediaUploader (image/video with preview)
- VisibilitySelector (public, friends, private)
- Form validation (at least one of content/image/video)
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

#### Session 14: Feed View + Real-time Updates (TDD)
- FeedView page
- Feed filters (timeline/public toggle)
- PostList with infinite scroll
- WebSocket integration for live updates
- Toast notification on new post
- **Estimated Time**: 3.5 hours
- **Tests**: ~70 tests

**Phase 5 Total**: 10 hours, ~200 tests

---

### Phase 6: Frontend - Comments & Interactions (Session 15)
**Goal**: Build comment system and interactions

#### Session 15: Comments UI (TDD)
- `useComments` composable
- CommentList component (nested structure)
- CommentItem component (avatar, text, timestamp)
- CommentForm (reply to post or comment)
- Nested replies (max 2 levels)
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 6 Total**: 3 hours, ~60 tests

---

### Phase 7: Frontend - Friendships & Notifications (Sessions 16-17)
**Goal**: Friendship management and real-time notifications

#### Session 16: Friends UI (TDD)
- `useFriendship` composable
- FriendsView with tabs (Friends, Requests, Suggestions)
- FriendCard (avatar, username, mutual friends)
- FriendRequestCard (accept, reject buttons)
- Unfriend confirmation dialog
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

#### Session 17: Notifications UI + Real-time (TDD)
- `useNotifications` composable
- NotificationsView page
- NotificationList component
- NotificationItem (avatar, text, timestamp, mark read)
- WebSocket integration for live notifications
- Toast on new notification
- Unread badge count
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 7 Total**: 6 hours, ~120 tests

---

### Phase 8: Integration & Polish (Session 18)
**Goal**: End-to-end testing, optimization, deployment prep

#### Session 18: E2E Testing + Performance (TDD)
- E2E workflow: Create post → Like → Comment → Notification
- E2E workflow: Send friend request → Accept → See in feed
- E2E workflow: Real-time feed update verification
- WebSocket connection testing
- Image/video upload verification
- Feed caching hit/miss analysis
- Type checking (0 TypeScript errors)
- Final coverage report (>85% target)
- Documentation updates
- **Estimated Time**: 3.5 hours
- **Tests**: ~50 E2E tests

**Phase 8 Total**: 3.5 hours, ~50 tests

---

## Summary

**Total Sessions**: 18
**Total Estimated Time**: 55.5 hours
**Total Test Count**: ~1160 tests
**Backend Coverage Target**: 90%
**Frontend Coverage Target**: 85%

## Data Models Summary

| Model        | Fields | Relationships                | Indexes |
|--------------|--------|------------------------------|---------|
| Profile      | 10     | User (1-to-1)                | 1 |
| Post         | 12     | User, Comment, Like          | 5 |
| Comment      | 7      | Post, User, self (nested)    | 4 |
| Like         | 5      | Post, User                   | 4 |
| Friendship   | 6      | User ↔ User (bidirectional)  | 4 |
| Notification | 9      | User (recipient/sender), Post, Comment | 5 |

## API Endpoints Summary

| Resource      | Endpoints | Methods                       | Permissions |
|---------------|-----------|-------------------------------|-------------|
| Profiles      | 2         | GET, PATCH                    | Public, Owner |
| Posts         | 5         | GET, POST, PATCH, DELETE      | Public (based on visibility), Author |
| Likes         | 2         | POST, DELETE                  | Authenticated |
| Comments      | 4         | GET, POST, PATCH, DELETE      | Public, Author |
| Friendships   | 6         | GET, POST, DELETE             | Authenticated, Participant |
| Notifications | 3         | GET, POST (mark read, mark all) | Owner |
| WebSockets    | 2         | WS (feed, notifications)      | Authenticated |

**Total Endpoints**: 24

## Frontend Components Summary

| Component Type | Count | Testing Priority |
|----------------|-------|------------------|
| Views          | 5     | High             |
| Components     | 20    | High             |
| Composables    | 7     | High             |

**Total Components**: 32

## Success Criteria

- ✅ All tests pass (>85% coverage)
- ✅ Type-safe (0 TypeScript `any`, 0 type errors)
- ✅ OpenAPI schema accurate
- ✅ WebSocket connections working (feed + notifications)
- ✅ Real-time updates verified (new post appears without refresh)
- ✅ Real-time notifications working (toast + badge count)
- ✅ Media uploads working (images + videos)
- ✅ Video thumbnail generation working
- ✅ Feed caching working (Redis hit rate >70%)
- ✅ Friendship bidirectional creation on accept
- ✅ Visibility permissions working (public, friends, private)
- ✅ Create post → like → comment → notification workflow E2E
- ✅ Docker deployment working

## Testing Strategy

### Backend (pytest + coverage)
- **Models**: Field validation, relationships, visibility logic, bidirectional friendships
- **Serializers**: Validation rules, nested serialization
- **ViewSets**: CRUD operations, feed filtering, permissions
- **Permissions**: Visibility checks (public, friends, private), friendship requirements
- **WebSockets**: Connection, authentication, event broadcasting
- **Celery**: Notification generation, video thumbnail creation

**Target**: 90% coverage

### Frontend (Vitest + Vue Test Utils)
- **Components**: Rendering, props, events, WebSocket integration
- **Composables**: Data fetching, mutations, real-time updates
- **Views**: Full page rendering, infinite scroll, live notifications
- **Schemas**: Zod validation (post, comment, profile)

**Target**: 85% coverage

### E2E (Playwright - recommended)
- Complete social flow: Create post → Like → Comment → Notification
- Friendship flow: Send request → Accept → See friend's posts in feed
- Real-time: Open two browsers → Create post in one → See in other instantly
- Media upload: Image → Video → Verify display

**Target**: Critical paths covered

## Performance Targets

- **Feed load**: < 2 seconds
- **Feed API**: < 300ms (with caching)
- **Post creation**: < 1 second
- **Like/unlike**: < 200ms
- **WebSocket latency**: < 100ms (local), < 500ms (production)
- **Notification delivery**: < 1 second (real-time)
- **Image upload**: < 3 seconds (10MB)
- **Video upload**: < 10 seconds (100MB)

## Security Checklist

- ✅ Private profiles only visible to friends
- ✅ Friends-only posts require friendship check
- ✅ Only author can edit/delete posts/comments
- ✅ Blocked users cannot send friend requests
- ✅ WebSocket authentication enforced
- ✅ Media uploads validated (file type, size)
- ✅ CSRF protection enabled
- ✅ SQL injection prevention (ORM)
- ✅ Rate limiting on post/like/comment/friend request
- ✅ XSS prevention (sanitize post content)

## Optional Enhancements (Post-MVP)

- [ ] Direct messaging (1-on-1 chat)
- [ ] Groups/communities (create/join groups, group posts)
- [ ] Stories (24-hour ephemeral content)
- [ ] Hashtags (trending topics)
- [ ] Mentions (@username tagging)
- [ ] Share/repost functionality
- [ ] Bookmarks (save posts for later)
- [ ] Block/mute users
- [ ] Report/moderation system
- [ ] Post analytics (reach, impressions)
- [ ] Verified badges
- [ ] Live video streaming (WebRTC)
- [ ] Emoji reactions (beyond like/love/etc.)
- [ ] GIF support (GIPHY integration)
- [ ] Polls (create polls in posts)
- [ ] Link previews (Open Graph)

## Media Handling

**Images**:
- Max size: 10MB
- Formats: jpg, png, webp
- Optimization: Generate thumbnails (small, medium, large)
- Storage: Local (dev) → S3/CloudFlare R2 (production)

**Videos**:
- Max size: 100MB
- Formats: mp4, mov, avi
- Processing: Generate thumbnail (first frame)
- Encoding: Consider transcoding for web (H.264) via Celery
- Streaming: Use CDN for video delivery

## Real-Time Architecture

**WebSocket Scaling**:
- Use Redis Pub/Sub for multi-server WebSocket fanout
- Limit 1-2 WebSocket connections per user
- Batch events (deliver notifications every 5 seconds, not instantly)
- Graceful fallback to polling if WebSocket fails

**Event Types**:
- `new_post` → Broadcast to all followers' feed WebSocket
- `new_like` → Broadcast to post author's notification WebSocket
- `new_comment` → Broadcast to post author's notification WebSocket
- `friend_request` → Broadcast to recipient's notification WebSocket
- `friend_accept` → Broadcast to requester's notification WebSocket

## Timeline

**Week 1**: Backend Foundation - Profiles & Posts (Phase 1)
**Week 2**: Backend - Friendships & Feed (Phase 2)
**Week 3**: Backend - Notifications & Real-time (Phase 3)
**Week 4**: Frontend Foundation + Feed (Phase 4-5)
**Week 5**: Frontend - Comments & Interactions (Phase 6)
**Week 6**: Frontend - Friendships & Notifications (Phase 7)
**Week 7**: Integration & Polish (Phase 8)

**Total Duration**: 7 weeks (part-time) or 3 weeks (full-time)

---

**Ready to start building?** Ensure Redis is running for WebSocket support and caching.
