# /show-progress - Show project execution progress

Display current progress for a project being executed by agents.

## Usage

```
/show-progress <project-name>
```

**Examples**:
```
/show-progress my-blog
/show-progress acme-store
```

---

## What This Command Does

1. **Loads state**: Reads `.agent-state.json`
2. **Calculates metrics**: Sessions complete, coverage, time spent
3. **Shows visual progress**: Phase/session status with indicators
4. **Identifies blockers**: Lists any active blockers
5. **Shows next steps**: What to execute next

---

## Execution Instructions

When user runs this command, you should:

### Step 1: Load State

```typescript
const statePath = `project-plans/${project_name}/.agent-state.json`
if (!fileExists(statePath)) {
  error(`No state found for project "${project_name}". Run /initialize-project first.`)
}

const state = JSON.parse(readFile(statePath))
```

### Step 2: Calculate Progress Metrics

```typescript
const metrics = {
  total_sessions: allSessions.length,
  completed_sessions: allSessions.filter(s => s.status === 'completed').length,
  in_progress_sessions: allSessions.filter(s => s.status === 'in_progress').length,
  blocked_sessions: allSessions.filter(s => s.status === 'blocked').length,
  skipped_sessions: allSessions.filter(s => s.status === 'skipped').length,

  total_tests_written: sum(allSessions.map(s => s.tests_written)),
  total_tests_passing: sum(allSessions.map(s => s.tests_passing)),

  total_hours_estimated: sum(allSessions.map(s => s.estimated_hours)),
  total_hours_spent: sum(completedSessions.map(s => s.actual_hours)),

  avg_coverage: average(completedSessions.map(s => s.coverage)),

  completion_percentage: (completed_sessions / total_sessions) * 100
}
```

### Step 3: Display Progress

Show a comprehensive progress report:

```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT PROGRESS: ${state.project_name}
│
│ Status: ${state.status}
│ Progress: ${metrics.completed_sessions}/${metrics.total_sessions} sessions (${metrics.completion_percentage}%)
│ Current: Phase ${state.current_phase}, Session ${state.current_session || 'None'}
└─────────────────────────────────────────────────────────────┘

OVERALL METRICS:

  Tests: ${metrics.total_tests_passing}/${metrics.total_tests_written} passing
  Coverage: ${metrics.avg_coverage}% average
  Time: ${metrics.total_hours_spent}h spent / ${metrics.total_hours_estimated}h estimated
  Remaining: ~${metrics.total_hours_estimated - metrics.total_hours_spent}h

PHASE BREAKDOWN:

${phases.map(phase => `
Phase ${phase.number}: ${phase.name} [${phase.status}]
  Sessions: ${phase.completed}/${phase.total} complete

  ${phase.sessions.map(session => `
  ${getStatusIcon(session.status)} Session ${session.number}: ${session.title}
    ${session.status === 'completed' ?
      `✓ ${session.tests_passing}/${session.tests_written} tests, ${session.coverage}% coverage, ${session.actual_hours}h` :
      session.status === 'in_progress' ?
      `⏳ ${session.tests_written} tests written, ${session.checkpoint || 'running'}` :
      session.status === 'blocked' ?
      `🚫 Blocked (see blockers below)` :
      `⏸️  Not started`
    }
  `).join('\n')}
`).join('\n')}

${metrics.blocked_sessions > 0 ? `
ACTIVE BLOCKERS:

${state.blockers.filter(b => !b.resolved_at).map(blocker => `
  🚫 ${blocker.type.toUpperCase()} - Session ${blocker.session_number}
     Severity: ${blocker.severity}
     ${blocker.description}
     Created: ${formatDate(blocker.created_at)}
`).join('\n')}
` : ''}

NEXT STEPS:

${getNextSteps(state)}
```

### Helper Functions

**Status Icons**:
```typescript
function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed': return '✓'
    case 'in_progress': return '⏳'
    case 'red_phase': return '🔴'
    case 'green_phase': return '🟢'
    case 'refactor_phase': return '🔵'
    case 'awaiting_approval': return '⏸️'
    case 'blocked': return '🚫'
    case 'skipped': return '⏭️'
    case 'error': return '❌'
    default: return '○'
  }
}
```

**Next Steps**:
```typescript
function getNextSteps(state: AgentState): string {
  // If execution complete
  if (state.status === 'completed') {
    return `
✓ All sessions complete!

Final stats:
  - ${metrics.total_tests_passing} tests passing
  - ${metrics.avg_coverage}% average coverage
  - ${metrics.total_hours_spent}h total time

Next: Deploy your application or add optional enhancements.
    `
  }

  // If paused at checkpoint
  if (state.current_session) {
    const session = getCurrentSession(state)
    if (session.status === 'awaiting_approval') {
      return `
⏸️  Paused at checkpoint: ${session.checkpoint}

Resume execution:
  /execute-session ${state.project_name} ${session.number}
      `
    }
  }

  // If blocked
  if (metrics.blocked_sessions > 0) {
    return `
🚫 ${metrics.blocked_sessions} session(s) blocked

Resolve blockers, then:
  /execute-session ${state.project_name} ${nextUnblocked.number}
    `
  }

  // Normal case - show next session to run
  const nextSession = getNextSession(state)
  if (nextSession) {
    return `
▶️  Ready to continue

Start next session:
  /execute-session ${state.project_name} ${nextSession.number}

Or execute entire phase:
  /execute-phase ${state.project_name} ${state.current_phase}
    `
  }

  return "No next steps available."
}
```

**Get Next Session**:
```typescript
function getNextSession(state: AgentState): Session | null {
  // Find first session that is:
  // - not_started or in_progress
  // - all dependencies met
  for (const phase of state.phases) {
    for (const session of phase.sessions) {
      if (session.status === 'completed' || session.status === 'skipped') {
        continue
      }

      // Check dependencies
      const depsMet = session.depends_on.every(depNum => {
        const dep = findSession(state, depNum)
        return dep.status === 'completed'
      })

      if (depsMet) {
        return session
      }
    }
  }

  return null
}
```

---

## Example Output

```
┌─────────────────────────────────────────────────────────────┐
│ PROJECT PROGRESS: my-blog
│
│ Status: in_progress
│ Progress: 2/11 sessions (18%)
│ Current: Phase 1, Session 3
└─────────────────────────────────────────────────────────────┘

OVERALL METRICS:

  Tests: 162/162 passing
  Coverage: 93% average
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
    ⏳ 60 tests written, after_red

  ○ Session 4: Media Uploads + Optimization
    ⏸️  Not started

Phase 2: Frontend Foundation [not_started]
  Sessions: 0/4 complete

  ○ Session 5: API Client + Zod Schemas
  ○ Session 6: Post Composables + Stores
  ○ Session 7: Post UI Components
  ○ Session 8: Post Views + Routing

...

NEXT STEPS:

⏸️  Paused at checkpoint: after_red

Resume execution:
  /execute-session my-blog 3
```

---

## Progress Bar Visualization

Optionally show a visual progress bar:

```
Progress: [████████░░░░░░░░░░░░] 18% (2/11 sessions)

Phase 1: [████████████░░░░] 50% (2/4)
Phase 2: [░░░░░░░░░░░░░░░░] 0% (0/4)
Phase 3: [░░░░░░░░░░░░░░░░] 0% (0/2)
Phase 4: [░░░░░░░░░░░░░░░░] 0% (0/1)
```

---

## Related Commands

- `/execute-session` - Execute next session
- `/execute-phase` - Execute entire phase
- `/initialize-project` - Initialize project state
- `/retry-session` - Retry a failed session
