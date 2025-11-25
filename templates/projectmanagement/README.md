# Project Management Template

Production-ready project management platform template with projects, tasks, boards, and team collaboration.

## What's Included

**Core Features**:
- ✅ Projects with members and permissions
- ✅ Tasks with assignments, due dates, priorities
- ✅ Kanban boards with drag-and-drop
- ✅ Task comments and attachments
- ✅ Project dashboard with metrics
- ✅ Activity timeline
- ✅ Search and filtering

**Technical Features**:
- ✅ Real-time board updates (WebSockets)
- ✅ Drag-and-drop API endpoints
- ✅ File attachments (S3/local storage)
- ✅ Email notifications (task assignments)
- ✅ Activity logging
- ✅ Redis caching for dashboards

## Customization Options

### 1. Time Tracking?
**Default**: No

- **No**: Just task management
- **Yes**: Track time spent on tasks, time reports
- **Impact**: +2 sessions, +50 tests, +5 hours

### 2. Gantt Charts?
**Default**: No

- **No**: Kanban boards only
- **Yes**: Gantt chart view with dependencies
- **Impact**: +3 sessions, +60 tests, +7 hours

### 3. Team Collaboration Level?
**Default**: Basic (comments only)

- **Basic**: Task comments only
- **Advanced**: Comments + mentions + real-time chat per project
- **Impact**: +2 sessions, +40 tests, +4 hours

## Complexity Variants

### Basic (Simple Task Manager)
**Config**: No time tracking, No Gantt, Basic collaboration
- **Sessions**: 12
- **Time**: 36 hours
- **Tests**: ~650

### Intermediate (Recommended - Default)
**Config**: Yes time tracking, No Gantt, Basic collaboration
- **Sessions**: 14
- **Time**: 41 hours
- **Tests**: ~700

### Advanced (Full PM Suite)
**Config**: Yes time tracking, Yes Gantt, Advanced collaboration
- **Sessions**: 19
- **Time**: 57 hours
- **Tests**: ~850

## Models Summary

| Model | Description | Key Relationships |
|-------|-------------|------------------|
| Project | Project container | User (members), Tasks |
| Task | Individual tasks | Project, User (assignee) |
| Board | Kanban board | Project, Columns |
| Column | Board columns | Board, Tasks |
| Comment | Task comments | Task, User |
| Attachment | File uploads | Task |
| TimeEntry | Time tracking (if enabled) | Task, User |
| Activity | Audit log | Project, User |

## Mobile Support

### Recommended Mobile Features (Selective)

**Include**:
- ✅ View projects and tasks
- ✅ Update task status (drag-and-drop on mobile)
- ✅ Add comments
- ✅ Create quick tasks
- ✅ Receive notifications

**Exclude**:
- ❌ Project settings (use web)
- ❌ Gantt chart view (use web - complex UI)
- ❌ Bulk operations (use web)
- ❌ Advanced reporting (use web)

**Mobile-Specific**:
- ✅ Push notifications (task assignments, mentions)
- ✅ Offline task viewing (cache active tasks)
- ✅ Camera (attach photos to tasks)
- ✅ Voice notes (quick task notes)

## Board Views

**Included**:
- Kanban board (drag-and-drop columns)
- List view (table with sorting/filtering)
- Calendar view (tasks by due date)

**Optional** (if Gantt enabled):
- Gantt chart (timeline with dependencies)

## Example Use Cases

### Example 1: Simple To-Do Manager
**Use Case**: Personal task tracking

**Config**:
- Time Tracking: No
- Gantt Charts: No
- Collaboration: Basic

**Result**: 12 sessions, 36 hours, lightweight

---

### Example 2: Agency Project Tracker
**Use Case**: Track client projects with time billing

**Config**:
- Time Tracking: Yes
- Gantt Charts: No
- Collaboration: Basic

**Result**: 14 sessions, 41 hours, billable hours

---

### Example 3: Enterprise PM Tool
**Use Case**: Complex projects with dependencies

**Config**:
- Time Tracking: Yes
- Gantt Charts: Yes
- Collaboration: Advanced

**Result**: 19 sessions, 57 hours, full PM suite

## Task States

**Default Workflow**:
1. **Backlog** - Not yet started
2. **To Do** - Ready to work on
3. **In Progress** - Currently working
4. **Review** - Awaiting review
5. **Done** - Completed

**Customizable**: Add/remove states per project

## Priority Levels

- 🔴 **Urgent** - Immediate attention
- 🟠 **High** - Important, short deadline
- 🟡 **Medium** - Normal priority
- 🟢 **Low** - Nice to have

## Getting Started

1. Run `/plan-app` in Claude Code
2. Select "Project Management" template
3. Answer customization questions
4. Review generated plans
5. Start building!

## Required External Services

- **Redis** (for real-time board updates)
- **Celery** (for email notifications)
- **Email Service** (SendGrid, Mailgun)
- **File Storage** (S3, CloudFlare R2 - optional)

## Post-Template Enhancements

1. **Subtasks**: Break down tasks into smaller pieces
2. **Templates**: Project/task templates
3. **Recurring tasks**: Automated task creation
4. **Dependencies**: Task relationships (blocked by, blocks)
5. **Labels/Tags**: Categorize tasks
6. **Milestones**: Project goals with deadlines
7. **Reports**: Burndown charts, velocity, time reports
8. **Integrations**: GitHub, Slack, Google Calendar
9. **Automation**: Rules (when X happens, do Y)
10. **Custom fields**: Add custom data to tasks

## Support

See: `.claude/PLANNING_GUIDE.md`
