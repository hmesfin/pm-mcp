# Agent Execution Infrastructure

This directory contains the core infrastructure for automated plan execution with TDD enforcement and human-in-the-loop checkpoints.

## Overview

The infrastructure enables agents to automatically execute project plans session-by-session, following strict TDD (RED-GREEN-REFACTOR) workflows with user approval at key checkpoints.

**Philosophy**: "Good plans enable agent execution" - Transform planning from manual work to automated execution.

## Architecture

```
┌─────────────────┐
│  Slash Commands │  /initialize-project, /execute-session, /show-progress
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Orchestrator  │  Coordinates session execution
└────────┬────────┘
         │
         ├──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │Backend │ │Frontend│ │ Mobile │ │  E2E   │  SessionExecutors
    │Builder │ │Builder │ │Builder │ │Tester  │
    └────────┘ └────────┘ └────────┘ └────────┘
         │
         ▼
┌─────────────────┐
│  State Manager  │  Persistence & tracking
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│.agent-state.json│  Current execution state
└─────────────────┘
```

## Core Components

### 1. State Management (`state-manager.ts`)

Manages execution state persistence and tracking.

**Key Functions**:
- `initializeState(projectName, appType)` - Create new state
- `loadState(projectName)` - Load existing state
- `saveState(state)` - Persist state to disk
- `updateSession(state, phase, session, updates)` - Update session data
- `startSession(state, phase, session)` - Begin session execution
- `markSessionComplete(state, phase, session, metrics)` - Complete session
- `setCheckpoint(state, phase, session, checkpoint, tddPhase)` - Pause at checkpoint
- `getProgress(state)` - Calculate execution metrics

**State File Location**: `project-plans/<app-name>/.agent-state.json`

**Example**:
```typescript
import { initializeState, loadState, saveState } from './state-manager'

// Initialize new project
const state = initializeState('my-blog', 'blog')

// Load existing state
const state = loadState('my-blog')

// Update session
updateSession(state, 1, 1, {
  tests_written: 72,
  tests_passing: 0
})
```

### 2. Plan Parser (`plan-parser.ts`)

Parses PROJECT_PLAN.md markdown files into structured Phase/Session data.

**Key Functions**:
- `parsePlan(planPath)` - Parse plan file
- `parsePlanForApp(appType)` - Parse template plan
- `validatePlan(phases)` - Validate dependencies

**Features**:
- Multi-pass parsing (sessions → dependencies → phases)
- Extracts estimated hours, test counts
- Parses Mermaid dependency graphs
- Builds bidirectional dependencies (depends_on, blocks)
- Validates for gaps, circular deps, invalid references

**Example**:
```typescript
import { parsePlanForApp, validatePlan } from './plan-parser'

// Parse blog template plan
const phases = parsePlanForApp('blog')

// Validate
validatePlan(phases)

// phases[0].sessions[0] = {
//   number: 1,
//   title: "Models + Admin",
//   estimated_hours: 2.5,
//   depends_on: [],
//   blocks: [2]
// }
```

### 3. Checkpoint Manager (`checkpoint-manager.ts`)

Manages human-in-the-loop checkpoints during execution.

**Checkpoint Types**:
1. **BEFORE_START** - User approves session start
2. **AFTER_RED** - User reviews failing tests, approves implementation
3. **AFTER_GREEN** - User reviews passing tests, approves refactoring
4. **AFTER_REFACTOR** - User reviews refactored code, approves commit
5. **SESSION_COMPLETE** - User reviews commit, chooses next action

**Key Functions**:
- `createBeforeStartCheckpoint(state, phase, session)` - Create checkpoint data
- `createAfterRedCheckpoint(...)` - With test metrics
- `createAfterGreenCheckpoint(...)` - With coverage metrics
- `createAfterRefactorCheckpoint(...)` - With improvements
- `createSessionCompleteCheckpoint(...)` - With commit info
- `activateCheckpoint(state, checkpointData)` - Set checkpoint in state
- `handleCheckpointResponse(state, checkpointData, option)` - Process user choice
- `formatCheckpointForDisplay(checkpointData)` - Format for user

**Example**:
```typescript
import { createAfterRedCheckpoint, formatCheckpointForDisplay } from './checkpoint-manager'

// Create checkpoint after RED phase
const checkpoint = createAfterRedCheckpoint(
  state,
  1, // phase number
  1, // session number
  72, // tests written
  72, // tests failing
  ['backend/apps/blog/tests/test_models.py'],
  [] // code samples
)

// Display to user
const display = formatCheckpointForDisplay(checkpoint)
console.log(display)

// checkpoint.options = [
//   { label: "Implement", action: "proceed" },
//   { label: "Revise Tests", action: "modify" },
//   { label: "Skip Session", action: "skip" }
// ]
```

### 4. Execution Orchestrator (`execution-orchestrator.ts`)

Coordinates session execution through TDD workflow.

**Key Classes**:
- `ExecutionOrchestrator` - Main orchestrator
- `SessionExecutor` (interface) - Implemented by backend/frontend/mobile builders

**Execution Flow**:
1. Load/initialize state
2. For each phase/session:
   - CHECKPOINT: BEFORE_START
   - RED phase (write tests)
   - CHECKPOINT: AFTER_RED
   - GREEN phase (implement)
   - CHECKPOINT: AFTER_GREEN
   - REFACTOR phase (improve)
   - CHECKPOINT: AFTER_REFACTOR
   - Create git commit
   - CHECKPOINT: SESSION_COMPLETE
3. Update state
4. Continue to next session

**Example**:
```typescript
import { ExecutionOrchestrator } from './execution-orchestrator'
import { BackendExecutor } from './backend-executor'

const orchestrator = new ExecutionOrchestrator({
  project_name: 'my-blog',
  app_type: 'blog',
  resume: false
})

// Set executor
const backendExecutor = new BackendExecutor()
orchestrator.setExecutor(backendExecutor)

// Initialize and execute
await orchestrator.initialize()
const result = await orchestrator.execute()

console.log(`Completed ${result.sessions_completed}/${result.sessions_total} sessions`)
```

### 5. Backend Executor (`backend-executor.ts`)

Implements SessionExecutor interface for Django/DRF sessions.

**Key Methods**:
- `executeRedPhase(state, phase, session)` - Write tests
- `executeGreenPhase(state, phase, session)` - Implement
- `executeRefactorPhase(state, phase, session)` - Refactor
- `createCommit(state, phase, session)` - Git commit

**Responsibilities**:
- Build prompts for backend-builder agent
- Launch agent via Task tool (Phase 3.2)
- Parse agent results
- Return metrics (tests, coverage, files)

### 6. Types (`types.ts`)

Complete TypeScript type definitions for all components.

**Key Types**:
- `AgentState` - Top-level state structure
- `Phase` - Phase with sessions
- `Session` - Session with TDD tracking
- `Blocker` - Execution blocker
- `SessionError` - Error tracking

**Key Enums**:
- `ExecutionStatus` - not_started, in_progress, completed, paused, error
- `PhaseStatus` - not_started, in_progress, completed
- `SessionStatus` - not_started, red_phase, green_phase, refactor_phase, awaiting_approval, completed, blocked, skipped, error
- `CheckpointType` - before_start, after_red, after_green, after_refactor, session_complete
- `TDDPhase` - red, green, refactor

## Slash Commands

### `/initialize-project <project-name> <app-type>`

Initialize project execution state from plan.

**What it does**:
1. Validates project and app type
2. Parses PROJECT_PLAN.md
3. Creates `.agent-state.json`
4. Shows project summary

**Example**:
```bash
/initialize-project my-blog blog
```

### `/execute-session <project-name> <session-number>`

Execute a single session with TDD workflow.

**What it does**:
1. Loads state
2. Validates dependencies
3. Executes RED-GREEN-REFACTOR with checkpoints
4. Creates git commit
5. Updates state

**Example**:
```bash
/execute-session my-blog 1
```

### `/show-progress <project-name>`

Display execution progress and metrics.

**What it does**:
1. Loads state
2. Calculates metrics (sessions, tests, coverage, time)
3. Shows phase/session status
4. Identifies blockers
5. Shows next steps

**Example**:
```bash
/show-progress my-blog
```

## Execution Workflow

### Complete Example: Blog Session 1 (Models + Admin)

```bash
# 1. User creates plan
/plan-app
# Select: blog template
# Creates: project-plans/my-blog/PROJECT_PLAN.md

# 2. User initializes execution
/initialize-project my-blog blog
# Creates: project-plans/my-blog/.agent-state.json

# 3. User starts Session 1
/execute-session my-blog 1

# Output:
# ┌─────────────────────────────────────────────┐
# │ CHECKPOINT: BEFORE START                    │
# │ Session 1: Models + Admin                   │
# └─────────────────────────────────────────────┘
#
# Ready to start? This will:
# - Write tests for Post, Comment, Category, Tag models
# - Estimated time: ~45 minutes
#
# 1. ✅ Start Session
# 2. ⏭️  Skip Session
# 3. ⏸️  Pause

# User chooses: Start Session

# [Agent executes RED phase - writes tests]

# Output:
# ┌─────────────────────────────────────────────┐
# │ ✓ RED PHASE COMPLETE                        │
# │                                              │
# │ Tests written: 72                            │
# │ Tests failing: 72 (expected!)                │
# │                                              │
# │ Files created:                               │
# │   - backend/apps/blog/tests/test_models.py   │
# │                                              │
# │ Sample tests:                                │
# │   - test_create_post_with_valid_data         │
# │   - test_post_title_required                 │
# │   - test_post_slug_auto_generated            │
# └─────────────────────────────────────────────┘
#
# 1. ✅ Proceed to GREEN phase (implement)
# 2. 🔄 Revise tests
# 3. ⏭️  Skip this session

# User chooses: Proceed

# [Agent executes GREEN phase - implements models]

# Output:
# ┌─────────────────────────────────────────────┐
# │ ✓ GREEN PHASE COMPLETE                      │
# │                                              │
# │ Tests: 72/72 passing                         │
# │ Coverage: 93%                                │
# │                                              │
# │ Files created:                               │
# │   - backend/apps/blog/models.py              │
# │   - backend/apps/blog/admin.py               │
# │   - backend/apps/blog/migrations/0001_...py  │
# └─────────────────────────────────────────────┘
#
# 1. ✅ Proceed to REFACTOR phase
# 2. ✅ Skip refactor (code is good)
# 3. 🔄 Modify implementation

# User chooses: Proceed to REFACTOR

# [Agent executes REFACTOR phase - improves code]

# Output:
# ┌─────────────────────────────────────────────┐
# │ ✓ REFACTOR PHASE COMPLETE                   │
# │                                              │
# │ Improvements:                                │
# │   ✓ Added docstrings to all models           │
# │   ✓ Added type hints to all methods          │
# │   ✓ Optimized queries with indexes           │
# │                                              │
# │ Tests: 72/72 passing                         │
# │ Coverage: 93%                                │
# └─────────────────────────────────────────────┘
#
# 1. ✅ Commit & Continue
# 2. 🔄 Further refactoring

# User chooses: Commit

# [Agent creates git commit]

# Output:
# ┌─────────────────────────────────────────────┐
# │ ✓ SESSION 1 COMPLETE                        │
# │                                              │
# │ Tests: 72/72 passing                         │
# │ Coverage: 93%                                │
# │ Time: 1.5h (estimated: 2.5h)                 │
# │ Commit: a1b2c3d                              │
# │                                              │
# │ Progress: 1/11 sessions complete (9%)        │
# └─────────────────────────────────────────────┘
#
# 1. ✅ Continue to Session 2
# 2. ⏸️  Pause execution

# User chooses: Continue

# [Process repeats for Session 2...]
```

## Design Patterns

### 1. Template Method Pattern

The orchestrator defines the execution skeleton (RED → GREEN → REFACTOR → COMMIT), but delegates implementation to executors.

```typescript
// Orchestrator defines workflow
async executeSession(phase, session) {
  await this.executor.executeRedPhase(...)
  await checkpoint()
  await this.executor.executeGreenPhase(...)
  await checkpoint()
  await this.executor.executeRefactorPhase(...)
  await checkpoint()
  await this.executor.createCommit(...)
}

// Executors implement specifics
class BackendExecutor implements SessionExecutor {
  async executeRedPhase(...) {
    // Django-specific test writing
  }
}

class FrontendExecutor implements SessionExecutor {
  async executeRedPhase(...) {
    // Vue-specific test writing
  }
}
```

### 2. State Machine Pattern

Checkpoints enforce valid state transitions:

```
not_started → in_progress → red_phase → green_phase → refactor_phase → completed
                   ↓            ↓            ↓              ↓
                blocked      blocked      blocked        blocked
                   ↓            ↓            ↓              ↓
                error        error        error          error
```

### 3. Strategy Pattern

Different executors for different session types (backend vs frontend vs mobile).

## File Locations

```
.claude/infrastructure/
├── README.md                       # This file
├── types.ts                        # TypeScript type definitions
├── state-manager.ts                # State persistence
├── plan-parser.ts                  # Markdown → structured data
├── checkpoint-manager.ts           # Checkpoint system
├── execution-orchestrator.ts       # Orchestration framework
├── backend-executor.ts             # Backend implementation
└── agent-state-schema.md           # Schema documentation

.claude/commands/
├── initialize-project.md           # /initialize-project command
├── execute-session.md              # /execute-session command
└── show-progress.md                # /show-progress command

.claude/agents/
└── backend-builder.md              # Backend agent specification

project-plans/<app-name>/
├── PROJECT_PLAN.md                 # Session plan (input)
├── REQUIREMENTS.md                 # Technical specs (input)
└── .agent-state.json               # Execution state (output)
```

## Validation Rules

### Session Completion

A session can only be marked complete if:
- `tests_passing === tests_written` (all tests pass)
- `coverage >= MIN_COVERAGE` (90% backend, 85% frontend)
- `commit_hash` is set (git commit created)
- All `depends_on` sessions are complete

### Dependency Enforcement

A session can only start if:
- All `depends_on` sessions have `status === 'completed'`
- No circular dependencies exist
- All dependency references are valid

### State Transitions

Valid session status transitions:
- `not_started` → `in_progress`
- `in_progress` → `red_phase`
- `red_phase` → `green_phase` (or `blocked`, `error`)
- `green_phase` → `refactor_phase` (or `blocked`, `error`)
- `refactor_phase` → `completed` (or `blocked`, `error`)
- Any state → `awaiting_approval` (at checkpoints)

## Error Handling

### Test Failures

If tests fail during GREEN phase:
1. Record error in `session.errors[]`
2. Increment `retry_count`
3. If `retry_count > MAX_RETRIES` (2):
   - Mark session as `error`
   - Create blocker
4. Else:
   - Show error to user
   - Ask: "Retry GREEN phase?"

### Blockers

Create blocker for:
- **dependency**: Waiting for another session
- **test_failure**: Tests unexpectedly failing
- **build_error**: Compilation error
- **merge_conflict**: Git conflict
- **missing_dependency**: Package missing
- **database_error**: Migration issue

Blocker fields:
- `type`, `severity`, `session_number`, `description`, `details`
- `created_at`, `resolved_at`, `resolution`

## Next Steps

**Phase 3.2 (Current)**: Implement backend-builder agent
- Integrate with Task tool to launch agent
- Test with blog Session 1 (Models + Admin)
- Handle checkpoints and user responses

**Phase 3.3**: Implement frontend-builder agent
- Create frontend-builder.md specification
- Implement component generation
- Test with blog Sessions 5-8

**Phase 3.4**: Full orchestration
- Create `/execute-phase` command (execute all sessions in a phase)
- Create `/resume-session` command (resume from interruption)
- End-to-end testing

**Phase 3.5**: Mobile & E2E agents
- Create mobile-builder.md specification
- Create integration-tester.md specification
- Test with complex template (e-commerce)

## References

- **Architecture**: `.claude/AGENT_INTEGRATION_ARCHITECTURE.md`
- **Transformation Plan**: `.claude/PLANNING_TOOL_TRANSFORMATION.md`
- **Schema Documentation**: `.claude/infrastructure/agent-state-schema.md`
- **Backend Agent Spec**: `.claude/agents/backend-builder.md`
