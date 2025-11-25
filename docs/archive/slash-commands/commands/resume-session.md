# /resume-session - Resume interrupted session from last checkpoint

Resume execution of a session that was paused, interrupted, or failed at a checkpoint.

## Usage

```
/resume-session <project-name>
```

**Examples**:
```
/resume-session my-blog
/resume-session acme-store
```

**Note**: This command automatically detects the last incomplete session and resumes from its last checkpoint.

---

## What This Command Does

1. **Loads state**: Reads `.agent-state.json` for the project
2. **Finds incomplete session**: Identifies session that was in progress
3. **Identifies last checkpoint**: Determines where execution stopped
4. **Resumes execution**: Continues from that checkpoint
5. **Updates state**: Saves progress

---

## Execution Instructions

When user runs this command, you should:

### Step 1: Load State and Find Incomplete Session

```typescript
// Load state
const state = loadState(project_name)
if (!state) {
  error("No state found for project. Run /initialize-project first.")
}

// Find in-progress session
const inProgressSession = findInProgressSession(state)

if (!inProgressSession) {
  // No in-progress session, find last completed
  const lastCompleted = findLastCompletedSession(state)

  info(`No session in progress.`)
  info(`Last completed: Session ${lastCompleted.number}`)
  ask(`Continue to Session ${lastCompleted.number + 1}? (Y/n)`)

  // If yes, run /execute-session for next session
  return
}

// Find the phase containing this session
const phase = state.phases.find(p =>
  p.sessions.some(s => s.number === inProgressSession.number)
)!

/**
 * Session statuses:
 * - 'not_started': Not started yet
 * - 'red_phase': RED phase in progress
 * - 'green_phase': GREEN phase in progress
 * - 'refactor_phase': REFACTOR phase in progress
 * - 'awaiting_commit': Refactor done, waiting for commit
 * - 'completed': Session complete
 * - 'failed': Session failed
 */
```

### Step 2: Identify Last Checkpoint

```typescript
/**
 * Checkpoint types (from checkpoint-manager.ts):
 * - BEFORE_START: Before session starts
 * - AFTER_RED: After RED phase (tests written)
 * - AFTER_GREEN: After GREEN phase (implementation done)
 * - AFTER_REFACTOR: After REFACTOR phase (ready to commit)
 * - SESSION_COMPLETE: Session complete
 */

const checkpoint = inProgressSession.current_checkpoint

if (!checkpoint) {
  error("Session has no checkpoint data. Cannot resume.")
  ask("Start session from beginning? (Y/n)")
}
```

### Step 3: Show Resume Point

**Show to user**:
```
┌─────────────────────────────────────────────────────────────┐
│ RESUME SESSION                                              │
│ Session ${inProgressSession.number}: ${inProgressSession.title}
│
│ Last Checkpoint: ${checkpoint.type}
│ Last Updated: ${new Date(checkpoint.timestamp).toLocaleString()}
└─────────────────────────────────────────────────────────────┘

STATUS:

${checkpoint.type === 'AFTER_RED' ? `
🔴 RED PHASE COMPLETE

Tests written: ${checkpoint.data.tests_written}
Tests failing: ${checkpoint.data.tests_failing}

Files created:
${checkpoint.data.files_modified.map(f => `  - ${f}`).join('\n')}

What happened:
  - Tests were written and are failing (as expected)
  - Execution was paused before GREEN phase
` : ''}

${checkpoint.type === 'AFTER_GREEN' ? `
🟢 GREEN PHASE COMPLETE

Tests: ${checkpoint.data.tests_passing}/${checkpoint.data.tests_written} passing
Coverage: ${checkpoint.data.coverage}%

Files created/modified:
${checkpoint.data.files_modified.map(f => `  - ${f}`).join('\n')}

What happened:
  - Implementation completed
  - All tests passing
  - Execution was paused before REFACTOR phase
` : ''}

${checkpoint.type === 'AFTER_REFACTOR' ? `
🔵 REFACTOR PHASE COMPLETE

Tests: ${checkpoint.data.tests_passing}/${checkpoint.data.tests_written} passing
Coverage: ${checkpoint.data.coverage}%

Improvements made:
${checkpoint.data.improvements.map(i => `  - ${i}`).join('\n')}

What happened:
  - Code refactored and improved
  - All tests still passing
  - Execution was paused before commit
` : ''}

What would you like to do?

${checkpoint.type === 'AFTER_RED' ? '1. ✅ Continue to GREEN phase (implement code)' : ''}
${checkpoint.type === 'AFTER_GREEN' ? '1. ✅ Continue to REFACTOR phase (improve code)' : ''}
${checkpoint.type === 'AFTER_REFACTOR' ? '1. ✅ Create commit and complete session' : ''}
2. 🔄 Restart session from beginning
3. ⏭️  Skip this session
4. ⏸️  Cancel resume
```

**Handle user response**:
- If "Continue": Resume from next phase
- If "Restart": Start session from RED phase
- If "Skip": Mark session as skipped
- If "Cancel": Exit

### Step 4: Resume Execution

```typescript
import { SessionOrchestrator } from '.claude/infrastructure/execution-orchestrator'
import { determineExecutorType } from '.claude/commands/execute-session'

const orchestrator = new SessionOrchestrator()
const executor = determineExecutorType(phase, inProgressSession)

// Resume based on checkpoint type
switch (checkpoint.type) {
  case 'AFTER_RED':
    // Continue to GREEN phase
    console.log('🟢 Resuming GREEN phase...')

    const greenResult = await executor.executeGreenPhase(
      state,
      phase,
      inProgressSession
    )

    inProgressSession.tests_passing = greenResult.tests_passing
    inProgressSession.coverage = greenResult.coverage
    inProgressSession.files_modified = [
      ...inProgressSession.files_modified,
      ...greenResult.files_modified
    ]
    inProgressSession.current_checkpoint = 'AFTER_GREEN'

    // Show GREEN checkpoint
    showCheckpoint(state, phase, inProgressSession, 'AFTER_GREEN')

    // If user approves, continue to REFACTOR
    // (falls through to next case)

  case 'AFTER_GREEN':
    // Continue to REFACTOR phase
    console.log('🔵 Resuming REFACTOR phase...')

    const refactorResult = await executor.executeRefactorPhase(
      state,
      phase,
      inProgressSession
    )

    inProgressSession.files_modified = [
      ...inProgressSession.files_modified,
      ...refactorResult.files_modified
    ]
    inProgressSession.coverage = refactorResult.coverage
    inProgressSession.current_checkpoint = 'AFTER_REFACTOR'

    // Show REFACTOR checkpoint
    showCheckpoint(state, phase, inProgressSession, 'AFTER_REFACTOR')

    // If user approves, continue to commit
    // (falls through to next case)

  case 'AFTER_REFACTOR':
    // Create commit
    console.log('💾 Creating commit...')

    const commitHash = await executor.createCommit(
      state,
      phase,
      inProgressSession
    )

    inProgressSession.commit_hash = commitHash
    inProgressSession.status = 'completed'
    inProgressSession.current_checkpoint = 'SESSION_COMPLETE'

    // Show completion checkpoint
    showCheckpoint(state, phase, inProgressSession, 'SESSION_COMPLETE')

    break

  default:
    error(`Unknown checkpoint type: ${checkpoint.type}`)
}

// Save state
saveState(state)
```

### Step 5: Show Completion

**Show to user**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ SESSION RESUMED AND COMPLETED
│ Session ${inProgressSession.number}: ${inProgressSession.title}
│
│ Tests: ${inProgressSession.tests_passing}/${inProgressSession.tests_written} passing
│ Coverage: ${inProgressSession.coverage}%
│ Commit: ${inProgressSession.commit_hash}
│
│ Overall Progress: ${completedSessions}/${totalSessions} sessions (${Math.round(completedSessions/totalSessions*100)}%)
└─────────────────────────────────────────────────────────────┘

What would you like to do?

1. ✅ Continue to Session ${inProgressSession.number + 1}
2. 📊 Show overall progress (/show-progress ${project_name})
3. ⏸️  Pause execution
```

---

## Recovery Scenarios

### Scenario 1: Interrupted After RED Phase

**Situation**: Tests written, execution stopped before implementation

**Resume Point**: GREEN phase

**Example**:
```bash
/resume-session my-blog

# Output:
# Last Checkpoint: AFTER_RED
# Tests written: 72
# Tests failing: 72 (expected)
#
# Continue to GREEN phase? (Y/n)
```

### Scenario 2: Interrupted After GREEN Phase

**Situation**: Implementation done, tests passing, execution stopped before refactor

**Resume Point**: REFACTOR phase

**Example**:
```bash
/resume-session acme-store

# Output:
# Last Checkpoint: AFTER_GREEN
# Tests: 90/90 passing
# Coverage: 92%
#
# Continue to REFACTOR phase? (Y/n)
```

### Scenario 3: Interrupted After REFACTOR Phase

**Situation**: Code refactored, execution stopped before commit

**Resume Point**: Create commit

**Example**:
```bash
/resume-session my-saas

# Output:
# Last Checkpoint: AFTER_REFACTOR
# All tests passing
# Code improvements made
#
# Create commit and complete session? (Y/n)
```

### Scenario 4: Session Failed

**Situation**: Session failed (e.g., tests not passing in GREEN)

**Resume Point**: Retry failed phase

**Example**:
```bash
/resume-session my-blog

# Output:
# Session 3 failed at GREEN phase
# Error: Tests still failing (58/72 passing)
#
# What to do?
# 1. Retry GREEN phase (agent will fix)
# 2. Fix manually and retry
# 3. Skip session
```

---

## State Persistence

The `.agent-state.json` file tracks:

```json
{
  "sessions": [
    {
      "number": 3,
      "title": "Permissions + Business Logic",
      "status": "green_phase",
      "current_checkpoint": {
        "type": "AFTER_RED",
        "timestamp": "2024-01-15T14:30:00Z",
        "data": {
          "tests_written": 60,
          "tests_failing": 60,
          "files_modified": [
            "backend/apps/blog/tests/test_permissions.py"
          ]
        }
      },
      "tests_written": 60,
      "tests_failing": 60,
      "retry_count": 0
    }
  ]
}
```

When you run `/resume-session`, it reads this state and resumes from `current_checkpoint`.

---

## Error Handling

### No Incomplete Session

```
No session in progress.

Last completed: Session 5: API Client + Zod Schemas

Continue to Session 6? (Y/n)
```

### Corrupted State

```
⚠️  Checkpoint data is missing or corrupted.

Cannot resume safely.

Options:
1. Restart session from beginning (/execute-session my-blog 3)
2. Skip session and move on (/execute-session my-blog 4)
```

### Dependency Changed

```
⚠️  Session dependencies have changed since last checkpoint.

Session 3 originally depended on: [1, 2]
Now depends on: [1, 2, 2.5]

Session 2.5 (new dependency) is not complete.

Options:
1. Complete Session 2.5 first (/execute-session my-blog 2.5)
2. Cancel resume
```

---

## Advantages

1. **No Lost Work**: Resume exactly where you left off
2. **Flexible Interruption**: Pause and resume at any checkpoint
3. **Error Recovery**: Retry failed phases without starting over
4. **State Tracking**: Full audit trail of what was done

---

## Related Commands

- `/execute-session` - Execute a single session
- `/execute-phase` - Execute an entire phase
- `/show-progress` - Show overall progress
- `/initialize-project` - Create initial state

---

## Best Practices

1. **Check progress first**: Run `/show-progress` to see where you are
2. **Resume promptly**: Don't let interrupted sessions sit too long
3. **Fix errors manually**: If agent fails, you can fix and resume
4. **Trust the state**: `.agent-state.json` is the source of truth
