# Project Management - Technical Requirements

**Generated from**: Project Management Template
**Complexity**: Intermediate
**Features**: Projects, Tasks, Kanban Boards, Time Tracking, Comments, Attachments, Activity Log

---

## Data Models

### Project Model

**File**: `backend/apps/pm/models/project.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `name` (CharField, max_length=200, required)
- `slug` (SlugField, max_length=220, unique, auto-generated from name)
- `description` (TextField, optional)
- `owner` (ForeignKey to User, on_delete=CASCADE, related_name='owned_projects')
- `color` (CharField, max_length=7, default='#3B82F6') - Hex color for UI
- `is_archived` (BooleanField, default=False)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Owner: Many-to-One with User
- Members: Many-to-Many with User through ProjectMember
- Tasks: One-to-Many with Task
- Boards: One-to-Many with Board
- Activities: One-to-Many with Activity

**Indexes**:

- `uuid` (unique)
- `slug` (unique)
- `owner` (for filtering)
- `is_archived` (for active projects)

**Validation**:

- Name: Required, max 200 chars
- Slug: Auto-generated from name, unique
- Color: Valid hex color format (#RRGGBB)

**Custom Methods**:

- `get_member_count()`: Count of project members
- `get_task_count()`: Total tasks
- `get_completed_task_count()`: Completed tasks
- `get_completion_percentage()`: (completed / total) * 100
- `is_member(user)`: Check if user is a member

---

### ProjectMember Model

**File**: `backend/apps/pm/models/project_member.py`

**Fields**:

- `id` (AutoField, primary key)
- `project` (ForeignKey to Project, on_delete=CASCADE, related_name='memberships')
- `user` (ForeignKey to User, on_delete=CASCADE, related_name='project_memberships')
- `role` (CharField, choices=['owner', 'admin', 'member'], default='member')
- `joined_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Project: Many-to-One with Project
- User: Many-to-One with User

**Indexes**:

- `project` (for project members)
- `user` (for user's projects)
- Composite: `['project', 'user']` (unique together)

**Validation**:

- Role: Must be one of ['owner', 'admin', 'member']
- Project + User unique together

**Permissions Matrix**:

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| View project | ✅ | ✅ | ✅ |
| Edit project | ✅ | ✅ | ❌ |
| Delete project | ✅ | ❌ | ❌ |
| Add members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Create tasks | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ❌ |
| Delete any task | ✅ | ✅ | ❌ |
| Create boards | ✅ | ✅ | ❌ |

---

### Task Model

**File**: `backend/apps/pm/models/task.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `project` (ForeignKey to Project, on_delete=CASCADE, related_name='tasks')
- `title` (CharField, max_length=200, required)
- `description` (TextField, optional)
- `assignee` (ForeignKey to User, on_delete=SET_NULL, null=True, blank=True, related_name='assigned_tasks')
- `reporter` (ForeignKey to User, on_delete=SET_NULL, null=True, related_name='reported_tasks')
- `status` (CharField, choices=['backlog', 'todo', 'in_progress', 'review', 'done'], default='backlog')
- `priority` (CharField, choices=['low', 'medium', 'high', 'urgent'], default='medium')
- `due_date` (DateField, null=True, blank=True)
- `estimated_hours` (DecimalField, max_digits=6, decimal_places=2, null=True, blank=True)
- `column` (ForeignKey to Column, on_delete=SET_NULL, null=True, blank=True, related_name='tasks')
- `order` (PositiveIntegerField, default=0) - For drag-and-drop ordering within column
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)
- `completed_at` (DateTimeField, null=True, blank=True)

**Relationships**:

- Project: Many-to-One with Project
- Assignee: Many-to-One with User (optional)
- Reporter: Many-to-One with User (who created the task)
- Column: Many-to-One with Column (for Kanban board)
- Comments: One-to-Many with Comment
- Attachments: One-to-Many with Attachment
- TimeEntries: One-to-Many with TimeEntry

**Indexes**:

- `uuid` (unique)
- `project` (for project tasks)
- `assignee` (for user's assigned tasks)
- `status` (for filtering)
- `due_date` (for sorting)
- Composite: `['column', 'order']` (for board ordering)

**Validation**:

- Title: Required, max 200 chars
- Status: Must be one of ['backlog', 'todo', 'in_progress', 'review', 'done']
- Priority: Must be one of ['low', 'medium', 'high', 'urgent']
- Due date: Cannot be in the past
- Estimated hours: >= 0 if provided

**Custom Methods**:

- `mark_done()`: Set status='done', completed_at=now()
- `get_time_spent()`: Sum of all time entries
- `is_overdue()`: True if due_date < today and status != 'done'
- `can_edit(user)`: Check if user can edit this task

---

### Board Model

**File**: `backend/apps/pm/models/board.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `project` (ForeignKey to Project, on_delete=CASCADE, related_name='boards')
- `name` (CharField, max_length=200, required)
- `is_default` (BooleanField, default=False) - Default board for project
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Project: Many-to-One with Project
- Columns: One-to-Many with Column

**Indexes**:

- `uuid` (unique)
- `project` (for project boards)

**Validation**:

- Name: Required, max 200 chars
- Only one default board per project

**Custom Methods**:

- `save()`: Ensure only one default board per project

---

### Column Model

**File**: `backend/apps/pm/models/column.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `board` (ForeignKey to Board, on_delete=CASCADE, related_name='columns')
- `name` (CharField, max_length=100, required)
- `order` (PositiveIntegerField, default=0) - Column position in board
- `wip_limit` (PositiveIntegerField, null=True, blank=True) - Work In Progress limit
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Board: Many-to-One with Board
- Tasks: One-to-Many with Task

**Indexes**:

- `uuid` (unique)
- `board` (for board columns)
- Composite: `['board', 'order']` (for column ordering)

**Validation**:

- Name: Required, max 100 chars
- Order: >= 0
- WIP limit: >= 0 if provided

**Custom Methods**:

- `get_task_count()`: Count of tasks in this column
- `is_wip_exceeded()`: True if task count > wip_limit (if set)

---

### Comment Model

**File**: `backend/apps/pm/models/comment.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `task` (ForeignKey to Task, on_delete=CASCADE, related_name='comments')
- `author` (ForeignKey to User, on_delete=CASCADE, related_name='task_comments')
- `content` (TextField, max_length=2000, required)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Task: Many-to-One with Task
- Author: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `task` (for task comments)
- `created_at` (for sorting)

**Validation**:

- Content: Required, max 2000 chars

---

### Attachment Model

**File**: `backend/apps/pm/models/attachment.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `task` (ForeignKey to Task, on_delete=CASCADE, related_name='attachments')
- `uploaded_by` (ForeignKey to User, on_delete=CASCADE, related_name='uploaded_attachments')
- `file` (FileField, upload_to='task_attachments/')
- `filename` (CharField, max_length=255) - Original filename
- `file_size` (PositiveIntegerField) - In bytes
- `mime_type` (CharField, max_length=100)
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Task: Many-to-One with Task
- Uploaded by: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `task` (for task attachments)

**Validation**:

- File: Max 25MB
- Allowed types: pdf, doc, docx, xls, xlsx, jpg, png, gif, zip

**Custom Methods**:

- `get_file_size_display()`: Human-readable file size (e.g., "2.5 MB")

---

### TimeEntry Model

**File**: `backend/apps/pm/models/time_entry.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `task` (ForeignKey to Task, on_delete=CASCADE, related_name='time_entries')
- `user` (ForeignKey to User, on_delete=CASCADE, related_name='time_entries')
- `hours` (DecimalField, max_digits=6, decimal_places=2, required) - Hours spent
- `description` (TextField, max_length=500, optional)
- `date` (DateField, default=date.today)
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Task: Many-to-One with Task
- User: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `task` (for task time entries)
- `user` (for user's time entries)
- `date` (for filtering by date)

**Validation**:

- Hours: Required, > 0, max 24 (per entry)
- Date: Cannot be in the future

**Custom Methods**:

- `get_billable_amount(hourly_rate)`: hours * hourly_rate

---

### Activity Model

**File**: `backend/apps/pm/models/activity.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `project` (ForeignKey to Project, on_delete=CASCADE, related_name='activities')
- `user` (ForeignKey to User, on_delete=SET_NULL, null=True, related_name='project_activities')
- `activity_type` (CharField, choices=['task_created', 'task_updated', 'task_deleted', 'comment_added', 'member_added', 'member_removed'], required)
- `task` (ForeignKey to Task, on_delete=CASCADE, null=True, blank=True, related_name='activities')
- `description` (TextField) - Human-readable description
- `metadata` (JSONField, default=dict) - Additional context (e.g., changed fields)
- `created_at` (DateTimeField, auto_now_add=True, indexed)

**Relationships**:

- Project: Many-to-One with Project
- User: Many-to-One with User
- Task: Many-to-One with Task (optional)

**Indexes**:

- `uuid` (unique)
- `project` (for project activity log)
- `created_at` (for chronological timeline)

**Validation**:

- Activity type: Must be one of predefined choices
- Description: Required

**Custom Methods**:

- `generate_description()`: Auto-generate human-readable description from activity_type + metadata

---

## API Endpoints

### Projects Endpoints

**Base URL**: `/api/pm/`

#### List/Create Projects

- **GET** `/api/pm/projects/` - List user's projects
  - Permissions: IsAuthenticated (projects where user is a member)
  - Query params: `?is_archived=false`
  - Response: List of projects

- **POST** `/api/pm/projects/` - Create new project
  - Permissions: IsAuthenticated
  - Request body: `{ name, description?, color? }`
  - Response: 201 Created (auto-creates owner membership + default board)

#### Retrieve/Update/Delete Project

- **GET** `/api/pm/projects/{uuid}/` - Get project details
  - Permissions: IsMember
  - Response: Full project with stats (member count, task count, completion %)

- **PATCH** `/api/pm/projects/{uuid}/` - Update project
  - Permissions: IsOwnerOrAdmin
  - Request body: Partial update
  - Response: 200 OK

- **DELETE** `/api/pm/projects/{uuid}/` - Delete project
  - Permissions: IsOwner
  - Response: 204 No Content

### Tasks Endpoints

- **GET** `/api/pm/projects/{project_uuid}/tasks/` - List project tasks
  - Permissions: IsMember
  - Query params: `?status=in_progress`, `?assignee={user_id}`, `?priority=high`
  - Response: Paginated list

- **POST** `/api/pm/projects/{project_uuid}/tasks/` - Create task
  - Permissions: IsMember
  - Request body: `{ title, description?, assignee_id?, status?, priority?, due_date?, estimated_hours? }`
  - Response: 201 Created

- **GET** `/api/pm/tasks/{uuid}/` - Get task details
  - Permissions: IsMember
  - Response: Full task with comments, attachments, time entries

- **PATCH** `/api/pm/tasks/{uuid}/` - Update task
  - Permissions: IsAssignee or IsOwnerOrAdmin
  - Request body: Partial update
  - Response: 200 OK

- **DELETE** `/api/pm/tasks/{uuid}/` - Delete task
  - Permissions: IsReporter or IsOwnerOrAdmin
  - Response: 204 No Content

### Boards & Columns Endpoints

- **GET** `/api/pm/projects/{project_uuid}/boards/` - List project boards
  - Permissions: IsMember
  - Response: List of boards with columns

- **POST** `/api/pm/projects/{project_uuid}/boards/` - Create board
  - Permissions: IsOwnerOrAdmin
  - Request body: `{ name, is_default? }`
  - Response: 201 Created

- **GET** `/api/pm/boards/{uuid}/` - Get board with columns and tasks
  - Permissions: IsMember
  - Response: Full board (columns with tasks ordered by column.order)

- **POST** `/api/pm/boards/{board_uuid}/columns/` - Create column
  - Permissions: IsOwnerOrAdmin
  - Request body: `{ name, order, wip_limit? }`
  - Response: 201 Created

- **PATCH** `/api/pm/columns/{uuid}/` - Update column
  - Permissions: IsOwnerOrAdmin
  - Request body: `{ name?, order?, wip_limit? }`
  - Response: 200 OK

- **POST** `/api/pm/tasks/{task_uuid}/move/` - Move task to different column
  - Permissions: IsMember
  - Request body: `{ column_uuid, order }`
  - Response: 200 OK (updates task.column and task.order, broadcasts WebSocket event)

### Comments Endpoints

- **GET** `/api/pm/tasks/{task_uuid}/comments/` - List task comments
  - Permissions: IsMember
  - Response: List of comments (chronological)

- **POST** `/api/pm/tasks/{task_uuid}/comments/` - Create comment
  - Permissions: IsMember
  - Request body: `{ content }`
  - Response: 201 Created

- **PATCH** `/api/pm/comments/{uuid}/` - Update comment
  - Permissions: IsAuthor
  - Request body: `{ content }`
  - Response: 200 OK

- **DELETE** `/api/pm/comments/{uuid}/` - Delete comment
  - Permissions: IsAuthor or IsOwnerOrAdmin
  - Response: 204 No Content

### Attachments Endpoints

- **POST** `/api/pm/tasks/{task_uuid}/attachments/` - Upload attachment
  - Permissions: IsMember
  - Request body: multipart/form-data with file
  - Response: 201 Created

- **DELETE** `/api/pm/attachments/{uuid}/` - Delete attachment
  - Permissions: IsUploader or IsOwnerOrAdmin
  - Response: 204 No Content

### Time Tracking Endpoints

- **GET** `/api/pm/tasks/{task_uuid}/time-entries/` - List task time entries
  - Permissions: IsMember
  - Response: List of time entries

- **POST** `/api/pm/tasks/{task_uuid}/time-entries/` - Log time
  - Permissions: IsMember
  - Request body: `{ hours, description?, date? }`
  - Response: 201 Created

- **PATCH** `/api/pm/time-entries/{uuid}/` - Update time entry
  - Permissions: IsAuthor
  - Request body: `{ hours?, description?, date? }`
  - Response: 200 OK

- **DELETE** `/api/pm/time-entries/{uuid}/` - Delete time entry
  - Permissions: IsAuthor or IsOwnerOrAdmin
  - Response: 204 No Content

### Activity Endpoints

- **GET** `/api/pm/projects/{project_uuid}/activities/` - Get project activity log
  - Permissions: IsMember
  - Response: Paginated list (chronological, newest first)

### Real-time Endpoints (WebSockets)

- **WS** `/ws/board/{board_uuid}/` - Real-time board updates
  - Permissions: IsMember
  - Events: `task_moved`, `task_created`, `task_updated`, `task_deleted`

---

## Frontend Components

### Component Hierarchy

```
ProjectsView
├── ProjectCard (name, color, stats, progress bar)
├── CreateProjectButton
└── CreateProjectModal

ProjectDetailView
├── ProjectHeader (name, color, description, members)
├── ProjectTabs (Board, List, Calendar, Activity, Settings)
├── BoardTab
│   ├── BoardSelector (if multiple boards)
│   └── KanbanBoard
│       ├── BoardColumn (name, WIP limit indicator)
│       │   └── TaskCard (draggable)
│       │       ├── TaskTitle
│       │       ├── TaskPriority (badge)
│       │       ├── TaskAssignee (avatar)
│       │       └── TaskDueDate
│       └── AddColumnButton
├── ListTab
│   ├── TaskFilters (status, assignee, priority)
│   └── TaskTable (sortable columns)
├── CalendarTab
│   └── TaskCalendar (tasks by due date)
├── ActivityTab
│   └── ActivityTimeline
│       └── ActivityItem (user, action, timestamp)
└── SettingsTab
    ├── ProjectForm (name, description, color)
    ├── MembersList (add, remove, change role)
    └── DeleteProjectButton

TaskDetailModal
├── TaskHeader (title, status, priority, assignee)
├── TaskDescription (editable)
├── TaskMetadata (due date, estimated hours, time spent)
├── TaskTabs (Comments, Attachments, Time, Activity)
├── CommentsTab
│   ├── CommentForm
│   └── CommentList
│       └── CommentItem
├── AttachmentsTab
│   ├── AttachmentUploader
│   └── AttachmentList
│       └── AttachmentItem (filename, size, download)
├── TimeTab
│   ├── LogTimeForm (hours, description, date)
│   ├── TimeEntriesList
│   │   └── TimeEntryItem (user, hours, date, description)
│   └── TotalTimeDisplay
└── ActivityTab
    └── TaskActivityList

CreateTaskModal
├── TaskForm
│   ├── TitleInput
│   ├── DescriptionTextarea
│   ├── AssigneeSelect
│   ├── StatusSelect
│   ├── PrioritySelect
│   └── DueDatePicker
└── CreateButton
```

### Key Composables

**`useProject.ts`**:

```typescript
export const useProject = (uuid: string) => {
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', uuid],
    queryFn: () => apiClient.pm.projectsRetrieve({ path: { uuid } })
  })

  const updateProject = useMutation({
    mutationFn: (data: UpdateProjectData) =>
      apiClient.pm.projectsPartialUpdate({ path: { uuid }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['project', uuid])
  })

  return { project, isLoading, updateProject }
}
```

**`useBoard.ts`**:

```typescript
export const useBoard = (boardUuid: string) => {
  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardUuid],
    queryFn: () => apiClient.pm.boardsRetrieve({ path: { uuid: boardUuid } })
  })

  const moveTask = useMutation({
    mutationFn: ({ taskUuid, columnUuid, order }: MoveTaskData) =>
      apiClient.pm.tasksMoveCreate({ path: { task_uuid: taskUuid }, body: { column_uuid: columnUuid, order } }),
    onSuccess: () => queryClient.invalidateQueries(['board', boardUuid])
  })

  // WebSocket for real-time updates
  const { lastMessage } = useWebSocket(`/ws/board/${boardUuid}/`)

  useEffect(() => {
    if (lastMessage?.data) {
      const event = JSON.parse(lastMessage.data)
      if (event.type === 'task_moved' || event.type === 'task_created') {
        queryClient.invalidateQueries(['board', boardUuid])
      }
    }
  }, [lastMessage])

  return { board, isLoading, moveTask }
}
```

**`useTask.ts`**:

```typescript
export const useTask = (uuid: string) => {
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', uuid],
    queryFn: () => apiClient.pm.tasksRetrieve({ path: { uuid } })
  })

  const updateTask = useMutation({
    mutationFn: (data: UpdateTaskData) =>
      apiClient.pm.tasksPartialUpdate({ path: { uuid }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['task', uuid])
  })

  return { task, isLoading, updateTask }
}
```

**`useTimeTracking.ts`**:

```typescript
export const useTimeTracking = (taskUuid: string) => {
  const { data: timeEntries } = useQuery({
    queryKey: ['time-entries', taskUuid],
    queryFn: () => apiClient.pm.tasksTimeEntriesList({ path: { task_uuid: taskUuid } })
  })

  const logTime = useMutation({
    mutationFn: (data: LogTimeData) =>
      apiClient.pm.tasksTimeEntriesCreate({ path: { task_uuid: taskUuid }, body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['time-entries', taskUuid])
      queryClient.invalidateQueries(['task', taskUuid]) // Update total time
    }
  })

  return { timeEntries, logTime }
}
```

---

## Validation Rules

### Task Validation

**Backend** (`apps/pm/serializers/task.py`):

```python
class TaskSerializer(serializers.ModelSerializer):
    def validate_due_date(self, value):
        if value and value < date.today():
            raise ValidationError("Due date cannot be in the past")
        return value

    def validate_estimated_hours(self, value):
        if value and value <= 0:
            raise ValidationError("Estimated hours must be greater than 0")
        return value
```

**Frontend Zod Schema** (`frontend/src/schemas/task.ts`):

```typescript
export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(5000).optional(),
  assignee_id: z.number().optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.date().min(new Date(), "Due date cannot be in the past").optional(),
  estimated_hours: z.number().positive().max(9999).optional()
})
```

### Time Entry Validation

**Backend**:

```python
class TimeEntrySerializer(serializers.ModelSerializer):
    def validate_hours(self, value):
        if value <= 0:
            raise ValidationError("Hours must be greater than 0")
        if value > 24:
            raise ValidationError("Cannot log more than 24 hours in a single entry")
        return value

    def validate_date(self, value):
        if value > date.today():
            raise ValidationError("Cannot log time for future dates")
        return value
```

**Frontend Zod Schema**:

```typescript
export const timeEntrySchema = z.object({
  hours: z.number().positive().max(24, "Cannot log more than 24 hours"),
  description: z.string().max(500).optional(),
  date: z.date().max(new Date(), "Cannot log time for future dates")
})
```

---

## Test Coverage Requirements

### Backend Tests

**Models** (`apps/pm/tests/test_models.py`):

- Project creation with auto-provisioning (owner membership + default board)
- Task completion percentage calculation
- Board default constraint (only one per project)
- Column task count and WIP limit check
- Time entry billable calculation

**Serializers** (`apps/pm/tests/test_serializers.py`):

- Task due date validation (not in past)
- Time entry hours validation (> 0, <= 24)
- Project member uniqueness

**ViewSets** (`apps/pm/tests/test_viewsets.py`):

- List user's projects
- Create task with assignment
- Move task between columns (updates order)
- Log time entry
- WebSocket board updates

**Permissions** (`apps/pm/tests/test_permissions.py`):

- Only project members can view project
- Only owner can delete project
- Only owner/admin can add members
- Only assignee/owner/admin can edit tasks

**Minimum Coverage**: 90%

### Frontend Tests

**Components** (`frontend/src/components/pm/*.test.ts`):

- TaskCard drag-and-drop
- KanbanBoard renders columns
- LogTimeForm validation
- ActivityTimeline displays correctly

**Composables** (`frontend/src/composables/*.test.ts`):

- useBoard real-time updates
- useTask CRUD operations
- useTimeTracking log time

**Views** (`frontend/src/views/pm/*.test.ts`):

- ProjectDetailView tabs
- TaskDetailModal displays data

**Minimum Coverage**: 85%

---

## Performance Considerations

### Database Optimizations

- Use `select_related('assignee', 'reporter', 'project')` for task queries
- Use `prefetch_related('comments', 'attachments', 'time_entries')` for task detail
- Index on `column` + `order` for board queries
- Composite index on `['project', 'status']` for task filtering

### Caching Strategy

- Cache project dashboard: 5 minutes
- Cache board with tasks: 2 minutes (invalidate on task move)
- Cache activity log: 1 minute

### Real-time Scaling

- Use Redis Pub/Sub for WebSocket fanout
- Broadcast only to board members (not entire project)
- Batch task move events (debounce 200ms)

---

## Security Considerations

### Permissions

- Only project members can view project/tasks
- Only owner can delete project
- Only owner/admin can manage members
- Only assignee/owner/admin can edit tasks

### Rate Limiting

- Task creation: 100 per hour per user
- Time logging: 50 per hour per user
- File upload: 20 per hour per user

---

## Estimated Complexity

**Models**: 8 (Project, ProjectMember, Task, Board, Column, Comment, Attachment, TimeEntry, Activity)
**API Endpoints**: 30
**WebSocket Endpoints**: 1
**Frontend Components**: 28
**Estimated Sessions**: 14
**Estimated Time**: 41 hours
**Test Count**: ~700 tests
