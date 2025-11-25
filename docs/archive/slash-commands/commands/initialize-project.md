# /initialize-project - Initialize project for agent execution

Initialize a project's execution state from its plan, preparing it for automated agent execution.

## Usage

```
/initialize-project <project-name> <app-type>
```

**Examples**:
```
/initialize-project my-blog blog
/initialize-project acme-store ecommerce
/initialize-project team-app projectmanagement
```

**Valid app types**: `blog`, `ecommerce`, `saas`, `social`, `projectmanagement`

---

## What This Command Does

1. **Validates project**: Ensures plan exists
2. **Parses plan**: Extracts phases and sessions from PROJECT_PLAN.md
3. **Creates state**: Initializes `.agent-state.json`
4. **Shows summary**: Displays project overview and next steps

---

## Execution Instructions

When user runs this command, you should:

### Step 1: Validate Inputs

```typescript
// Validate app type
const validTypes = ['blog', 'ecommerce', 'saas', 'social', 'projectmanagement']
if (!validTypes.includes(app_type)) {
  error(`Invalid app type: ${app_type}. Must be one of: ${validTypes.join(', ')}`)
}

// Check if plan exists
const planPath = `project-plans/${project_name}/PROJECT_PLAN.md`
if (!fileExists(planPath)) {
  error(`No plan found at ${planPath}. Run /plan-app first to create a plan.`)
}

// Check if state already exists
const statePath = `project-plans/${project_name}/.agent-state.json`
if (fileExists(statePath)) {
  warn(`State file already exists for ${project_name}.`)
  askUser("Overwrite existing state? (This will reset all progress)")
  // If no, exit
}
```

### Step 2: Parse Project Plan

Use the plan parser to extract structured data:

```typescript
// Read and parse PROJECT_PLAN.md
const phases = parsePlanForApp(app_type)

// Example parsed structure:
// phases = [
//   {
//     number: 1,
//     name: "Backend Foundation",
//     sessions: [
//       {
//         number: 1,
//         title: "Models + Admin",
//         estimated_hours: 2.5,
//         depends_on: [],
//         blocks: [2]
//       },
//       ...
//     ]
//   },
//   ...
// ]
```

### Step 3: Create Initial State

```typescript
const state = {
  project_name: project_name,
  app_type: app_type,
  plan_version: "1.0",

  execution_started_at: new Date().toISOString(),
  last_updated_at: new Date().toISOString(),
  status: "not_started",

  current_phase: 1,
  current_session: null,

  phases: phases,  // From parser

  blockers: [],

  notes: `Initialized on ${new Date().toISOString()}. Ready to begin execution.`
}
```

### Step 4: Validate Plan

```typescript
// Run validation checks
validatePlan(state.phases)

// Checks:
// - No missing session numbers (1, 2, 3... must be sequential)
// - No circular dependencies
// - All dependency references are valid
// - All "blocks" references are valid

// If validation fails, show errors and exit
```

### Step 5: Save State

```typescript
// Ensure directory exists
ensureDir(`project-plans/${project_name}`)

// Save state file
const statePath = `project-plans/${project_name}/.agent-state.json`
writeFile(statePath, JSON.stringify(state, null, 2))
```

### Step 6: Show Summary

Display a comprehensive summary to the user:

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ PROJECT INITIALIZED: ${project_name}
│
│ App Type: ${app_type}
│ Total Phases: ${state.phases.length}
│ Total Sessions: ${totalSessions}
│ Estimated Time: ${totalHours} hours
│ Estimated Tests: ~${totalTests} tests
└─────────────────────────────────────────────────────────────┘

PHASE BREAKDOWN:

Phase 1: ${phase1.name} (${phase1.sessions.length} sessions, ${phase1Hours}h)
  Session 1: ${phase1.sessions[0].title} (${phase1.sessions[0].estimated_hours}h)
  Session 2: ${phase1.sessions[1].title} (${phase1.sessions[1].estimated_hours}h)
  ...

Phase 2: ${phase2.name} (${phase2.sessions.length} sessions, ${phase2Hours}h)
  ...

DEPENDENCY INSIGHTS:

Critical Path: Sessions ${criticalPath.join(' → ')}
  Minimum duration: ${criticalPathHours} hours

Parallelizable Sessions: ${parallelSessions.join(', ')}
  Potential time save: ${timeSave} hours (with 2+ developers)

NEXT STEPS:

1. Review the plan:
   \`cat project-plans/${project_name}/PROJECT_PLAN.md\`

2. Review requirements:
   \`cat project-plans/${project_name}/REQUIREMENTS.md\`

3. Start execution:
   \`/execute-session ${project_name} 1\`

   Or execute entire phase:
   \`/execute-phase ${project_name} 1\`

4. Monitor progress:
   \`/show-progress ${project_name}\`

STATE FILE: project-plans/${project_name}/.agent-state.json
```

### Step 7: Create Project Directory Structure (Optional)

Optionally create empty directories for organization:

```bash
mkdir -p project-plans/${project_name}/tasks
mkdir -p project-plans/${project_name}/docs
mkdir -p project-plans/${project_name}/notes
```

---

## Error Handling

**Plan not found**:
```
ERROR: No plan found for project "${project_name}"

Run /plan-app to create a plan first:
  /plan-app

Then try initializing again.
```

**Invalid app type**:
```
ERROR: Invalid app type "${app_type}"

Valid types:
  - blog
  - ecommerce
  - saas
  - social
  - projectmanagement

Example: /initialize-project my-blog blog
```

**State already exists**:
```
WARNING: State file already exists for "${project_name}"

Current state:
  Status: ${state.status}
  Progress: ${state.current_phase}/${totalPhases} phases
  Sessions: ${completedSessions}/${totalSessions} complete

Do you want to overwrite? This will RESET ALL PROGRESS.

1. No, keep existing state
2. Yes, start fresh (DESTRUCTIVE)
```

---

## Example Usage Flow

```bash
# 1. User creates a plan
/plan-app
# ... interactive planning ...
# Creates: project-plans/my-blog/PROJECT_PLAN.md

# 2. User initializes for execution
/initialize-project my-blog blog
# Creates: project-plans/my-blog/.agent-state.json

# 3. User starts execution
/execute-session my-blog 1
# ... TDD workflow with checkpoints ...

# 4. User checks progress
/show-progress my-blog
# Shows: Phase 1, Session 1 complete (93% coverage)
```

---

## State File Structure

The created `.agent-state.json` file will have this structure:

```json
{
  "project_name": "my-blog",
  "app_type": "blog",
  "plan_version": "1.0",
  "execution_started_at": "2025-11-16T14:30:00Z",
  "last_updated_at": "2025-11-16T14:30:00Z",
  "status": "not_started",
  "current_phase": 1,
  "current_session": null,
  "phases": [
    {
      "number": 1,
      "name": "Backend Foundation",
      "status": "not_started",
      "sessions": [
        {
          "number": 1,
          "title": "Models + Admin",
          "status": "not_started",
          "estimated_hours": 2.5,
          "tests_written": 0,
          "tests_passing": 0,
          "coverage": null,
          "depends_on": [],
          "blocks": [2]
        }
      ]
    }
  ],
  "blockers": [],
  "notes": "Initialized and ready for execution"
}
```

---

## Related Commands

- `/plan-app` - Create project plan (prerequisite)
- `/execute-session` - Execute a single session
- `/execute-phase` - Execute entire phase
- `/show-progress` - View execution progress
- `/resume-session` - Resume from interruption
