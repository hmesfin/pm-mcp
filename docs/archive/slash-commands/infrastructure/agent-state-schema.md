# Agent State Schema

**Purpose**: Define the structure for tracking agent execution progress

**Location**: `project-plans/<app-name>/.agent-state.json`

**Version**: 1.0

---

## Schema Definition

```typescript
interface AgentState {
  // Project metadata
  project_name: string                    // e.g., "my-blog"
  app_type: string                        // e.g., "blog", "ecommerce", "saas"
  plan_version: string                    // e.g., "1.0"

  // Execution tracking
  execution_started_at: string            // ISO 8601 timestamp
  last_updated_at: string                 // ISO 8601 timestamp
  status: ExecutionStatus                 // "not_started" | "in_progress" | "completed" | "paused" | "error"

  // Current position
  current_phase: number                   // 1-based (1, 2, 3, 4)
  current_session: number | null          // 1-based (1, 2, 3...) or null if no active session

  // Phases and sessions
  phases: Phase[]

  // Blockers and issues
  blockers: Blocker[]

  // Notes and metadata
  notes: string
}

interface Phase {
  number: number                          // 1, 2, 3, 4
  name: string                            // "Backend Foundation", "Frontend Foundation"
  status: PhaseStatus                     // "not_started" | "in_progress" | "completed"
  sessions: Session[]
  started_at: string | null               // ISO 8601 timestamp
  completed_at: string | null             // ISO 8601 timestamp
}

interface Session {
  number: number                          // 1, 2, 3...
  title: string                           // "Models + Admin", "Serializers + ViewSets"
  status: SessionStatus                   // See SessionStatus enum below

  // Timing
  started_at: string | null               // ISO 8601 timestamp
  completed_at: string | null             // ISO 8601 timestamp
  estimated_hours: number                 // e.g., 2.5
  actual_hours: number | null             // Calculated from started_at to completed_at

  // Current checkpoint
  checkpoint: CheckpointType | null       // Where execution is paused

  // TDD phase tracking
  current_tdd_phase: TDDPhase | null      // "red" | "green" | "refactor" | null

  // Test metrics
  tests_written: number                   // Count of tests written
  tests_passing: number                   // Count of tests passing
  coverage: number | null                 // Percentage (0-100)

  // Git tracking
  commit_hash: string | null              // e.g., "a1b2c3d"
  branch: string | null                   // e.g., "feature/blog-models"

  // Files created/modified
  files_modified: string[]                // List of file paths

  // Dependencies
  depends_on: number[]                    // List of session numbers that must complete first
  blocks: number[]                        // List of session numbers that depend on this one

  // Error tracking
  errors: SessionError[]
  retry_count: number                     // Number of times session was retried
}

interface Blocker {
  id: string                              // Unique ID (UUID)
  type: BlockerType                       // "dependency" | "test_failure" | "build_error" | "merge_conflict"
  severity: "critical" | "high" | "medium" | "low"
  session_number: number                  // Which session is blocked
  description: string                     // Human-readable description
  details: string                         // Technical details (stack trace, error message)
  created_at: string                      // ISO 8601 timestamp
  resolved_at: string | null              // ISO 8601 timestamp
  resolution: string | null               // How it was resolved
}

interface SessionError {
  type: ErrorType                         // "test_failure" | "type_error" | "migration_error" | "import_error"
  message: string                         // Error message
  stack_trace: string | null              // Full stack trace
  occurred_at: string                     // ISO 8601 timestamp
  auto_fixed: boolean                     // Whether agent auto-fixed it
  fix_description: string | null          // How it was fixed
}

// Enums

enum ExecutionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  PAUSED = "paused",
  ERROR = "error"
}

enum PhaseStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

enum SessionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  RED_PHASE = "red_phase",                // Tests written, failing
  GREEN_PHASE = "green_phase",            // Implementation done, tests passing
  REFACTOR_PHASE = "refactor_phase",      // Refactoring in progress
  AWAITING_APPROVAL = "awaiting_approval", // At checkpoint, waiting for user
  COMPLETED = "completed",
  BLOCKED = "blocked",                    // Cannot proceed
  SKIPPED = "skipped",                    // User chose to skip
  ERROR = "error"                         // Encountered unrecoverable error
}

enum CheckpointType {
  BEFORE_START = "before_start",
  AFTER_RED = "after_red",
  AFTER_GREEN = "after_green",
  AFTER_REFACTOR = "after_refactor",
  SESSION_COMPLETE = "session_complete"
}

enum TDDPhase {
  RED = "red",       // Writing tests
  GREEN = "green",   // Implementing to pass tests
  REFACTOR = "refactor" // Improving code quality
}

enum BlockerType {
  DEPENDENCY = "dependency",             // Waiting for another session
  TEST_FAILURE = "test_failure",         // Tests unexpectedly failing
  BUILD_ERROR = "build_error",           // Compilation/build error
  MERGE_CONFLICT = "merge_conflict",     // Git conflict
  MISSING_DEPENDENCY = "missing_dependency", // npm/pip package missing
  DATABASE_ERROR = "database_error"      // Migration or DB issue
}

enum ErrorType {
  TEST_FAILURE = "test_failure",
  TYPE_ERROR = "type_error",
  MIGRATION_ERROR = "migration_error",
  IMPORT_ERROR = "import_error",
  VALIDATION_ERROR = "validation_error",
  RUNTIME_ERROR = "runtime_error"
}
```

---

## Example State File

**Scenario**: Blog app, Phase 1 Session 1 complete, Session 2 in RED phase

```json
{
  "project_name": "my-blog",
  "app_type": "blog",
  "plan_version": "1.0",

  "execution_started_at": "2025-11-16T09:00:00Z",
  "last_updated_at": "2025-11-16T10:45:00Z",
  "status": "in_progress",

  "current_phase": 1,
  "current_session": 2,

  "phases": [
    {
      "number": 1,
      "name": "Backend Foundation",
      "status": "in_progress",
      "started_at": "2025-11-16T09:00:00Z",
      "completed_at": null,
      "sessions": [
        {
          "number": 1,
          "title": "Models + Admin",
          "status": "completed",
          "started_at": "2025-11-16T09:00:00Z",
          "completed_at": "2025-11-16T10:30:00Z",
          "estimated_hours": 2.5,
          "actual_hours": 1.5,
          "checkpoint": null,
          "current_tdd_phase": null,
          "tests_written": 72,
          "tests_passing": 72,
          "coverage": 93,
          "commit_hash": "a1b2c3d4e5f",
          "branch": "main",
          "files_modified": [
            "backend/apps/blog/models.py",
            "backend/apps/blog/admin.py",
            "backend/apps/blog/tests/test_models.py",
            "backend/apps/blog/migrations/0001_initial.py"
          ],
          "depends_on": [],
          "blocks": [2],
          "errors": [],
          "retry_count": 0
        },
        {
          "number": 2,
          "title": "Serializers + ViewSets",
          "status": "awaiting_approval",
          "started_at": "2025-11-16T10:35:00Z",
          "completed_at": null,
          "estimated_hours": 3.5,
          "actual_hours": null,
          "checkpoint": "after_red",
          "current_tdd_phase": "red",
          "tests_written": 90,
          "tests_passing": 0,
          "coverage": null,
          "commit_hash": null,
          "branch": "main",
          "files_modified": [
            "backend/apps/blog/tests/test_serializers.py",
            "backend/apps/blog/tests/test_viewsets.py"
          ],
          "depends_on": [1],
          "blocks": [3, 4, 5],
          "errors": [],
          "retry_count": 0
        }
      ]
    },
    {
      "number": 2,
      "name": "Frontend Foundation",
      "status": "not_started",
      "started_at": null,
      "completed_at": null,
      "sessions": []
    }
  ],

  "blockers": [],

  "notes": "Session 1 completed successfully. Session 2 in RED phase - tests written and failing as expected. Awaiting approval to implement serializers."
}
```

---

## State Transitions

### Session Status Transitions

```
not_started
    ↓
in_progress
    ↓
red_phase → awaiting_approval (checkpoint: after_red)
    ↓
green_phase → awaiting_approval (checkpoint: after_green)
    ↓
refactor_phase → awaiting_approval (checkpoint: after_refactor)
    ↓
awaiting_approval (checkpoint: session_complete)
    ↓
completed
```

**Alternative paths**:
- Any state → `blocked` (if blocker encountered)
- Any state → `error` (if unrecoverable error)
- Any state → `skipped` (if user chooses to skip)
- `awaiting_approval` → previous state (if user requests changes)

### Execution Status Transitions

```
not_started → in_progress → completed
              ↓           ↓
            paused      error
```

---

## File Operations

### Initialize State

When starting execution for first time:

```typescript
function initializeState(projectName: string, appType: string): AgentState {
  return {
    project_name: projectName,
    app_type: appType,
    plan_version: "1.0",
    execution_started_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    status: "in_progress",
    current_phase: 1,
    current_session: null,
    phases: loadPhasesFromPlan(),  // Parse PHASE_*.md files
    blockers: [],
    notes: ""
  };
}
```

### Load State

```typescript
function loadState(projectName: string): AgentState | null {
  const path = `project-plans/${projectName}/.agent-state.json`;
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}
```

### Save State

```typescript
function saveState(state: AgentState): void {
  const path = `project-plans/${state.project_name}/.agent-state.json`;
  state.last_updated_at = new Date().toISOString();
  fs.writeFileSync(path, JSON.stringify(state, null, 2));
}
```

### Update Session

```typescript
function updateSession(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  updates: Partial<Session>
): void {
  const phase = state.phases.find(p => p.number === phaseNumber);
  if (!phase) throw new Error(`Phase ${phaseNumber} not found`);

  const session = phase.sessions.find(s => s.number === sessionNumber);
  if (!session) throw new Error(`Session ${sessionNumber} not found`);

  Object.assign(session, updates);
  saveState(state);
}
```

---

## Validation Rules

### Required Fields

When creating state:
- `project_name` must not be empty
- `app_type` must be one of known types (blog, ecommerce, saas, social, projectmanagement)
- `plan_version` must match expected format

When completing session:
- `commit_hash` must be set
- `tests_passing` must equal `tests_written`
- `coverage` must be >= 85% (frontend) or >= 90% (backend)

### Constraints

- `current_phase` must be <= total phases
- `current_session` must exist in current phase
- Session cannot be `completed` if depends_on sessions are not `completed`
- `actual_hours` must be >= 0 if set
- `coverage` must be 0-100 if set
- `retry_count` must be >= 0

---

## Usage by Agents

Agents should:

1. **Load state at start**:
   ```
   state = loadState(project_name)
   if state is null:
     state = initializeState(project_name, app_type)
   ```

2. **Update state at each checkpoint**:
   ```
   updateSession(state, phase, session, {
     status: "awaiting_approval",
     checkpoint: "after_red",
     tests_written: 72,
     tests_passing: 0
   })
   ```

3. **Save state after user approval**:
   ```
   updateSession(state, phase, session, {
     status: "green_phase",
     checkpoint: null,
     current_tdd_phase: "green"
   })
   ```

4. **Mark session complete**:
   ```
   updateSession(state, phase, session, {
     status: "completed",
     completed_at: new Date().toISOString(),
     tests_passing: 72,
     coverage: 93,
     commit_hash: getGitCommitHash()
   })
   ```

5. **Record errors**:
   ```
   session.errors.push({
     type: "test_failure",
     message: "test_post_slug_generation failed",
     stack_trace: "...",
     occurred_at: new Date().toISOString(),
     auto_fixed: false,
     fix_description: null
   })
   saveState(state)
   ```

---

## State File Location

**Convention**: `project-plans/<app-name>/.agent-state.json`

**Examples**:
- `project-plans/my-blog/.agent-state.json`
- `project-plans/acme-store/.agent-state.json`
- `project-plans/team-collab/.agent-state.json`

**Git**: Should be committed to track progress history

---

## Future Enhancements

- [ ] Add performance metrics (test execution time, build time)
- [ ] Add code quality metrics (cyclomatic complexity, maintainability index)
- [ ] Add resource usage tracking (memory, CPU)
- [ ] Add collaboration tracking (multiple agents working in parallel)
- [ ] Add rollback history (list of reverted commits)
- [ ] Add user feedback/ratings per session
