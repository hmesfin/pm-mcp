# Blog Platform Template

Production-ready blog platform template with post authoring, commenting, categorization, and media uploads.

## What's Included

**Core Features**:
- ✅ Post creation with rich text editor
- ✅ Draft/publish workflow
- ✅ Categories and tags
- ✅ Nested comments (2 levels)
- ✅ Featured image uploads
- ✅ View count tracking
- ✅ Author profiles

**Technical Features**:
- ✅ Auto-slug generation
- ✅ Image thumbnail generation
- ✅ Redis caching
- ✅ Full-text search (PostgreSQL)
- ✅ Responsive design
- ✅ SEO-friendly URLs

## Customization Options

When using this template, you'll be asked:

### 1. Enable Comments?
**Default**: Yes

- **Yes**: Full commenting system with nested replies, moderation
- **No**: Removes Comment model, comment endpoints, CommentSection component
- **Impact**: -2 sessions, -60 tests, -4 hours

### 2. Enable Categories/Tags?
**Default**: Yes

- **Yes**: Full categorization with Category and Tag models
- **No**: Removes taxonomy, filtering by category/tag
- **Impact**: -1 session, -30 tests, -2 hours

### 3. Multi-Author Support?
**Default**: No

- **No**: Single author (simpler, faster to build)
- **Yes**: Multiple authors, author profiles, author filtering
- **Impact**: +2 sessions, +50 tests, +4 hours

### 4. Media Uploads?
**Default**: Yes (images only)

- **Images only**: Featured images with thumbnails
- **Images + Videos**: Adds video upload support, video player
- **No media**: Text-only blog (fastest)
- **Impact**:
  - Images + Videos: +1 session, +20 tests, +2 hours
  - No media: -1 session, -20 tests, -1.5 hours

## Complexity Variants

### Basic (Minimal)
**Config**: No comments, No categories/tags, Single author, No media
- **Sessions**: 6
- **Time**: 12 hours
- **Tests**: ~200

### Intermediate (Recommended - Default)
**Config**: Comments, Categories/tags, Single author, Images
- **Sessions**: 11
- **Time**: 30 hours
- **Tests**: ~600

### Advanced (Full-Featured)
**Config**: Comments, Categories/tags, Multi-author, Images + Videos
- **Sessions**: 14
- **Time**: 40 hours
- **Tests**: ~700

## Mobile Support

### Mobile Strategy Options

1. **Web only** - No mobile app
2. **Full parity** - All web features in mobile
3. **Selective features** - Choose which features for mobile (recommended)
4. **Mobile-first** - Mobile is primary platform

### Recommended Mobile Features (Selective)

**Include**:
- ✅ Browse/read posts
- ✅ View comments
- ✅ Create comments (if authenticated)
- ✅ Search posts
- ✅ Filter by category/tag

**Exclude**:
- ❌ Create/edit posts (use web for authoring)
- ❌ Upload images (use web for media management)
- ❌ Category/tag management (use web for admin)

**Mobile-Specific**:
- ✅ Push notifications (new comments on your posts)
- ✅ Offline reading (cache recent posts)
- ✅ Share posts (native share sheet)

## File Structure

After generation, you'll have:

```
backend/apps/blog/
├── models/
│   ├── post.py
│   ├── comment.py (if comments enabled)
│   ├── category.py (if categories/tags enabled)
│   └── tag.py (if categories/tags enabled)
├── serializers/
│   ├── post.py
│   ├── comment.py (if enabled)
│   ├── category.py (if enabled)
│   └── tag.py (if enabled)
├── viewsets/
│   ├── post.py
│   ├── comment.py (if enabled)
│   ├── category.py (if enabled)
│   └── tag.py (if enabled)
├── permissions.py
├── admin.py
└── tests/
    ├── test_models.py
    ├── test_serializers.py
    ├── test_viewsets.py
    └── test_permissions.py

frontend/src/modules/blog/
├── components/
│   ├── PostCard.vue
│   ├── PostGrid.vue
│   ├── PostFilters.vue
│   ├── PostForm.vue
│   ├── CommentForm.vue (if comments enabled)
│   ├── CommentList.vue (if comments enabled)
│   └── CategoryBadge.vue (if categories enabled)
├── composables/
│   ├── usePost.ts
│   ├── usePosts.ts
│   ├── useComments.ts (if comments enabled)
│   └── useCategories.ts (if categories enabled)
├── views/
│   ├── PostListView.vue
│   ├── PostDetailView.vue
│   ├── CreatePostView.vue (if authenticated)
│   └── MyPostsView.vue (if authenticated)
├── types/
│   └── blog.ts
└── routes.ts
```

## Example Customizations

### Example 1: Simple Personal Blog
**Use Case**: Personal writing, minimal features

**Config**:
- Comments: No
- Categories/Tags: No
- Multi-Author: No
- Media: Images only

**Result**: 6 sessions, 12 hours, lightweight and fast

---

### Example 2: Team Blog
**Use Case**: Multiple writers, organized content

**Config**:
- Comments: Yes
- Categories/Tags: Yes
- Multi-Author: Yes
- Media: Images + Videos

**Result**: 14 sessions, 40 hours, full-featured platform

---

### Example 3: Publication with Mobile App
**Use Case**: Large audience, mobile reading experience

**Config**:
- Comments: Yes
- Categories/Tags: Yes
- Multi-Author: Yes
- Media: Images only
- Mobile: Selective features (read-only + comments)

**Result**: 14 web sessions + 6 mobile sessions, 50 hours total

## Post-Template Customization

After generating the template, you can manually:

1. **Add social features**: Likes, bookmarks, sharing
2. **Add notifications**: Email on new comments
3. **Add analytics**: Track popular posts, reading time
4. **Add SEO**: Meta tags, Open Graph, sitemaps
5. **Add monetization**: Paywalls, memberships
6. **Add moderation**: Spam detection, content flags
7. **Add rich media**: Embeds (YouTube, Twitter, etc.)

## Getting Started

1. Run `/plan-app` in Claude Code
2. Select "Blog Platform" template
3. Answer customization questions
4. Review generated `REQUIREMENTS.md` and `PROJECT_PLAN.md`
5. Approve and start Session 1!

## Support

See the main planning guide: `.claude/PLANNING_GUIDE.md`
