# Project Plan: Project Management Platform

## Overview

A production-ready project management platform with projects, tasks, Kanban boards, time tracking, comments, attachments, and real-time collaboration. Includes drag-and-drop task management, activity logging, and team permissions. Built with TDD principles and optimized for real-time performance.

**Complexity**: Intermediate
**Target Users**: Teams, agencies, software companies, project managers

## Technical Stack

- **Backend**: Django 5.2 + Django REST Framework + PostgreSQL + Channels (WebSockets)
- **Frontend**: Vue 3 (Composition API) + TypeScript + Shadcn-vue + Tailwind CSS + VueDraggable
- **Real-time**: Django Channels + Redis (Pub/Sub)
- **Infrastructure**: Docker + Redis + Celery
- **Storage**: Local media files (extendable to S3/CloudFlare R2)
- **Caching**: Redis (dashboards, boards)

## Phases

### Phase 1: Backend Foundation - Projects & Members (Sessions 1-3)
**Goal**: Build multi-project foundation with team permissions

#### Session 1: Project Models + Auto-Provisioning (TDD)
- Create `pm` Django app
- Implement Project, ProjectMember models
- Auto-provisioning: On project creation → create owner membership + default board
- Project stats methods (task count, completion %)
- Register in Django admin
- Write comprehensive model tests
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 2: Project API + Permissions (TDD)
- ProjectSerializer with stats
- ProjectMemberSerializer
- Project CRUD viewsets
- IsMember, IsOwnerOrAdmin permissions
- List user's projects (where user is member)
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 3: Member Management (TDD)
- Add/remove project members
- Update member role (owner, admin, member)
- Permission matrix implementation
- **Estimated Time**: 2 hours
- **Tests**: ~60 tests

**Phase 1 Total**: 8 hours, ~220 tests

---

### Phase 2: Backend - Tasks & Workflow (Sessions 4-6)
**Goal**: Task management with status, priority, assignments

#### Session 4: Task Model + Business Logic (TDD)
- Task model (title, description, status, priority, due_date, assignee)
- Task validation (due date not in past)
- Task completion logic (mark_done, completed_at)
- Overdue detection
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 5: Task API + Filtering (TDD)
- TaskSerializer with nested assignee
- Task CRUD viewsets
- Filtering (status, assignee, priority, due date)
- Sorting (due date, priority, created_at)
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 6: Task Assignment + Notifications (TDD)
- Assign task to user (sends email via Celery)
- Update assignee (email notification)
- Task reporter tracking
- **Estimated Time**: 2.5 hours
- **Tests**: ~60 tests

**Phase 2 Total**: 8.5 hours, ~220 tests

---

### Phase 3: Backend - Kanban Boards (Sessions 7-8)
**Goal**: Drag-and-drop Kanban boards with columns

#### Session 7: Board & Column Models (TDD)
- Board model (project, name, is_default)
- Column model (board, name, order, wip_limit)
- Task.column relationship
- Task.order for drag-and-drop positioning
- Default board constraint (one per project)
- **Estimated Time**: 2.5 hours
- **Tests**: ~70 tests

#### Session 8: Board API + Task Movement (TDD)
- BoardSerializer with nested columns + tasks
- ColumnSerializer
- Board/column CRUD endpoints
- Move task endpoint (updates column + order)
- WIP limit validation
- **Estimated Time**: 3 hours
- **Tests**: ~70 tests

**Phase 3 Total**: 5.5 hours, ~140 tests

---

### Phase 4: Backend - Comments, Attachments, Time (Sessions 9-11)
**Goal**: Task collaboration features

#### Session 9: Comments System (TDD)
- Comment model (task, author, content)
- Comment CRUD endpoints
- Comment count on task
- **Estimated Time**: 2 hours
- **Tests**: ~50 tests

#### Session 10: File Attachments (TDD)
- Attachment model (task, file, uploaded_by, file_size, mime_type)
- Upload attachment endpoint (multipart/form-data)
- File validation (max 25MB, allowed types)
- Delete attachment endpoint
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

#### Session 11: Time Tracking (TDD)
- TimeEntry model (task, user, hours, description, date)
- Log time endpoint
- Update/delete time entry
- Task.get_time_spent() method
- Time validation (> 0, <= 24, date not in future)
- **Estimated Time**: 2.5 hours
- **Tests**: ~60 tests

**Phase 4 Total**: 7 hours, ~160 tests

---

### Phase 5: Backend - Activity Log & Real-time (Sessions 12-13)
**Goal**: Activity tracking and WebSocket updates

#### Session 12: Activity Logging (TDD)
- Activity model (project, user, activity_type, task, description, metadata)
- Auto-create activity on task create/update/delete
- Auto-create activity on comment/member add/remove
- Activity list endpoint (chronological)
- **Estimated Time**: 2.5 hours
- **Tests**: ~60 tests

#### Session 13: WebSocket Integration (Django Channels + TDD)
- Install Django Channels + Redis backend
- WebSocket consumer for board updates (`/ws/board/{board_uuid}/`)
- Broadcast task_moved event on task movement
- Broadcast task_created/task_updated/task_deleted events
- Authentication middleware for WebSockets
- **Estimated Time**: 3.5 hours
- **Tests**: ~50 tests

**Phase 5 Total**: 6 hours, ~110 tests

---

### Phase 6: Frontend Foundation (Sessions 14-15)
**Goal**: Type-safe frontend with core components

#### Session 14: API Client + Composables (Code Generation + TDD)
- Generate TypeScript SDK from OpenAPI schema
- Create Zod validation schemas (project, task, time entry)
- Set up React Query
- `useProject`, `useProjects` composables
- `useTask`, `useTasks` composables
- WebSocket hook (`useWebSocket`)
- **Estimated Time**: 2 hours
- **Tests**: ~40 tests

#### Session 15: Project Components (TDD)
- ProjectCard (name, color, stats, progress bar)
- CreateProjectModal (name, description, color picker)
- ProjectHeader (name, description, members)
- MembersList (avatars, roles, add/remove)
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 6 Total**: 5 hours, ~100 tests

---

### Phase 7: Frontend - Kanban Board (Sessions 16-17)
**Goal**: Drag-and-drop Kanban board UI

#### Session 16: Board Components (TDD)
- `useBoard` composable
- KanbanBoard component (columns layout)
- BoardColumn component (name, WIP limit, task count)
- TaskCard component (draggable, title, assignee, due date, priority)
- VueDraggable integration
- **Estimated Time**: 4 hours
- **Tests**: ~80 tests

#### Session 17: Drag-and-Drop + Real-time (TDD)
- Implement drag-and-drop handlers
- Optimistic updates on drag
- WebSocket integration for live board updates
- Conflict resolution (if two users drag same task)
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 7 Total**: 7 hours, ~140 tests

---

### Phase 8: Frontend - Task Management (Sessions 18-19)
**Goal**: Task creation and detail views

#### Session 18: Create/Edit Task UI (TDD)
- CreateTaskModal (form with all fields)
- TaskForm validation
- AssigneeSelect (project members)
- StatusSelect, PrioritySelect
- DueDatePicker
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

#### Session 19: Task Detail Modal (TDD)
- TaskDetailModal (full-page or modal)
- TaskHeader (title, status, priority, assignee - all editable)
- TaskDescription (editable)
- TaskMetadata (due date, estimated hours, time spent)
- TaskTabs (Comments, Attachments, Time, Activity)
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 8 Total**: 6 hours, ~120 tests

---

### Phase 9: Frontend - Task Details Tabs (Sessions 20-22)
**Goal**: Comments, attachments, time tracking UI

#### Session 20: Comments Tab (TDD)
- `useComments` composable
- CommentForm component
- CommentList component
- CommentItem (author, content, timestamp, edit/delete)
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

#### Session 21: Attachments Tab (TDD)
- `useAttachments` composable
- AttachmentUploader (drag-and-drop)
- AttachmentList component
- AttachmentItem (filename, size, download, delete)
- File validation UI
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

#### Session 22: Time Tracking Tab (TDD)
- `useTimeTracking` composable
- LogTimeForm (hours, description, date)
- TimeEntriesList component
- TimeEntryItem (user, hours, date, description, edit/delete)
- Total time display
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

**Phase 9 Total**: 7.5 hours, ~150 tests

---

### Phase 10: Frontend - Views & Polish (Session 23)
**Goal**: Complete views and navigation

#### Session 23: Views & Navigation (TDD)
- ProjectsView (list of user's projects)
- ProjectDetailView (tabs: Board, List, Calendar, Activity, Settings)
- ListView (task table with filters/sorting)
- CalendarView (tasks by due date)
- ActivityTimeline component
- Settings tab (project form, members, delete)
- **Estimated Time**: 4 hours
- **Tests**: ~80 tests

**Phase 10 Total**: 4 hours, ~80 tests

---

### Phase 11: Integration & Polish (Session 24)
**Goal**: End-to-end testing, optimization, deployment prep

#### Session 24: E2E Testing + Performance (TDD)
- E2E workflow: Create project → Add member → Create task → Assign → Complete
- E2E workflow: Drag task between columns → Verify real-time update
- E2E workflow: Log time → Upload attachment → Add comment
- WebSocket connection testing
- File upload verification
- Board caching hit/miss analysis
- Type checking (0 TypeScript errors)
- Final coverage report (>85% target)
- Documentation updates
- **Estimated Time**: 3.5 hours
- **Tests**: ~50 E2E tests

**Phase 11 Total**: 3.5 hours, ~50 tests

---

## Summary

**Total Sessions**: 24
**Total Estimated Time**: 68.5 hours
**Total Test Count**: ~1490 tests
**Backend Coverage Target**: 90%
**Frontend Coverage Target**: 85%

## Data Models Summary

| Model          | Fields | Relationships                  | Indexes |
|----------------|--------|-------------------------------|---------|
| Project        | 9      | User (owner), ProjectMember, Task, Board, Activity | 4 |
| ProjectMember  | 4      | Project, User                 | 3 |
| Task           | 15     | Project, User (assignee, reporter), Column, Comment, Attachment, TimeEntry | 7 |
| Board          | 5      | Project, Column               | 2 |
| Column         | 6      | Board, Task                   | 3 |
| Comment        | 6      | Task, User                    | 3 |
| Attachment     | 8      | Task, User                    | 2 |
| TimeEntry      | 7      | Task, User                    | 4 |
| Activity       | 8      | Project, User, Task           | 3 |

## API Endpoints Summary

| Resource       | Endpoints | Methods                       | Permissions |
|----------------|-----------|-------------------------------|-------------|
| Projects       | 5         | GET, POST, PATCH, DELETE      | Member, Owner/Admin |
| Tasks          | 6         | GET, POST, PATCH, DELETE, Move| Member, Assignee/Owner/Admin |
| Boards         | 3         | GET, POST                     | Member, Owner/Admin |
| Columns        | 2         | POST, PATCH                   | Owner/Admin |
| Comments       | 4         | GET, POST, PATCH, DELETE      | Member, Author |
| Attachments    | 2         | POST, DELETE                  | Member, Uploader/Owner/Admin |
| Time Entries   | 4         | GET, POST, PATCH, DELETE      | Member, Author |
| Activities     | 1         | GET                           | Member |
| WebSockets     | 1         | WS (board)                    | Member |

**Total Endpoints**: 28

## Frontend Components Summary

| Component Type | Count | Testing Priority |
|----------------|-------|------------------|
| Views          | 4     | High             |
| Components     | 24    | High             |
| Composables    | 8     | High             |

**Total Components**: 36

## Success Criteria

- ✅ All tests pass (>85% coverage)
- ✅ Type-safe (0 TypeScript `any`, 0 type errors)
- ✅ OpenAPI schema accurate
- ✅ WebSocket board updates working
- ✅ Drag-and-drop task movement working
- ✅ Real-time updates verified (task moves appear instantly)
- ✅ File attachments working (upload, download, delete)
- ✅ Time tracking accurate (log, edit, delete, total calculation)
- ✅ Activity log comprehensive (all actions logged)
- ✅ Project permissions working (owner, admin, member)
- ✅ Create project → add member → create task → assign → complete workflow E2E
- ✅ Board caching working (Redis hit rate >70%)
- ✅ Docker deployment working

## Testing Strategy

### Backend (pytest + coverage)
- **Models**: Field validation, relationships, auto-provisioning, completion %
- **Serializers**: Validation rules, due date checks, time entry limits
- **ViewSets**: CRUD operations, task movement, filtering
- **Permissions**: Project member access, owner/admin actions
- **WebSockets**: Connection, authentication, event broadcasting
- **Celery**: Email notifications (task assignment)

**Target**: 90% coverage

### Frontend (Vitest + Vue Test Utils)
- **Components**: Rendering, props, events, drag-and-drop, WebSocket integration
- **Composables**: Data fetching, mutations, real-time updates
- **Views**: Full page rendering, tab switching, filters
- **Schemas**: Zod validation (project, task, time entry)

**Target**: 85% coverage

### E2E (Playwright - recommended)
- Complete PM flow: Create project → Add member → Create task → Assign → Drag to done
- Real-time: Open two browsers → Drag task in one → See update in other
- Time tracking: Log time → Verify total updates
- File upload: Attach file → Download → Verify

**Target**: Critical paths covered

## Performance Targets

- **Project list load**: < 1.5 seconds
- **Board load**: < 2 seconds
- **Board API**: < 300ms (with caching)
- **Task creation**: < 500ms
- **Task movement (drag-drop)**: < 200ms (optimistic update)
- **WebSocket latency**: < 100ms (local), < 500ms (production)
- **File upload**: < 5 seconds (25MB)
- **Time log**: < 300ms

## Security Checklist

- ✅ Only project members can view project/tasks
- ✅ Only owner can delete project
- ✅ Only owner/admin can manage members
- ✅ Only assignee/owner/admin can edit tasks
- ✅ Only uploader/owner/admin can delete attachments
- ✅ Only time entry author can edit/delete time
- ✅ WebSocket authentication enforced
- ✅ File upload validation (type, size)
- ✅ CSRF protection enabled
- ✅ SQL injection prevention (ORM)
- ✅ Rate limiting on task/time/file operations
- ✅ Permission checks on all mutations

## Optional Enhancements (Post-MVP)

- [ ] Subtasks (break down tasks into smaller pieces)
- [ ] Task templates (recurring tasks, project templates)
- [ ] Task dependencies (blocked by, blocks)
- [ ] Labels/tags (categorize tasks)
- [ ] Milestones (project goals with deadlines)
- [ ] Gantt charts (timeline view with dependencies)
- [ ] Reports (burndown, velocity, time reports)
- [ ] Integrations (GitHub, Slack, Google Calendar, Jira)
- [ ] Automation rules (when X happens, do Y)
- [ ] Custom fields (add custom data to tasks)
- [ ] Workload view (see team capacity)
- [ ] Sprint planning (agile workflows)
- [ ] Notifications (email, push, in-app)
- [ ] Search (full-text search across tasks)
- [ ] Favorites (star important projects/tasks)
- [ ] Archived projects (soft delete)

## File Upload Configuration

**Allowed File Types**:
- Documents: pdf, doc, docx, xls, xlsx, txt, md
- Images: jpg, jpeg, png, gif, webp
- Archives: zip, tar, gz

**Size Limits**:
- Max file size: 25MB
- Max total attachments per task: 100MB

**Storage**:
- Development: Local storage (`media/task_attachments/`)
- Production: S3, CloudFlare R2, or similar
- CDN recommended for large files

## Real-Time Architecture

**WebSocket Scaling**:
- Use Redis Pub/Sub for multi-server WebSocket fanout
- Limit 1 WebSocket connection per board per user
- Batch events (debounce task moves by 200ms)
- Graceful fallback to polling if WebSocket fails

**Event Types**:
- `task_moved` → Broadcast to all board members
- `task_created` → Broadcast to all board members
- `task_updated` → Broadcast to all board members
- `task_deleted` → Broadcast to all board members

**Conflict Resolution**:
- Optimistic updates (show immediately, revert on error)
- Last-write-wins for task moves
- Notify user if their change was overridden

## Timeline

**Week 1**: Backend Foundation - Projects & Members (Phase 1)
**Week 2**: Backend - Tasks & Workflow (Phase 2)
**Week 3**: Backend - Kanban Boards (Phase 3)
**Week 4**: Backend - Comments, Attachments, Time (Phase 4)
**Week 5**: Backend - Activity & Real-time (Phase 5)
**Week 6**: Frontend Foundation + Kanban (Phase 6-7)
**Week 7**: Frontend - Task Management (Phase 8)
**Week 8**: Frontend - Task Details Tabs (Phase 9)
**Week 9**: Frontend - Views & Polish + Integration (Phase 10-11)

**Total Duration**: 9 weeks (part-time) or 4 weeks (full-time)

---

**Ready to start building?** Ensure Redis is running for WebSocket support and caching.
