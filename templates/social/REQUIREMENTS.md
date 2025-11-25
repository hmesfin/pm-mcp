# Social Network - Technical Requirements

**Generated from**: Social Network Template
**Complexity**: Intermediate
**Features**: Profiles, Posts, Comments, Likes, Friendships, Feed, Notifications, Real-time Updates

---

## Data Models

### Profile Model

**File**: `backend/apps/social/models/profile.py`

**Fields**:

- `id` (AutoField, primary key)
- `user` (OneToOneField to User, on_delete=CASCADE, related_name='profile')
- `bio` (TextField, max_length=500, optional)
- `avatar` (ImageField, upload_to='profiles/avatars/', optional)
- `cover_photo` (ImageField, upload_to='profiles/covers/', optional)
- `location` (CharField, max_length=100, optional)
- `website` (URLField, optional)
- `date_of_birth` (DateField, null=True, blank=True)
- `is_private` (BooleanField, default=False) - Private account
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- User: One-to-One with User

**Indexes**:

- `user` (unique)

**Validation**:

- Bio: Max 500 chars
- Avatar: Max 5MB, formats: jpg, png, webp
- Cover photo: Max 10MB, formats: jpg, png, webp
- Website: Valid URL format

**Custom Methods**:

- `get_follower_count()`: Count of users following this profile
- `get_following_count()`: Count of users this profile follows
- `get_post_count()`: Count of posts by this user
- `is_followed_by(user)`: Check if user follows this profile

---

### Post Model

**File**: `backend/apps/social/models/post.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `author` (ForeignKey to User, on_delete=CASCADE, related_name='posts')
- `content` (TextField, max_length=5000, optional) - Text content
- `image` (ImageField, upload_to='posts/images/', optional)
- `video` (FileField, upload_to='posts/videos/', optional)
- `video_thumbnail` (ImageField, upload_to='posts/thumbnails/', optional) - Auto-generated
- `visibility` (CharField, choices=['public', 'friends', 'private'], default='public')
- `is_edited` (BooleanField, default=False)
- `edited_at` (DateTimeField, null=True, blank=True)
- `created_at` (DateTimeField, auto_now_add=True, indexed)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Author: Many-to-One with User
- Comments: One-to-Many with Comment
- Likes: One-to-Many with Like

**Indexes**:

- `uuid` (unique)
- `author` (for user's posts)
- `created_at` (for chronological feed)
- Composite: `['author', 'created_at']` (for user timeline)

**Validation**:

- Content OR image OR video required (at least one)
- Content: Max 5000 chars if provided
- Image: Max 10MB, formats: jpg, png, webp
- Video: Max 100MB, formats: mp4, mov, avi
- Visibility: Must be one of ['public', 'friends', 'private']

**Custom Methods**:

- `get_like_count()`: Count of likes
- `get_comment_count()`: Count of comments
- `is_liked_by(user)`: Check if user liked this post
- `mark_edited()`: Set is_edited=True, edited_at=now()
- `can_view(user)`: Check if user can view this post based on visibility + friendship

---

### Comment Model

**File**: `backend/apps/social/models/comment.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `post` (ForeignKey to Post, on_delete=CASCADE, related_name='comments')
- `author` (ForeignKey to User, on_delete=CASCADE, related_name='comments')
- `content` (TextField, max_length=1000, required)
- `parent` (ForeignKey to self, null=True, blank=True, related_name='replies') - For nested replies
- `created_at` (DateTimeField, auto_now_add=True, indexed)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Post: Many-to-One with Post
- Author: Many-to-One with User
- Parent: Self-referential for nested comments

**Indexes**:

- `uuid` (unique)
- `post` (for post's comments)
- `author` (for user's comments)
- `created_at` (for sorting)

**Validation**:

- Content: Required, min 1 char, max 1000 chars
- Parent: If set, must belong to same post

**Custom Methods**:

- `get_reply_count()`: Count of replies to this comment

---

### Like Model

**File**: `backend/apps/social/models/like.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `post` (ForeignKey to Post, on_delete=CASCADE, related_name='likes')
- `user` (ForeignKey to User, on_delete=CASCADE, related_name='likes')
- `reaction_type` (CharField, choices=['like', 'love', 'haha', 'wow', 'sad', 'angry'], default='like') - FB-style reactions
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Post: Many-to-One with Post
- User: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `post` (for post's likes)
- `user` (for user's likes)
- Composite: `['post', 'user']` (unique together - one like per user per post)

**Validation**:

- Reaction type: Must be one of ['like', 'love', 'haha', 'wow', 'sad', 'angry']
- User cannot like their own post (optional business rule)

---

### Friendship Model

**File**: `backend/apps/social/models/friendship.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `from_user` (ForeignKey to User, on_delete=CASCADE, related_name='friendships_sent')
- `to_user` (ForeignKey to User, on_delete=CASCADE, related_name='friendships_received')
- `status` (CharField, choices=['pending', 'accepted', 'rejected', 'blocked'], default='pending')
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- From user: Many-to-One with User (requester)
- To user: Many-to-One with User (receiver)

**Indexes**:

- `uuid` (unique)
- `from_user` (for user's sent requests)
- `to_user` (for user's received requests)
- Composite: `['from_user', 'to_user']` (unique together)

**Validation**:

- from_user != to_user (cannot friend yourself)
- Status: Must be one of ['pending', 'accepted', 'rejected', 'blocked']

**Custom Methods**:

- `accept()`: Set status='accepted', create reverse friendship
- `reject()`: Set status='rejected'
- `block()`: Set status='blocked'
- `are_friends(user1, user2)`: Class method to check if two users are friends

**Note**: When a friendship is accepted, create TWO records:
- `Friendship(from_user=A, to_user=B, status='accepted')`
- `Friendship(from_user=B, to_user=A, status='accepted')`

This allows efficient bidirectional queries.

---

### Notification Model

**File**: `backend/apps/social/models/notification.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `recipient` (ForeignKey to User, on_delete=CASCADE, related_name='notifications')
- `sender` (ForeignKey to User, on_delete=CASCADE, null=True, related_name='sent_notifications')
- `notification_type` (CharField, choices=['like', 'comment', 'friend_request', 'friend_accept', 'mention'], required)
- `post` (ForeignKey to Post, on_delete=CASCADE, null=True, blank=True, related_name='notifications')
- `comment` (ForeignKey to Comment, on_delete=CASCADE, null=True, blank=True, related_name='notifications')
- `is_read` (BooleanField, default=False)
- `created_at` (DateTimeField, auto_now_add=True, indexed)

**Relationships**:

- Recipient: Many-to-One with User (who receives the notification)
- Sender: Many-to-One with User (who triggered the notification)
- Post: Many-to-One with Post (optional, for like/comment notifications)
- Comment: Many-to-One with Comment (optional, for comment notifications)

**Indexes**:

- `uuid` (unique)
- `recipient` (for user's notifications)
- `is_read` (for filtering unread)
- `created_at` (for sorting)
- Composite: `['recipient', 'is_read']` (for unread notifications query)

**Validation**:

- Notification type: Must be one of ['like', 'comment', 'friend_request', 'friend_accept', 'mention']
- Recipient: Required
- Sender: Required (except for system notifications)

**Custom Methods**:

- `mark_as_read()`: Set is_read=True
- `get_notification_text()`: Generate human-readable text (e.g., "John liked your post")

---

## API Endpoints

### Profiles Endpoints

**Base URL**: `/api/social/`

#### Profiles

- **GET** `/api/social/profiles/{username}/` - Get user profile
  - Permissions: AllowAny (public profiles) or IsFriend (private profiles)
  - Response: Profile with follower/following counts, recent posts

- **PATCH** `/api/social/profiles/me/` - Update current user's profile
  - Permissions: IsAuthenticated (owner only)
  - Request body: `{ bio?, avatar?, cover_photo?, location?, website?, is_private? }`
  - Response: 200 OK

### Posts Endpoints

#### List/Create Posts

- **GET** `/api/social/posts/` - List posts (feed)
  - Permissions: IsAuthenticated
  - Query params: `?feed_type=timeline` (friends' posts), `?feed_type=public` (all public posts)
  - Response: Paginated list (20 per page), ordered by created_at DESC

- **POST** `/api/social/posts/` - Create new post
  - Permissions: IsAuthenticated
  - Request body: `{ content?, image?, video?, visibility }`
  - Response: 201 Created

#### Retrieve/Update/Delete Post

- **GET** `/api/social/posts/{uuid}/` - Get post details
  - Permissions: AllowAny (if public), IsFriend (if friends-only), IsAuthor (if private)
  - Response: Full post with comments, like count

- **PATCH** `/api/social/posts/{uuid}/` - Update post
  - Permissions: IsAuthor
  - Request body: `{ content?, visibility? }` (cannot change media)
  - Response: 200 OK

- **DELETE** `/api/social/posts/{uuid}/` - Delete post
  - Permissions: IsAuthor
  - Response: 204 No Content

### Likes Endpoints

- **POST** `/api/social/posts/{post_uuid}/like/` - Like a post
  - Permissions: IsAuthenticated
  - Request body: `{ reaction_type? }` (default: 'like')
  - Response: 201 Created

- **DELETE** `/api/social/posts/{post_uuid}/unlike/` - Unlike a post
  - Permissions: IsAuthenticated
  - Response: 204 No Content

### Comments Endpoints

- **GET** `/api/social/posts/{post_uuid}/comments/` - List post comments
  - Permissions: AllowAny (if post is public)
  - Response: Paginated list (50 per page), nested structure

- **POST** `/api/social/posts/{post_uuid}/comments/` - Create comment
  - Permissions: IsAuthenticated
  - Request body: `{ content, parent_id? }`
  - Response: 201 Created

- **PATCH** `/api/social/comments/{uuid}/` - Update comment
  - Permissions: IsAuthor
  - Request body: `{ content }`
  - Response: 200 OK

- **DELETE** `/api/social/comments/{uuid}/` - Delete comment
  - Permissions: IsAuthor
  - Response: 204 No Content

### Friendships Endpoints

- **GET** `/api/social/friends/` - List user's friends
  - Permissions: IsAuthenticated
  - Response: List of accepted friendships

- **GET** `/api/social/friend-requests/` - List pending friend requests
  - Permissions: IsAuthenticated
  - Response: List of pending requests (received)

- **POST** `/api/social/friend-requests/send/` - Send friend request
  - Permissions: IsAuthenticated
  - Request body: `{ to_user_id }`
  - Response: 201 Created

- **POST** `/api/social/friend-requests/{uuid}/accept/` - Accept friend request
  - Permissions: IsRecipient
  - Response: 200 OK

- **POST** `/api/social/friend-requests/{uuid}/reject/` - Reject friend request
  - Permissions: IsRecipient
  - Response: 200 OK

- **DELETE** `/api/social/friendships/{uuid}/` - Unfriend
  - Permissions: IsParticipant
  - Response: 204 No Content

### Notifications Endpoints

- **GET** `/api/social/notifications/` - List user's notifications
  - Permissions: IsAuthenticated (own notifications only)
  - Query params: `?is_read=false` (unread only)
  - Response: Paginated list (50 per page), ordered by created_at DESC

- **POST** `/api/social/notifications/{uuid}/mark-read/` - Mark notification as read
  - Permissions: IsRecipient
  - Response: 200 OK

- **POST** `/api/social/notifications/mark-all-read/` - Mark all as read
  - Permissions: IsAuthenticated
  - Response: 200 OK

### Real-time Endpoints (WebSockets)

- **WS** `/ws/feed/` - Real-time feed updates
  - Permissions: IsAuthenticated
  - Events: `new_post`, `new_like`, `new_comment`

- **WS** `/ws/notifications/` - Real-time notifications
  - Permissions: IsAuthenticated
  - Events: `new_notification`

---

## Frontend Components

### Component Hierarchy

```
FeedView
├── CreatePostForm (text input, image/video upload, visibility selector)
├── FeedFilters (timeline/public toggle)
├── PostList (infinite scroll)
│   └── PostCard
│       ├── PostHeader (avatar, username, timestamp)
│       ├── PostContent (text, image, video player)
│       ├── PostActions (like, comment, share)
│       ├── LikeButton (with reaction picker)
│       ├── CommentButton
│       └── CommentList (expandable)
│           └── CommentItem (nested replies)

ProfileView
├── ProfileHeader (avatar, cover photo, username, bio)
├── ProfileStats (posts, followers, following)
├── ProfileActions (edit profile, follow/unfollow, message)
├── ProfileTabs (Posts, Photos, Videos)
└── PostGrid (user's posts)

NotificationsView
├── NotificationFilters (all/unread)
├── NotificationList
│   └── NotificationItem (avatar, text, timestamp, mark read)
└── MarkAllReadButton

FriendsView
├── FriendTabs (Friends, Requests, Suggestions)
├── FriendList
│   └── FriendCard (avatar, username, mutual friends, actions)
├── FriendRequestList
│   └── FriendRequestCard (accept, reject)
└── FriendSuggestList
    └── SuggestionCard (add friend)

CreatePostModal
├── PostContentInput (textarea with mention autocomplete)
├── MediaUploader (image/video with preview)
├── VisibilitySelector (public, friends, private)
└── PostButton
```

### Key Composables

**`usePost.ts`**:

```typescript
export const usePost = (uuid: string) => {
  const { data: post, isLoading } = useQuery({
    queryKey: ['post', uuid],
    queryFn: () => apiClient.social.postsRetrieve({ path: { uuid } })
  })

  const likePost = useMutation({
    mutationFn: (reactionType?: string) =>
      apiClient.social.postsLikeCreate({ path: { post_uuid: uuid }, body: { reaction_type: reactionType } }),
    onSuccess: () => queryClient.invalidateQueries(['post', uuid])
  })

  const unlikePost = useMutation({
    mutationFn: () => apiClient.social.postsUnlikeDestroy({ path: { post_uuid: uuid } }),
    onSuccess: () => queryClient.invalidateQueries(['post', uuid])
  })

  return { post, isLoading, likePost, unlikePost }
}
```

**`useFeed.ts`**:

```typescript
export const useFeed = (feedType: 'timeline' | 'public') => {
  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['feed', feedType],
    queryFn: ({ pageParam = 1 }) => apiClient.social.postsList({
      query: { feed_type: feedType, page: pageParam }
    }),
    getNextPageParam: (lastPage) => lastPage.next ? lastPage.page + 1 : undefined
  })

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket('/ws/feed/')

  useEffect(() => {
    if (lastMessage?.data) {
      const event = JSON.parse(lastMessage.data)
      if (event.type === 'new_post') {
        queryClient.invalidateQueries(['feed', feedType])
      }
    }
  }, [lastMessage])

  return { posts: data?.pages.flatMap(p => p.results), isLoading, fetchNextPage, hasNextPage }
}
```

**`useNotifications.ts`**:

```typescript
export const useNotifications = () => {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiClient.social.notificationsList()
  })

  const markAsRead = useMutation({
    mutationFn: (uuid: string) =>
      apiClient.social.notificationsMarkReadCreate({ path: { uuid } }),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  })

  const markAllAsRead = useMutation({
    mutationFn: () => apiClient.social.notificationsMarkAllReadCreate(),
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  })

  // WebSocket for real-time notifications
  const { lastMessage } = useWebSocket('/ws/notifications/')

  useEffect(() => {
    if (lastMessage?.data) {
      const event = JSON.parse(lastMessage.data)
      if (event.type === 'new_notification') {
        queryClient.invalidateQueries(['notifications'])
        // Show toast notification
      }
    }
  }, [lastMessage])

  return { notifications, markAsRead, markAllAsRead }
}
```

**`useFriendship.ts`**:

```typescript
export const useFriendship = () => {
  const sendRequest = useMutation({
    mutationFn: (toUserId: number) =>
      apiClient.social.friendRequestsSendCreate({ body: { to_user_id: toUserId } }),
    onSuccess: () => queryClient.invalidateQueries(['friends'])
  })

  const acceptRequest = useMutation({
    mutationFn: (uuid: string) =>
      apiClient.social.friendRequestsAcceptCreate({ path: { uuid } }),
    onSuccess: () => queryClient.invalidateQueries(['friends', 'friend-requests'])
  })

  const unfriend = useMutation({
    mutationFn: (uuid: string) =>
      apiClient.social.friendshipsDestroy({ path: { uuid } }),
    onSuccess: () => queryClient.invalidateQueries(['friends'])
  })

  return { sendRequest, acceptRequest, unfriend }
}
```

---

## Validation Rules

### Post Validation

**Backend** (`apps/social/serializers/post.py`):

```python
class PostSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        content = attrs.get('content')
        image = attrs.get('image')
        video = attrs.get('video')

        if not any([content, image, video]):
            raise ValidationError("Post must have content, image, or video")

        if content and len(content) > 5000:
            raise ValidationError("Content must be less than 5000 characters")

        return attrs
```

**Frontend Zod Schema** (`frontend/src/schemas/post.ts`):

```typescript
export const postSchema = z.object({
  content: z.string().max(5000).optional(),
  image: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 10 * 1024 * 1024,
    "Image must be less than 10MB"
  ),
  video: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 100 * 1024 * 1024,
    "Video must be less than 100MB"
  ),
  visibility: z.enum(['public', 'friends', 'private'])
}).refine(
  (data) => data.content || data.image || data.video,
  { message: "Post must have content, image, or video" }
)
```

---

## Test Coverage Requirements

### Backend Tests

**Models** (`apps/social/tests/test_models.py`):

- Profile creation, follower/following counts
- Post visibility logic (public, friends, private)
- Comment nesting
- Like uniqueness (one per user per post)
- Friendship bidirectional creation on accept
- Notification generation on like/comment/friend request

**Serializers** (`apps/social/tests/test_serializers.py`):

- Post validation (at least one of content/image/video)
- Comment validation
- Friendship self-request prevention

**ViewSets** (`apps/social/tests/test_viewsets.py`):

- Feed filtering (timeline vs public)
- Like/unlike post
- Friend request send/accept/reject
- Notification mark as read
- WebSocket events

**Permissions** (`apps/social/tests/test_permissions.py`):

- Private profiles only visible to friends
- Friends-only posts only visible to friends
- Only author can edit/delete posts

**Minimum Coverage**: 90%

### Frontend Tests

**Components** (`frontend/src/components/social/*.test.ts`):

- PostCard renders, like button works
- CreatePostForm validation
- CommentList nested rendering
- NotificationItem displays correctly

**Composables** (`frontend/src/composables/*.test.ts`):

- useFeed infinite scroll
- usePost like/unlike
- useNotifications WebSocket updates

**Views** (`frontend/src/views/social/*.test.ts`):

- FeedView real-time updates
- ProfileView displays stats

**Minimum Coverage**: 85%

---

## Performance Considerations

### Database Optimizations

- Use `select_related('author', 'author__profile')` for post queries
- Use `prefetch_related('comments', 'likes')` for detail views
- Index on `created_at` for chronological feed
- Composite index on `['author', 'created_at']` for user timeline

### Caching Strategy

- Cache user feed: 2 minutes (invalidate on new post)
- Cache profile: 5 minutes
- Cache friend list: 10 minutes
- Use Redis for WebSocket connection storage

### Real-time Scaling

- Use Redis Pub/Sub for WebSocket fanout
- Limit WebSocket connections per user (1-2)
- Batch notification delivery (every 5 seconds)

---

## Security Considerations

### Permissions

- Private profiles only visible to friends
- Friends-only posts require friendship check
- Only author can edit/delete posts/comments
- Block user to prevent friend requests

### Rate Limiting

- Post creation: 20 per hour per user
- Like: 100 per hour per user
- Comment: 50 per hour per user
- Friend request: 20 per hour per user

---

## Estimated Complexity

**Models**: 6 (Profile, Post, Comment, Like, Friendship, Notification)
**API Endpoints**: 24
**WebSocket Endpoints**: 2
**Frontend Components**: 25
**Estimated Sessions**: 14
**Estimated Time**: 40.5 hours
**Test Count**: ~720 tests
