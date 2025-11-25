# Social Network Template

Production-ready social networking platform template with posts, friendships, feeds, and real-time features.

## What's Included

**Core Features**:
- ✅ User profiles with bio, avatar
- ✅ Posts with text, images, videos
- ✅ Like/reaction system
- ✅ Comments on posts
- ✅ Friend/follow system
- ✅ Activity feed (timeline)
- ✅ Notifications (likes, comments, follows)

**Technical Features**:
- ✅ Real-time feed updates (WebSockets)
- ✅ Activity stream generation
- ✅ Feed pagination (infinite scroll)
- ✅ Image/video uploads
- ✅ Push notifications (Celery + FCM)
- ✅ Redis caching for feeds

## Customization Options

### 1. Direct Messaging?
**Default**: No

- **No**: Public posts only
- **Yes**: 1-on-1 chat with message history
- **Impact**: +3 sessions, +80 tests, +8 hours

### 2. Groups/Communities?
**Default**: No

- **No**: Personal timeline only
- **Yes**: Create/join groups, group posts
- **Impact**: +4 sessions, +90 tests, +10 hours

### 3. Media Sharing?
**Default**: Photos only

- **Photos only**: Image uploads in posts
- **Photos + Videos**: Video uploads, video player
- **Photos + Videos + Stories**: 24-hour ephemeral stories
- **Impact**:
  - Photos + Videos: +1 session, +20 tests, +2.5 hours
  - Stories: +3 sessions, +60 tests, +7 hours

## Complexity Variants

### Basic (Minimal Social Network)
**Config**: No DMs, No groups, Photos only
- **Sessions**: 13
- **Time**: 38 hours
- **Tests**: ~700

### Intermediate (Recommended - Default)
**Config**: No DMs, No groups, Photos + Videos
- **Sessions**: 14
- **Time**: 40.5 hours
- **Tests**: ~720

### Advanced (Full Social Platform)
**Config**: Yes DMs, Yes groups, Photos + Videos + Stories
- **Sessions**: 21
- **Time**: 65 hours
- **Tests**: ~950

## Models Summary

| Model | Description | Key Relationships |
|-------|-------------|------------------|
| Profile | User profile | User (1-to-1) |
| Post | User posts | User, Comments, Likes |
| Comment | Post comments | Post, User |
| Like | Post likes | Post, User |
| Friendship | Friend connections | User ↔ User |
| Notification | Activity alerts | User, Post, Comment |
| Message | DMs (if enabled) | Sender, Recipient |
| Group | Communities (if enabled) | Members, Posts |

## Mobile Support

### Recommended Mobile Features (Selective)

**Include** (ALL features work great on mobile):
- ✅ Browse feed
- ✅ Create posts (with camera)
- ✅ Like/comment
- ✅ View profiles
- ✅ Friend requests
- ✅ Notifications

**Mobile-Specific**:
- ✅ Push notifications (likes, comments, friend requests)
- ✅ Camera integration (take photo → post)
- ✅ Offline feed (cache recent posts)
- ✅ Stories (if enabled - mobile-first feature)
- ✅ Swipe gestures (like Instagram/TikTok)

**Note**: Social networks are often mobile-first. Consider **Full parity** or **Mobile-first** strategy.

## Real-Time Features

**Included**:
- Live feed updates (new posts appear without refresh)
- Live notifications (toast on new activity)
- Live like counts (update immediately)

**Optional** (post-template):
- Live typing indicators (DMs)
- Live online/offline status
- Live comment threads

## Feed Algorithm

**Default**: Chronological (most recent first)

**Optional Enhancements** (post-template):
- Engagement-based (likes, comments)
- Friend proximity (mutual friends)
- Content relevance (interests, tags)
- ML-based recommendations

## Getting Started

1. Run `/plan-app` in Claude Code
2. Select "Social Network" template
3. Answer customization questions
4. Review generated plans
5. Start building!

## Required External Services

- **Redis** (for real-time features, caching)
- **Celery** (for async notifications)
- **Email Service** (for email notifications)
- **File Storage** (S3, CloudFlare R2 for media)
- **FCM/APNS** (for push notifications)

## Post-Template Enhancements

1. **Stories**: 24-hour ephemeral content
2. **Live video**: Streaming with WebRTC
3. **Hashtags**: Trending topics
4. **Mentions**: @username tagging
5. **Share/Repost**: Amplify content
6. **Bookmarks**: Save posts for later
7. **Block/Mute**: User controls
8. **Report/Moderation**: Content flags
9. **Analytics**: Post insights, reach
10. **Verified badges**: User verification

## Support

See: `.claude/PLANNING_GUIDE.md`
