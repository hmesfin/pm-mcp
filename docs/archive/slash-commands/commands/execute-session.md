# /execute-session - Execute a single session with TDD workflow

Execute a single session from the project plan using TDD (RED-GREEN-REFACTOR) with human-in-the-loop checkpoints.

## Usage

```
/execute-session <project-name> <session-number>
```

**Examples**:
```
/execute-session my-blog 1
/execute-session acme-store 5
```

---

## What This Command Does

1. **Loads state**: Reads `.agent-state.json` for the project
2. **Validates session**: Ensures dependencies are met
3. **Executes TDD workflow**:
   - RED phase: Write failing tests
   - CHECKPOINT 1: Show tests, ask to implement
   - GREEN phase: Implement to pass tests
   - CHECKPOINT 2: Show implementation, ask to refactor
   - REFACTOR phase: Improve code quality
   - CHECKPOINT 3: Show refactored code, ask to commit
   - Create git commit
   - CHECKPOINT 4: Show commit, ask to continue
4. **Updates state**: Saves progress to `.agent-state.json`

---

## Execution Instructions

When user runs this command, you should:

### Step 1: Load and Validate

```typescript
// Load state
const state = loadState(project_name)
if (!state) {
  error("No state found for project. Run /initialize-project first.")
}

// Find session
const session = findSession(state, session_number)
if (!session) {
  error(`Session ${session_number} not found`)
}

// Check dependencies
if (session.depends_on.length > 0) {
  const unmet = session.depends_on.filter(dep => {
    const depSession = findSession(state, dep)
    return depSession.status !== 'completed'
  })

  if (unmet.length > 0) {
    error(`Cannot start session ${session_number}: depends on incomplete sessions ${unmet.join(', ')}`)
  }
}

// Check if already completed
if (session.status === 'completed') {
  warn(`Session ${session_number} already completed. Use /retry-session to re-run.`)
  return
}
```

### Step 2: Determine Phase, Session Context, and Executor Type

```typescript
// Identify which phase this session belongs to
const phase = state.phases.find(p =>
  p.sessions.some(s => s.number === session_number)
)!

// Read session details from PROJECT_PLAN.md
const planPath = `project-plans/${state.project_name}/PROJECT_PLAN.md`
const sessionDetails = parseSessionFromPlan(planPath, session_number)

// Read technical requirements
const reqPath = `project-plans/${state.project_name}/REQUIREMENTS.md`
const requirements = readFile(reqPath)

// Determine executor type (backend vs frontend vs mobile vs e2e)
const executorType = determineExecutorType(phase, session)

/**
 * Determine which executor to use for this session
 */
function determineExecutorType(phase: Phase, session: Session): 'backend' | 'frontend' | 'mobile' | 'e2e' {
  // Check phase name first
  const phaseName = phase.name.toLowerCase()
  if (phaseName.includes('backend')) return 'backend'
  if (phaseName.includes('frontend')) return 'frontend'
  if (phaseName.includes('mobile')) return 'mobile'
  if (phaseName.includes('e2e') || phaseName.includes('integration') || phaseName.includes('testing')) {
    return 'e2e'
  }

  // Check session title as fallback
  const sessionTitle = session.title.toLowerCase()

  // E2E detection (most specific, check first)
  if (sessionTitle.includes('e2e') || sessionTitle.includes('integration') ||
      sessionTitle.includes('playwright') || sessionTitle.includes('performance')) {
    return 'e2e'
  }

  // Backend detection
  if (sessionTitle.includes('model') || sessionTitle.includes('serializer') ||
      sessionTitle.includes('viewset') || sessionTitle.includes('permission')) {
    return 'backend'
  }

  // Frontend detection
  if (sessionTitle.includes('component') || sessionTitle.includes('composable') ||
      sessionTitle.includes('view') || sessionTitle.includes('schema')) {
    return 'frontend'
  }

  // Mobile detection
  if (sessionTitle.includes('screen') || sessionTitle.includes('navigation') ||
      sessionTitle.includes('react native') || sessionTitle.includes('expo')) {
    return 'mobile'
  }

  // Default based on session number (sessions 1-4 usually backend, 5-8 frontend, 11+ E2E)
  if (session.number <= 4) return 'backend'
  if (session.number <= 8) return 'frontend'
  if (session.number >= 11) return 'e2e'
  return 'backend'
}

// Instantiate appropriate executor
const executor = executorType === 'backend' ? new BackendExecutor() :
                 executorType === 'frontend' ? new FrontendExecutor() :
                 executorType === 'mobile' ? new MobileExecutor() :
                 new E2EExecutor() // Phase 3.4
```

### Step 3: Execute RED Phase (Write Tests)

**Show to user**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 RED PHASE - Session ${session_number}: ${session.title}
│
│ I will now write comprehensive tests FIRST.
│ All tests should FAIL initially (that's expected!).
│
│ Estimated time: ~${session.estimated_hours * 0.3}h
└─────────────────────────────────────────────────────────────┘
```

**Build prompt for backend-builder agent**:

```markdown
# Backend Builder - RED Phase

**Project**: ${state.project_name} (${state.app_type})
**Session**: ${session_number} - ${session.title}
**Phase**: ${phase.name}

## Your Mission

Write comprehensive tests FIRST for this session. All tests should FAIL.

## Session Context

${sessionDetails.objectives}

## Technical Specifications

Read the complete model/endpoint specifications from:
\`project-plans/${state.project_name}/REQUIREMENTS.md\`

Focus on the models/endpoints relevant to: "${session.title}"

## Instructions

1. **Identify Scope**:
   - Read REQUIREMENTS.md and identify which models/endpoints this session covers
   - For "Models + Admin": Focus on model tests
   - For "Serializers + ViewSets": Focus on serializer and viewset tests
   - For "Permissions": Focus on permission and business logic tests

2. **Write Tests FIRST**:
   - Create test files in \`backend/apps/<app>/tests/\`
   - Test all fields, validation, relationships
   - Test custom methods and business logic
   - Use pytest fixtures for common setup
   - Aim for ~${Math.round(session.estimated_hours * 30)} tests

3. **Test Structure**:
   \`\`\`python
   # backend/apps/blog/tests/test_models.py
   import pytest
   from django.core.exceptions import ValidationError
   from apps.blog.models import Post
   from apps.users.models import User

   @pytest.mark.django_db
   class TestPostModel:
       def test_create_post_with_valid_data(self, user):
           """Test creating a post with all required fields"""
           post = Post.objects.create(
               title="Test Post",
               content="Test content",
               author=user
           )
           assert post.title == "Test Post"
           assert post.slug == "test-post"

       def test_title_required(self):
           """Test that title field is required"""
           with pytest.raises(ValidationError):
               Post.objects.create(title="")
   \`\`\`

4. **Run Tests**:
   \`\`\`bash
   docker compose run --rm django pytest apps/<app>/tests/ -v
   \`\`\`

   **Expected**: ALL TESTS SHOULD FAIL (models don't exist yet)

5. **Report**:
   At the end, provide:
   - List of test files created
   - Total number of tests written
   - Confirmation that all tests are failing
   - Sample of 3-5 test names to show coverage

## Important

- **DO NOT** implement models/serializers yet (that's GREEN phase)
- **DO** create the Django app first if it doesn't exist
- **DO** use descriptive test names
- **DO** cover edge cases and validation

Good luck! RED means FAILING tests are GOOD.
```

**Launch agent**:
```typescript
const redResult = await Task({
  subagent_type: 'backend-builder',
  description: `RED phase for Session ${session_number}`,
  prompt: redPhasePrompt
})
```

**Update state**:
```typescript
updateSession(state, phase.number, session_number, {
  status: 'red_phase',
  tests_written: redResult.tests_written,
  tests_passing: 0,
  files_modified: redResult.files_modified
})
```

### Step 4: CHECKPOINT 1 - After RED

**Show to user**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ RED PHASE COMPLETE
│
│ Tests written: ${redResult.tests_written}
│ Tests failing: ${redResult.tests_written} (expected!)
│
│ Files created:
│ ${redResult.files_modified.map(f => `  - ${f}`).join('\n')}
│
│ Sample tests:
│ ${redResult.sample_tests.map(t => `  - ${t}`).join('\n')}
└─────────────────────────────────────────────────────────────┘

What would you like to do?

1. ✅ Proceed to GREEN phase (implement to pass tests)
2. 🔄 Revise tests (I want to modify them first)
3. ⏭️  Skip this session
4. ⏸️  Pause execution
```

**Handle user response**:
- If "Proceed": Continue to GREEN phase
- If "Revise": Pause and let user modify files
- If "Skip": Mark session as skipped
- If "Pause": Save state and exit

### Step 5: Execute GREEN Phase (Implement)

Similar structure to RED phase, but:
- Prompt focuses on implementation
- Expected result: tests PASS, coverage >= 90%
- Show passing test count and coverage at checkpoint

### Step 6: Execute REFACTOR Phase (Improve)

Similar structure, but:
- Prompt focuses on code quality (docstrings, type hints)
- Expected result: tests still pass, code is cleaner
- Show improvements made at checkpoint

### Step 7: Create Git Commit

```typescript
const commitMessage = buildCommitMessage(session)

// Stage files
await bash(`git add ${session.files_modified.join(' ')}`)

// Create commit
await bash(`git commit -m "${commitMessage}"`)

// Get commit hash
const commitHash = await bash(`git rev-parse --short HEAD`)

// Update session
markSessionComplete(state, phase.number, session_number, {
  commit_hash: commitHash,
  tests_written: session.tests_written,
  tests_passing: session.tests_passing,
  coverage: session.coverage,
  actual_hours: calculateActualHours(session),
  files_modified: session.files_modified
})
```

### Step 8: CHECKPOINT 4 - Session Complete

**Show to user**:
```
┌─────────────────────────────────────────────────────────────┐
│ ✓ SESSION ${session_number} COMPLETE: ${session.title}
│
│ Tests: ${session.tests_passing}/${session.tests_written} passing
│ Coverage: ${session.coverage}%
│ Time: ${session.actual_hours}h (estimated: ${session.estimated_hours}h)
│ Commit: ${session.commit_hash}
│
│ Progress: ${completedSessions}/${totalSessions} sessions complete
└─────────────────────────────────────────────────────────────┘

What would you like to do?

1. ✅ Continue to next session
2. ⏸️  Pause execution
3. 📊 Show overall progress
```

---

## Error Handling

If any phase fails:

1. **Test failures in GREEN**:
   - Show failing tests
   - Ask user: "Retry GREEN phase?" or "Rollback to RED?"
   - Increment retry_count

2. **Coverage below target**:
   - Show coverage report
   - Ask user: "Add more tests?" or "Accept lower coverage?"

3. **Type errors**:
   - Show mypy output
   - Ask user: "Fix type errors?" or "Skip type checking?"

4. **Git conflicts**:
   - Show conflict files
   - Ask user to resolve manually

## Success Criteria

- All tests passing
- Coverage targets:
  - Backend: >= 90%
  - Frontend: >= 85%
  - Mobile: >= 85%
  - E2E: N/A (focuses on workflow validation)
- Type checking passes
- Git commit created
- State updated

---

## Related Commands

- `/initialize-project` - Create initial state for a project
- `/show-progress` - Show overall execution progress
- `/retry-session` - Re-execute a failed session
- `/resume-session` - Resume from last checkpoint
