# Quick Start: Automated Plan Execution

This guide shows you how to use the agent execution system to automatically build your application from a plan, with TDD enforcement and human-in-the-loop checkpoints.

## Prerequisites

1. **Plan created**: You must have a project plan (via `/plan-app`)
2. **Git repository**: Your project must be a git repo (for commits)
3. **Docker running**: Backend/frontend containers must be available

## 5-Minute Walkthrough

### Step 1: Create a Plan (if you haven't already)

```bash
# Interactive planning (recommended)
/plan-app

# Select template: blog
# Answer customization questions
# Creates: project-plans/my-blog/PROJECT_PLAN.md
#          project-plans/my-blog/REQUIREMENTS.md
```

### Step 2: Initialize Execution State

```bash
/initialize-project my-blog blog
```

**Output**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ PROJECT INITIALIZED: my-blog
│
│ App Type: blog
│ Total Phases: 4
│ Total Sessions: 11
│ Estimated Time: 30 hours
│ Estimated Tests: ~600 tests
└─────────────────────────────────────────────────────────────┘

PHASE BREAKDOWN:

Phase 1: Backend Foundation (4 sessions, 10.5h)
  Session 1: Models + Admin (2.5h)
  Session 2: Serializers + ViewSets (3h)
  Session 3: Permissions + Business Logic (2.5h)
  Session 4: Media Uploads + Optimization (2.5h)

Phase 2: Frontend Foundation (4 sessions, 10h)
  ...

NEXT STEPS:

1. Review the plan:
   cat project-plans/my-blog/PROJECT_PLAN.md

2. Start execution:
   /execute-session my-blog 1

STATE FILE: project-plans/my-blog/.agent-state.json
```

### Step 3: Execute Session 1 (Models + Admin)

```bash
/execute-session my-blog 1
```

**What happens**:

#### Checkpoint 1: BEFORE_START

```
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT: BEFORE START                                    │
│ Session 1: Models + Admin                                   │
└─────────────────────────────────────────────────────────────┘

I will now:
1. Create Django app 'blog'
2. Write comprehensive tests for Post, Comment, Category, Tag models
3. Tests will FAIL initially (that's expected!)

Estimated time: ~45 minutes (RED phase)

What would you like to do?

1. ✅ Start Session (proceed with RED phase)
2. ⏭️  Skip Session
3. ⏸️  Pause
```

**You type**: `1` (Start Session)

#### RED Phase Execution

```
🔴 RED PHASE - Writing tests...

[Agent launches backend-builder]
[Agent reads REQUIREMENTS.md]
[Agent writes comprehensive tests]
[Agent runs tests - they all FAIL]

✓ RED phase complete
```

#### Checkpoint 2: AFTER_RED

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ RED PHASE COMPLETE                                        │
│                                                              │
│ Tests written: 72                                            │
│ Tests failing: 72 (expected!)                                │
│                                                              │
│ Files created:                                               │
│   - backend/apps/blog/__init__.py                            │
│   - backend/apps/blog/tests/test_models.py                   │
│   - backend/apps/blog/tests/conftest.py                      │
│                                                              │
│ Sample tests:                                                │
│   - test_create_post_with_valid_data                         │
│   - test_post_title_required                                 │
│   - test_post_slug_auto_generated                            │
│   - test_post_status_choices                                 │
│   - test_comment_nesting                                     │
└─────────────────────────────────────────────────────────────┘

All tests are FAILING (as expected in RED phase!)

What would you like to do?

1. ✅ Proceed to GREEN phase (implement models)
2. 🔄 Revise tests (I want to modify them first)
3. ⏭️  Skip this session
```

**You type**: `1` (Proceed to GREEN)

#### GREEN Phase Execution

```
🟢 GREEN PHASE - Implementing models...

[Agent launches backend-builder]
[Agent reads failing tests]
[Agent implements models to pass tests]
[Agent creates migrations]
[Agent runs tests - they all PASS]
[Agent measures coverage]

✓ GREEN phase complete
```

#### Checkpoint 3: AFTER_GREEN

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ GREEN PHASE COMPLETE                                      │
│                                                              │
│ Tests: 72/72 passing ✓                                      │
│ Coverage: 93%                                                │
│                                                              │
│ Files created/modified:                                      │
│   - backend/apps/blog/models.py                              │
│   - backend/apps/blog/admin.py                               │
│   - backend/apps/blog/migrations/0001_initial.py             │
│   - backend/config/settings/base.py (added 'blog' to INSTALLED_APPS) │
│                                                              │
│ Models implemented:                                          │
│   ✓ Post (with auto-slug, status workflow)                  │
│   ✓ Comment (with nested replies)                           │
│   ✓ Category (with unique slug)                             │
│   ✓ Tag (with unique slug)                                  │
└─────────────────────────────────────────────────────────────┘

All tests PASSING! Ready to refactor.

What would you like to do?

1. ✅ Proceed to REFACTOR phase (improve code quality)
2. ✅ Skip refactor (code is good enough)
3. 🔄 Modify implementation (I want to change something)
```

**You type**: `1` (Proceed to REFACTOR)

#### REFACTOR Phase Execution

```
🔵 REFACTOR PHASE - Improving code quality...

[Agent launches backend-builder]
[Agent adds docstrings]
[Agent adds type hints]
[Agent optimizes queries]
[Agent runs tests - still PASS]

✓ REFACTOR phase complete
```

#### Checkpoint 4: AFTER_REFACTOR

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ REFACTOR PHASE COMPLETE                                   │
│                                                              │
│ Improvements made:                                           │
│   ✓ Added comprehensive docstrings to all models            │
│   ✓ Added type hints to all methods                         │
│   ✓ Added database indexes for common queries               │
│   ✓ Optimized __str__ methods                               │
│                                                              │
│ Tests: 72/72 passing ✓                                      │
│ Coverage: 93%                                                │
│ Type checking: PASS ✓                                       │
└─────────────────────────────────────────────────────────────┘

Ready to commit!

What would you like to do?

1. ✅ Commit & Continue (create git commit and mark session complete)
2. 🔄 Further refactoring (I want to improve more)
```

**You type**: `1` (Commit)

#### Git Commit

```
Creating git commit...

git add backend/apps/blog/
git commit -m "feat: implement blog models + admin

Completed Session 1: Models + Admin

Phase: Backend Foundation
Tests: 72/72 passing
Coverage: 93%
Time: 1.5h (estimated: 2.5h)

Files modified:
- backend/apps/blog/models.py
- backend/apps/blog/admin.py
- backend/apps/blog/tests/test_models.py
- backend/apps/blog/migrations/0001_initial.py

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

✓ Commit created: a1b2c3d
```

#### Checkpoint 5: SESSION_COMPLETE

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ SESSION 1 COMPLETE: Models + Admin                       │
│                                                              │
│ Tests: 72/72 passing ✓                                      │
│ Coverage: 93%                                                │
│ Time: 1.5h (estimated: 2.5h) - 40% faster! 🎉             │
│ Commit: a1b2c3d                                              │
│                                                              │
│ Overall Progress: 1/11 sessions complete (9%)                │
│                  Phase 1: 1/4 complete (25%)                 │
└─────────────────────────────────────────────────────────────┘

What would you like to do?

1. ✅ Continue to Session 2 (Serializers + ViewSets)
2. ⏸️  Pause execution (resume later with /execute-session my-blog 2)
3. 📊 Show overall progress (/show-progress my-blog)
```

**You type**: `1` (Continue)

[Process repeats for Session 2...]

### Step 4: Check Progress Anytime

```bash
/show-progress my-blog
```

**Output**:
```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT PROGRESS: my-blog                                   │
│                                                              │
│ Status: in_progress                                          │
│ Progress: 2/11 sessions (18%)                                │
│ Current: Phase 1, Session 3                                  │
└─────────────────────────────────────────────────────────────┘

OVERALL METRICS:

  Tests: 162/162 passing
  Coverage: 92% average
  Time: 3.2h spent / 30h estimated
  Remaining: ~26.8h

PHASE BREAKDOWN:

Phase 1: Backend Foundation [in_progress]
  Sessions: 2/4 complete

  ✓ Session 1: Models + Admin
    ✓ 72/72 tests, 93% coverage, 1.5h

  ✓ Session 2: Serializers + ViewSets
    ✓ 90/90 tests, 92% coverage, 1.7h

  ⏳ Session 3: Permissions + Business Logic
    🔴 RED phase, 60 tests written

  ○ Session 4: Media Uploads + Optimization
    ⏸️  Not started

NEXT STEPS:

⏸️  Paused at checkpoint: after_red

Resume execution:
  /execute-session my-blog 3
```

## User Control Points

You have full control at every checkpoint:

### At BEFORE_START
- **Start**: Proceed with RED phase
- **Skip**: Skip this session entirely
- **Pause**: Stop and resume later

### At AFTER_RED
- **Implement**: Proceed to GREEN phase
- **Revise Tests**: Modify tests yourself, then resume
- **Retry RED**: Agent rewrites tests
- **Skip**: Skip session

### At AFTER_GREEN
- **Refactor**: Proceed to REFACTOR phase
- **Skip Refactor**: Jump to commit
- **Modify**: Change implementation yourself
- **Retry GREEN**: Agent re-implements

### At AFTER_REFACTOR
- **Commit**: Create git commit and complete session
- **Further Refactoring**: Agent improves more
- **Retry REFACTOR**: Agent refactors again

### At SESSION_COMPLETE
- **Continue**: Proceed to next session
- **Pause**: Stop execution
- **Show Progress**: View overall stats

## What If Something Goes Wrong?

### Tests Fail in GREEN Phase

```
❌ GREEN PHASE FAILED

Tests: 58/72 passing
Failing tests:
  - test_post_publish_workflow
  - test_comment_approval_required
  ...

Error: AssertionError in test_post_publish_workflow
  Expected published_at to be set, got None

What would you like to do?

1. 🔄 Retry GREEN phase (agent will fix the failures)
2. 🔧 Fix manually (I'll modify the code myself)
3. ⏸️  Pause (stop and debug)
```

### Coverage Below Target

```
⚠️  COVERAGE WARNING

Coverage: 87% (target: 90%)

Missing coverage in:
  - backend/apps/blog/models.py lines 45-52 (publish workflow)

What would you like to do?

1. ✅ Accept lower coverage (proceed anyway)
2. 🔄 Add more tests (agent will write additional tests)
3. 🔧 I'll add tests manually
```

### Blocker Detected

```
🚫 BLOCKER: Missing Dependency

Session 5 (API Client + Zod Schemas) requires:
  - Session 3 (Permissions + Business Logic) - INCOMPLETE
  - Session 4 (Media Uploads + Optimization) - INCOMPLETE

Cannot proceed until dependencies are complete.

Next: /execute-session my-blog 3
```

## Pro Tips

1. **Review tests before implementing**: At AFTER_RED checkpoint, review the tests to ensure they match your expectations

2. **Customize at checkpoints**: You can pause and modify files manually at any checkpoint, then resume

3. **Monitor progress**: Use `/show-progress` frequently to see overall status

4. **Resume anytime**: If interrupted, just run `/execute-session <project> <session>` to pick up where you left off

5. **Trust but verify**: The agent follows TDD strictly, but review the code at each checkpoint

## Common Workflows

### Execute One Session at a Time
```bash
/initialize-project my-blog blog
/execute-session my-blog 1
# Review, approve at checkpoints
/execute-session my-blog 2
# Review, approve at checkpoints
...
```

### Execute Entire Phase (Future: Phase 3.4)
```bash
/initialize-project my-blog blog
/execute-phase my-blog 1
# Agent executes all 4 sessions in Phase 1
# You approve at each checkpoint
```

### Resume After Interruption
```bash
# Session 3 was in progress when you stopped
/show-progress my-blog
# Shows: Session 3, RED phase, awaiting_approval

/execute-session my-blog 3
# Picks up at the checkpoint where you left off
```

## What Gets Created

After Session 1 completes, you'll have:

```
backend/
  apps/
    blog/
      __init__.py
      apps.py
      models.py              # Post, Comment, Category, Tag models
      admin.py               # Admin registrations
      tests/
        __init__.py
        conftest.py          # pytest fixtures
        test_models.py       # 72 comprehensive tests
      migrations/
        0001_initial.py      # Initial migration

project-plans/
  my-blog/
    PROJECT_PLAN.md
    REQUIREMENTS.md
    .agent-state.json        # Execution state (updated)
```

And a git commit:
```
a1b2c3d feat: implement blog models + admin
```

## Example: Frontend Session (Composables)

After backend sessions complete, let's see what a frontend session looks like:

### Session 6: Post Composables + Stores

```bash
/execute-session my-blog 6
```

**What happens**:

#### Checkpoint 1: BEFORE_START

```
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT: BEFORE START                                    │
│ Session 6: Post Composables + Stores                        │
└─────────────────────────────────────────────────────────────┘

I will now:
1. Write tests for usePost, usePosts, useCategories composables
2. Test data fetching, mutations, error handling
3. Use Vue Test Utils + Vitest

Estimated time: ~50 minutes (RED phase)

What would you like to do?

1. ✅ Start Session
2. ⏭️  Skip Session
3. ⏸️  Pause
```

**You type**: `1` (Start Session)

#### RED Phase - Frontend Tests

```
🔴 RED PHASE - Writing composable tests...

[Agent launches frontend-builder]
[Agent reads REQUIREMENTS.md for API endpoints]
[Agent writes comprehensive composable tests]
[Agent runs tests - they all FAIL]

✓ RED phase complete
```

#### Checkpoint 2: AFTER_RED

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ RED PHASE COMPLETE                                        │
│                                                              │
│ Tests written: 50                                            │
│ Tests failing: 50 (expected!)                                │
│                                                              │
│ Files created:                                               │
│   - frontend/src/composables/usePost.test.ts                 │
│   - frontend/src/composables/usePosts.test.ts                │
│   - frontend/src/composables/useCategories.test.ts           │
│                                                              │
│ Sample tests:                                                │
│   - test_usePost_fetches_post_by_uuid                        │
│   - test_usePost_handles_errors                              │
│   - test_usePosts_filters_by_category                        │
│   - test_useCreatePost_creates_post                          │
│   - test_useCreatePost_invalidates_cache                     │
└─────────────────────────────────────────────────────────────┘

All tests are FAILING (as expected in RED phase!)

What would you like to do?

1. ✅ Proceed to GREEN phase (implement composables)
2. 🔄 Revise tests
3. ⏭️  Skip this session
```

**You type**: `1` (Proceed)

#### GREEN Phase - Implementation

```
🟢 GREEN PHASE - Implementing composables...

[Agent launches frontend-builder]
[Agent reads failing tests]
[Agent implements composables with Vue Query]
[Agent validates API responses with Zod]
[Agent runs tests - they all PASS]
[Agent measures coverage]

✓ GREEN phase complete
```

#### Checkpoint 3: AFTER_GREEN

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ GREEN PHASE COMPLETE                                      │
│                                                              │
│ Tests: 50/50 passing ✓                                      │
│ Coverage: 87%                                                │
│ Type checking: PASS ✓                                       │
│                                                              │
│ Files created/modified:                                      │
│   - frontend/src/composables/usePost.ts                      │
│   - frontend/src/composables/usePosts.ts                     │
│   - frontend/src/composables/useCategories.ts                │
│                                                              │
│ Key features:                                                │
│   ✓ Data fetching with TanStack Query                       │
│   ✓ Zod validation for all API responses                    │
│   ✓ Error handling with retry logic                         │
│   ✓ Cache invalidation on mutations                         │
│   ✓ Optimistic updates for better UX                        │
└─────────────────────────────────────────────────────────────┘

All tests PASSING! Ready to refactor.

What would you like to do?

1. ✅ Proceed to REFACTOR phase
2. ✅ Skip refactor
3. 🔄 Modify implementation
```

**You type**: `1` (Proceed to REFACTOR)

#### REFACTOR Phase

```
🔵 REFACTOR PHASE - Improving code quality...

[Agent adds JSDoc comments]
[Agent extracts common API query pattern]
[Agent improves TypeScript types]
[Agent runs tests - still PASS]

✓ REFACTOR phase complete
```

#### Checkpoint 4: AFTER_REFACTOR

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ REFACTOR PHASE COMPLETE                                   │
│                                                              │
│ Improvements made:                                           │
│   ✓ Added JSDoc comments to all composables                 │
│   ✓ Extracted common useApiQuery pattern                    │
│   ✓ Added explicit return types everywhere                  │
│   ✓ Improved error messages                                 │
│                                                              │
│ Tests: 50/50 passing ✓                                      │
│ Coverage: 88% (improved!)                                    │
│ Type checking: PASS ✓                                       │
└─────────────────────────────────────────────────────────────┘

Ready to commit!

1. ✅ Commit & Continue
2. 🔄 Further refactoring
```

**You type**: `1` (Commit)

#### Git Commit

```
Creating git commit...

git add frontend/src/composables/
git commit -m "feat: implement post composables

Completed Session 6: Post Composables + Stores

Phase: Frontend Foundation
Tests: 50/50 passing
Coverage: 88%
Time: 2.1h (estimated: 2.5h)

Files modified:
- frontend/src/composables/usePost.ts
- frontend/src/composables/usePosts.ts
- frontend/src/composables/useCategories.ts

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

✓ Commit created: f1a2b3c
```

#### Session Complete

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ SESSION 6 COMPLETE: Post Composables + Stores            │
│                                                              │
│ Tests: 50/50 passing ✓                                      │
│ Coverage: 88%                                                │
│ Time: 2.1h (estimated: 2.5h) - 16% faster! 🎉             │
│ Commit: f1a2b3c                                              │
│                                                              │
│ Overall Progress: 6/11 sessions complete (55%)               │
│                  Phase 2: 2/4 complete (50%)                 │
└─────────────────────────────────────────────────────────────┘

What would you like to do?

1. ✅ Continue to Session 7 (Post UI Components)
2. ⏸️  Pause execution
3. 📊 Show overall progress
```

## Example: Mobile Session (Screens)

For projects with mobile apps, here's what a mobile session looks like:

### Session 9: Post List Screen (React Native)

```bash
/execute-session my-blog 9
```

**What happens**:

#### Checkpoint 1: BEFORE_START

```
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT: BEFORE START                                    │
│ Session 9: Post List Screen                                 │
└─────────────────────────────────────────────────────────────┘

I will now:
1. Write tests for PostListScreen component
2. Test rendering, navigation, loading states
3. Use Jest + React Native Testing Library

Estimated time: ~45 minutes (RED phase)

What would you like to do?

1. ✅ Start Session
2. ⏭️  Skip Session
3. ⏸️  Pause
```

**You type**: `1` (Start Session)

#### RED Phase - Mobile Tests

```
🔴 RED PHASE - Writing mobile screen tests...

[Agent launches mobile-builder]
[Agent reads REQUIREMENTS.md for screens]
[Agent writes comprehensive screen tests]
[Agent runs tests - they all FAIL]

✓ RED phase complete
```

#### Checkpoint 2: AFTER_RED

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ RED PHASE COMPLETE                                        │
│                                                              │
│ Tests written: 25                                            │
│ Tests failing: 25 (expected!)                                │
│                                                              │
│ Files created:                                               │
│   - mobile/src/screens/PostListScreen.test.tsx              │
│   - mobile/src/components/PostCard.test.tsx                 │
│   - mobile/src/hooks/usePosts.test.ts                       │
│                                                              │
│ Sample tests:                                                │
│   - test_renders_list_of_posts                              │
│   - test_navigates_to_detail_on_tap                         │
│   - test_shows_loading_indicator                            │
│   - test_shows_error_message                                │
│   - test_pull_to_refresh                                    │
└─────────────────────────────────────────────────────────────┘

All tests are FAILING (as expected in RED phase!)

What would you like to do?

1. ✅ Proceed to GREEN phase (implement screens)
2. 🔄 Revise tests
3. ⏭️  Skip this session
```

**You type**: `1` (Proceed)

#### GREEN Phase - Implementation

```
🟢 GREEN PHASE - Implementing React Native screens...

[Agent launches mobile-builder]
[Agent reads failing tests]
[Agent implements screens with React Native Paper]
[Agent sets up navigation with React Navigation]
[Agent runs tests - they all PASS]
[Agent measures coverage]

✓ GREEN phase complete
```

#### Checkpoint 3: AFTER_GREEN

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ GREEN PHASE COMPLETE                                      │
│                                                              │
│ Tests: 25/25 passing ✓                                      │
│ Coverage: 87%                                                │
│ Type checking: PASS ✓                                       │
│                                                              │
│ Files created/modified:                                      │
│   - mobile/src/screens/PostListScreen.tsx                   │
│   - mobile/src/components/PostCard.tsx                      │
│   - mobile/src/hooks/usePosts.ts                            │
│   - mobile/src/navigation/AppNavigator.tsx                  │
│                                                              │
│ Key features:                                                │
│   ✓ FlatList with optimized rendering                       │
│   ✓ Pull-to-refresh functionality                           │
│   ✓ Error handling with retry                               │
│   ✓ Navigation integration                                  │
│   ✓ Platform-specific styling (iOS/Android)                 │
└─────────────────────────────────────────────────────────────┘

All tests PASSING! Ready to refactor.
```

#### REFACTOR Phase

```
🔵 REFACTOR PHASE - Optimizing mobile code...

[Agent extracts platform-specific code]
[Agent optimizes FlatList performance]
[Agent adds accessibility labels]
[Agent runs tests - still PASS]

✓ REFACTOR phase complete
```

#### Git Commit

```
Creating git commit...

git add mobile/src/
git commit -m "feat(mobile): implement post list screen

Completed Session 9: Post List Screen

Phase: Mobile Development
Tests: 25/25 passing
Coverage: 88%
Time: 1.8h (estimated: 2h)

Mobile stack:
- React Native + Expo
- TypeScript strict mode
- Jest + React Native Testing Library
- React Navigation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

✓ Commit created: m1a2b3c
```

## Example: E2E Integration Testing Session

The final session is typically E2E testing that validates the entire stack:

### Session 11: E2E Integration Testing + Performance

```bash
/execute-session my-blog 11
```

**What happens**:

#### Checkpoint 1: BEFORE_START

```
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT: BEFORE START                                    │
│ Session 11: E2E Integration Testing + Performance           │
└─────────────────────────────────────────────────────────────┘

I will now:
1. Write E2E tests for complete user workflows
2. Test authentication, post creation, commenting flows
3. Validate performance targets
4. Use Playwright for cross-browser testing

Estimated time: ~60 minutes (RED phase)

What would you like to do?

1. ✅ Start Session
2. ⏭️  Skip Session
3. ⏸️  Pause
```

**You type**: `1` (Start Session)

#### RED Phase - E2E Tests

```
🔴 RED PHASE - Writing E2E workflow tests...

[Agent launches e2e-tester]
[Agent reads REQUIREMENTS.md for workflows]
[Agent writes complete workflow tests]
[Agent runs tests - some may PASS, some may FAIL]

✓ RED phase complete
```

#### Checkpoint 2: AFTER_RED

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ RED PHASE COMPLETE                                        │
│                                                              │
│ Tests written: 30                                            │
│ Tests passing: 18 (some workflows already work!)             │
│ Tests failing: 12 (integration issues found)                 │
│                                                              │
│ Files created:                                               │
│   - frontend/e2e/auth.spec.ts                               │
│   - frontend/e2e/blog-post-workflow.spec.ts                 │
│   - frontend/e2e/performance.spec.ts                        │
│   - frontend/e2e/helpers/auth.ts                            │
│                                                              │
│ Critical workflows tested:                                   │
│   ✓ User signup → OTP → Login → Dashboard                  │
│   ✓ Create draft → Publish → View on list                  │
│   ✓ View post → Add comment → Comment appears              │
│   ⚠️  Filter posts by category (failing)                    │
│   ⚠️  Upload post image (failing)                           │
└─────────────────────────────────────────────────────────────┘

What would you like to do?

1. ✅ Proceed to GREEN phase (fix integration issues)
2. 🔄 Revise tests
3. ⏭️  Skip this session
```

**You type**: `1` (Proceed)

#### GREEN Phase - Fix Integration Issues

```
🟢 GREEN PHASE - Fixing integration bugs...

[Agent launches e2e-tester]
[Agent debugs failing tests]
[Agent fixes backend API issues]
[Agent fixes frontend routing issues]
[Agent runs tests - they all PASS]

✓ GREEN phase complete
```

#### Checkpoint 3: AFTER_GREEN

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ GREEN PHASE COMPLETE                                      │
│                                                              │
│ Tests: 30/30 passing ✓                                      │
│ Performance: All targets met ✓                              │
│                                                              │
│ Issues fixed:                                                │
│   ✓ Category filtering API returned wrong status code      │
│   ✓ Image upload missing CORS headers                      │
│   ✓ Comment form didn't clear after submit                 │
│                                                              │
│ Performance metrics:                                         │
│   ✓ Homepage load: 1.2s (target: <2s)                      │
│   ✓ Post list API: 180ms (target: <300ms)                  │
│   ✓ Post detail page: 1.4s (target: <2s)                   │
└─────────────────────────────────────────────────────────────┘

All tests PASSING! Ready to refactor.
```

#### REFACTOR Phase

```
🔵 REFACTOR PHASE - Improving E2E test quality...

[Agent extracts common helpers]
[Agent adds page object models]
[Agent reduces test flakiness]
[Agent runs tests - still PASS]

✓ REFACTOR phase complete
```

#### Git Commit

```
Creating git commit...

git add frontend/e2e/ backend/apps/
git commit -m "test: add E2E integration tests + performance validation

Completed Session 11: E2E Integration Testing + Performance

Phase: Integration & Testing
Tests: 30/30 passing
Performance: All targets met
Time: 2.5h (estimated: 3h)

Critical workflows validated:
- Authentication flows
- Post creation and publishing
- Commenting system
- Performance targets

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

✓ Commit created: e2e1a2b
```

#### Session Complete

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ SESSION 11 COMPLETE: E2E Testing + Performance           │
│                                                              │
│ Tests: 30/30 passing ✓                                      │
│ All workflows validated ✓                                   │
│ All performance targets met ✓                               │
│ Commit: e2e1a2b                                              │
│                                                              │
│ 🎉 PROJECT COMPLETE: 11/11 sessions done (100%)            │
│    Total tests: 437/437 passing                             │
│    Average coverage: 89%                                     │
│    Total time: 24.5h (estimated: 30h) - 18% faster!        │
└─────────────────────────────────────────────────────────────┘

Congratulations! Your blog app is fully built, tested, and ready to deploy! 🚀
```

## Phase-Level Execution with Orchestration

For faster execution, you can run entire phases with automatic parallelization!

### Execute Entire Phase (Recommended for Production)

```bash
/execute-phase my-blog 1
```

**What happens**:

#### Checkpoint 1: PHASE START with Parallelization Plan

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Backend Foundation                                │
│                                                              │
│ Total Sessions: 4                                            │
│ Estimated Time (sequential): 10.5h                          │
│ Estimated Time (parallel): 7.2h                             │
│ Time Savings: 31% ⚡                                        │
└─────────────────────────────────────────────────────────────┘

PARALLELIZATION PLAN:

Group 1: 1 session (can start immediately)
  - Session 1: Models + Admin (2.5h)

Group 2: 1 session (after Group 1)
  - Session 2: Serializers + ViewSets (3h)

Group 3: 2 sessions (after Group 2) - PARALLEL!
  - Session 3: Permissions + Business Logic (2.5h)
  - Session 4: Media Uploads + Optimization (2.5h)

EXECUTION STRATEGY:

- Sessions in the same group will run in PARALLEL
- Max 3 sessions at a time
- Each session follows RED-GREEN-REFACTOR with checkpoints
- Continue on error: true

What would you like to do?

1. ✅ Start Phase (execute with parallelization)
2. 🔄 Run sequentially (disable parallelization)
3. ⏭️  Skip Phase
4. ⏸️  Pause
```

**You type**: `1` (Start Phase)

#### Parallel Execution

```
🔴 [START] Session 1: Models + Admin
  ✓ RED phase: 72 tests written, all failing
  ✓ GREEN phase: 72/72 passing, 93% coverage
  ✓ REFACTOR phase: Docstrings + type hints added
  ✓ COMMIT: a1b2c3d

🔴 [START] Session 2: Serializers + ViewSets
  ✓ RED phase: 90 tests written, all failing
  ✓ GREEN phase: 90/90 passing, 92% coverage
  ✓ REFACTOR phase: DRY improvements
  ✓ COMMIT: b2c3d4e

🔵 [START] Session 3: Permissions (PARALLEL)
🔵 [START] Session 4: Media Uploads (PARALLEL)

[Both sessions run at the same time!]

  ✓ Session 3 complete: 60/60 passing, 91% coverage
    COMMIT: c3d4e5f

  ✓ Session 4 complete: 45/45 passing, 89% coverage
    COMMIT: d4e5f6g
```

#### Checkpoint 2: PHASE COMPLETE

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ PHASE 1 COMPLETE: Backend Foundation                     │
│                                                              │
│ Sessions: 4/4 completed ✓                                   │
│ Tests: 267 passing                                           │
│ Coverage: 91% average                                        │
│ Time: 7.1h (estimated: 10.5h)                               │
│ Savings: 32% ⚡                                              │
│ Commits: 4 created                                           │
│                                                              │
│ Overall Progress: 1/4 phases (25%)                          │
└─────────────────────────────────────────────────────────────┘

COMMITS CREATED:

  1. a1b2c3d - feat: implement blog models + admin
  2. b2c3d4e - feat: implement serializers + viewsets
  3. c3d4e5f - feat: implement permissions + business logic
  4. d4e5f6g - feat: implement media uploads + optimization

What would you like to do?

1. ✅ Continue to Phase 2 (Frontend Foundation)
2. 📊 Show overall progress
3. ⏸️  Pause execution
```

**You type**: `1` (Continue to Phase 2)

### Resume Interrupted Session

If execution is interrupted, you can resume from the last checkpoint:

```bash
/resume-session my-blog
```

**Output**:
```
┌─────────────────────────────────────────────────────────────┐
│ RESUME SESSION                                              │
│ Session 3: Permissions + Business Logic                     │
│                                                              │
│ Last Checkpoint: AFTER_GREEN                                │
│ Last Updated: 2025-01-15 14:30:00                           │
└─────────────────────────────────────────────────────────────┘

STATUS:

🟢 GREEN PHASE COMPLETE

Tests: 60/60 passing
Coverage: 91%

Files created/modified:
  - backend/apps/blog/permissions.py
  - backend/apps/blog/tests/test_permissions.py

What happened:
  - Implementation completed
  - All tests passing
  - Execution was paused before REFACTOR phase

What would you like to do?

1. ✅ Continue to REFACTOR phase (improve code)
2. 🔄 Restart session from beginning
3. ⏭️  Skip this session
4. ⏸️  Cancel resume
```

**You type**: `1` (Continue to REFACTOR)

```
🔵 REFACTOR PHASE - Improving code quality...

[Agent adds docstrings, type hints, optimizations]

✓ REFACTOR phase complete

💾 Creating commit...

git commit -m "feat: implement permissions + business logic

Completed Session 3: Permissions + Business Logic
...
"

✓ Commit created: c3d4e5f

┌─────────────────────────────────────────────────────────────┐
│ ✓ SESSION RESUMED AND COMPLETED                            │
│ Session 3: Permissions + Business Logic                     │
│                                                              │
│ Tests: 60/60 passing ✓                                      │
│ Coverage: 91%                                                │
│ Commit: c3d4e5f                                              │
│                                                              │
│ Overall Progress: 3/11 sessions (27%)                       │
└─────────────────────────────────────────────────────────────┘
```

## Execution Modes Comparison

### Session-Level vs Phase-Level Execution

| Aspect | `/execute-session` | `/execute-phase` |
|--------|-------------------|------------------|
| **Scope** | Single session | Entire phase (4 sessions) |
| **Parallelization** | No | Yes (dependency-aware) |
| **Time Savings** | None | 20-40% faster ⚡ |
| **User Effort** | Run 4 times for 4 sessions | Run once for all 4 sessions |
| **Checkpoints** | Per session (5 checkpoints) | Per session + phase-level |
| **Progress Tracking** | Manual | Automatic |
| **Best For** | Debugging, learning, granular control | Production, speed, automation |
| **Resume Support** | `/resume-session` | `/resume-session` (per session) |

**Recommendation**: Use `/execute-phase` for normal development (faster), use `/execute-session` when you need granular control or debugging.

## Next Steps

After completing all sessions:
- **Deploy**: Your app is fully built, tested, and ready to deploy
- **Customize**: Add optional enhancements from PROJECT_PLAN.md
- **Extend**: Use the same system to build additional features

## Key Differences: Session Types Comparison

| Aspect | Backend (Django) | Frontend (Vue) | Mobile (React Native) | E2E (Playwright) |
|--------|------------------|----------------|----------------------|------------------|
| **Test Framework** | pytest + Django Test Utils | Vitest + Vue Test Utils | Jest + React Native Testing Library | Playwright |
| **Coverage Target** | 90% | 85% | 85% | N/A (workflow validation) |
| **Key Tests** | Models, Serializers, ViewSets, Permissions | Components, Composables, Views, Schemas | Screens, Components, Hooks, Navigation | Complete user workflows, Integration |
| **Tech Stack** | Django, DRF, PostgreSQL | Vue 3, TypeScript, Shadcn-vue, TanStack Query | React Native, Expo, React Navigation, React Native Paper | Playwright, Real browser, Real database |
| **Validation** | Django validators | Zod schemas | TypeScript types + prop validation | End-to-end flow validation |
| **Type Safety** | Type hints + mypy | TypeScript strict mode (no `any`) | TypeScript strict mode (no `any`) | TypeScript for test code |
| **Common Patterns** | select_related, prefetch_related | Vue Query caching, optimistic updates | FlatList optimization, Platform.select | Page object models, test helpers |
| **Unique Aspects** | Database migrations, Admin | Composables, reactive refs | Platform-specific code (iOS/Android) | Tests entire stack together |

---

**That's it!** The agent handles all the TDD workflow for backend, frontend, mobile, and E2E testing. You just approve at checkpoints and review the code. 🚀

Happy building!
