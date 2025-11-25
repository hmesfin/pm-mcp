# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code configuration directory** (`.claude/`) for the fullstack-starter-djvurn template. It provides an AI-driven planning and execution system that transforms app ideas into comprehensive, TDD-driven, session-based implementation plans.

**Philosophy**: Planning is the bottleneck, not coding. Poor planning leads to project failure. Good plans enable successful agent execution.

## Core Architecture

### Planning System Components

1. **Slash Commands** (`.claude/commands/`)
   - `/plan-app` - Interactive AI-driven app planning with template selection
   - `/initialize-project` - Initialize execution state for a project plan
   - `/execute-session` - Execute individual sessions with TDD enforcement
   - `/execute-phase` - Execute entire phases with parallelization
   - `/resume-session` - Resume interrupted sessions from checkpoints
   - `/show-progress` - Display project execution progress

2. **Template Library** (`.claude/templates/`)
   - `PROJECT_PLAN_TEMPLATE.md` - High-level plan structure
   - `PHASE_TASKS_TEMPLATE.md` - Detailed session task breakdowns
   - Pre-built templates: blog, ecommerce, saas, social, projectmanagement

3. **Executor Agents** (`.claude/agents/`)
   - `backend-builder.md` - Django models, serializers, ViewSets
   - `frontend-builder.md` - Vue components, composables, views
   - `mobile-builder.md` - React Native screens, navigation
   - `e2e-tester.md` - Playwright E2E workflows

4. **Infrastructure** (`.claude/infrastructure/`)
   - `checkpoint-manager.ts` - Human-in-the-loop checkpoint system
   - `agent-state-schema.md` - Session state tracking schema

## Template Variable System

Templates use `{{VARIABLE}}` syntax for placeholders. Common variables:

- `{{APP_NAME}}` - Application name
- `{{APP_DESCRIPTION}}` - Brief description
- `{{COMPLEXITY_LEVEL}}` - Basic/Intermediate/Advanced
- `{{MOBILE_STACK}}` - React Native + Expo or "Not applicable"
- `{{CORE_FEATURES}}` - Bulleted list of features
- `{{INTEGRATIONS}}` - Third-party services
- `{{PHASE_X_SESSIONS}}` - Session breakdown for phase X
- `{{PHASE_X_TIME}}` - Estimated time for phase X

## Session Organization Patterns

### Context Budget Management

Sessions are sized to avoid context fatigue:
- **Basic apps**: ~15K tokens/session
- **Intermediate apps**: ~18K tokens/session
- **Advanced apps**: ~20K tokens/session

Target: Leave 30K+ tokens buffer for conversation and debugging.

### Backend Session Sizing

- **Models**: 3-5 models per session
- **Serializers**: 3-5 serializers per session
- **ViewSets**: 3-5 ViewSets per session
- **Business logic**: 1-2 complex workflows per session

### Frontend Session Sizing

- **Components**: 5-7 components per session
- **Views**: 3-4 views per session
- **Composables**: 3-5 composables per session
- **Stores**: 2-3 stores per session

### Mobile Session Sizing

- **Screens**: 3-4 screens per session
- **Components**: 5-7 components per session
- **Hooks**: 3-5 hooks per session

## TDD Enforcement

Every session follows the RED-GREEN-REFACTOR cycle:

1. **RED Phase**: Write failing tests first
   - Expected result: ❌ Tests fail (implementation doesn't exist)
   - Checkpoint: Show failing tests, ask permission to implement

2. **GREEN Phase**: Write minimal code to pass tests
   - Expected result: ✅ Tests pass
   - Checkpoint: Show passing tests, ask permission to refactor

3. **REFACTOR Phase**: Optimize while keeping tests passing
   - Expected result: ✅ Tests still pass after refactoring
   - Checkpoint: Show improvements, ask permission to commit

4. **COMMIT Phase**: Create git commit with session summary

## Checkpoint System

Agents pause at 5 checkpoints per session for human approval:

1. **BEFORE_START** - Show what will be built, ask permission
2. **AFTER_RED** - Show failing tests, ask permission to implement
3. **AFTER_GREEN** - Show passing tests, ask permission to refactor
4. **AFTER_REFACTOR** - Show improvements, ask permission to commit
5. **SESSION_COMPLETE** - Show summary, ask to continue or pause

User responses:
- ✅ **Approve** - Continue to next step
- 🔄 **Request Changes** - Agent adjusts, shows again
- ⏸️ **Pause** - Stop execution, save state
- ❌ **Abort** - Rollback changes

## State Management

### Session States

- `not_started` - Session hasn't begun
- `in_progress` - Currently working
- `red_phase` - Tests written, failing
- `green_phase` - Implementation done, tests passing
- `refactor_phase` - Refactoring in progress
- `awaiting_approval` - At checkpoint
- `completed` - Session finished
- `blocked` - Can't proceed (dependency issue)
- `skipped` - User chose to skip

### State Persistence

State tracked in `project-plans/<app-name>/.agent-state.json`:

```json
{
  "project_name": "my-blog",
  "current_phase": 1,
  "current_session": 2,
  "completed_sessions": ["phase_1_session_1"],
  "in_progress": "phase_1_session_2",
  "status": "in_progress"
}
```

## Common Commands

### Planning Workflow

```bash
# Create a new plan
/plan-app

# Initialize project for execution
/initialize-project <project-name> <template-type>

# Execute specific session
/execute-session <project-name> <session-number>

# Execute entire phase with parallelization
/execute-phase <project-name> <phase-number>

# Resume from interruption
/resume-session <project-name>

# Check progress
/show-progress <project-name>
```

### Template Customization

Pre-built templates support feature toggles:
- **Blog**: comments, categories/tags, multi-author, media uploads
- **E-commerce**: product variants, inventory, subscriptions, reviews
- **SaaS**: organizations, teams, billing, RBAC
- **Social**: posts, friends, feeds, real-time, notifications
- **Project Management**: projects, tasks, boards, time tracking

## Mobile Feature Selection

When planning mobile apps, three approaches:

1. **Web only** - No mobile planning
2. **Full feature parity** - All web features → mobile
3. **Selective features** (RECOMMENDED) - Choose which features go to mobile
   - Reduces sessions by ~30-40%
   - Avoids complex desktop UIs on mobile
   - Adds mobile-specific features (push notifications, biometric auth, offline mode)
4. **Mobile-first** - Mobile is primary, web is secondary

## Target Stack Understanding

The planning system generates plans for:

### Backend (Django)
- Custom user model: `apps.users.User` (email-based, no username)
- API-only backend (no Django templates except emails)
- DRF with OpenAPI schema generation (`drf-spectacular`)
- Token + JWT authentication
- Docker-first workflow (`docker compose run --rm django <command>`)

### Frontend (Vue.js)
- Vue 3 Composition API with `<script setup lang="ts">`
- Shadcn-vue components (copy-paste, not npm package)
- Auto-generated TypeScript client from Django OpenAPI schema
- Zod validation schemas (mirror backend validation)
- TanStack Query (vue-query) for data fetching

### Mobile (React Native)
- React Native + Expo or bare workflow
- TypeScript strict mode
- React Navigation for navigation
- Platform-specific code: `.ios.tsx` / `.android.tsx`

### Infrastructure
- Docker Compose for all services
- PostgreSQL database
- Redis for caching and Celery broker
- Celery for async tasks
- Mailpit for local email testing

## Agent Integration Architecture

### Execution Flow

1. User runs `/plan-app` → generates comprehensive plan
2. User runs `/initialize-project` → creates `.agent-state.json`
3. User runs `/execute-session` → agent executes one session with TDD
4. Agent pauses at checkpoints → user approves/modifies
5. Agent commits → updates state → moves to next session

### Parallelization (Phase-Level Execution)

When executing phases (`/execute-phase`), sessions are grouped by dependencies:
- **Group 1**: Independent sessions run first
- **Group 2**: Sessions depending on Group 1
- **Group 3**: Sessions with satisfied dependencies run in parallel

Time savings: 20-40% faster than sequential execution.

## File Organization

```
.claude/
├── README.md                           # User guide
├── PLANNING_GUIDE.md                   # Planning system guide
├── AGENT_INTEGRATION_ARCHITECTURE.md   # Agent execution design
├── QUICKSTART_AGENT_EXECUTION.md       # Quick start for execution
├── SKILL.md                            # Claude Code skill definition
├── commands/
│   ├── plan-app.md                     # Planning slash command
│   ├── initialize-project.md           # Project initialization
│   ├── execute-session.md              # Session executor
│   ├── execute-phase.md                # Phase executor
│   ├── resume-session.md               # Resume from checkpoint
│   └── show-progress.md                # Progress tracker
├── templates/
│   ├── PROJECT_PLAN_TEMPLATE.md        # High-level plan
│   ├── PHASE_TASKS_TEMPLATE.md         # Session tasks
│   ├── blog/                           # Blog template
│   ├── ecommerce/                      # E-commerce template
│   ├── saas/                           # SaaS template
│   ├── social/                         # Social network template
│   └── projectmanagement/              # PM template
├── agents/
│   ├── backend-builder.md              # Django executor
│   ├── frontend-builder.md             # Vue executor
│   ├── mobile-builder.md               # React Native executor
│   └── e2e-tester.md                   # Playwright executor
├── infrastructure/
│   ├── checkpoint-manager.ts           # Checkpoint system
│   └── agent-state-schema.md           # State schema
└── references/
    └── PROJECT_STRUCTURE.md            # Reference docs
```

## Important Patterns

### Plan Parser Logic

Agents parse markdown plans into structured data:
- Extract sessions from `## Session X:` headers
- Parse TDD workflow from subsections (`### Step 1: Write Tests FIRST (RED)`)
- Extract file lists from code blocks
- Parse exit criteria from checklist items

### Error Recovery

1. **Test failures in GREEN phase**: Agent auto-retries 2x, then asks for help
2. **Dependency errors**: Agent identifies blockers, suggests fix or asks user
3. **Merge conflicts**: Agent pauses, asks user to resolve manually

### Commit Message Format

```
feat(<scope>): <title>

Completed Session X: <session-title>

Phase: <phase-name>
Tests: X/X passing
Coverage: X%
Time: Xh (estimated: Yh)

Files modified:
- path/to/file1
- path/to/file2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Key Differences from Regular Development

1. **Planning before coding** - Comprehensive requirements and task breakdown upfront
2. **Session-based execution** - Work organized into 2-3 hour sessions
3. **TDD enforcement** - Tests written FIRST, always
4. **Human-in-the-loop** - Checkpoints at every major step
5. **State tracking** - Resume from any point
6. **Agent execution** - Automated implementation following plans

## Common Workflows

### Create and Execute Plan

```bash
# 1. Create plan interactively
/plan-app

# 2. Initialize project
/initialize-project my-blog blog

# 3. Execute sessions one by one
/execute-session my-blog 1
/execute-session my-blog 2
...

# OR execute entire phase
/execute-phase my-blog 1
```

### Resume After Interruption

```bash
# Check where you left off
/show-progress my-blog

# Resume from last checkpoint
/resume-session my-blog
```

### Parallel Development

```bash
# Execute entire phase with parallelization
/execute-phase my-blog 1

# Agent will run independent sessions in parallel
# Saves 20-40% time
```

## Troubleshooting

### Plan too complex
- Choose "Basic" complexity during `/plan-app`
- Request fewer features
- Split into multiple smaller apps

### Sessions too large
- Edit generated `PHASE_X_*.md` files manually
- Split sessions into smaller chunks
- Reduce entities per session

### Context fatigue mid-session
- Take breaks between sessions
- Use `/resume-session` to pick up where you left off

### Generated plan doesn't match vision
- Edit `REQUIREMENTS.md` before starting execution
- Customize template selections during `/plan-app`
- Manually adjust session tasks in `PHASE_X_*.md` files

## Best Practices

1. **Review plans before execution** - Check `REQUIREMENTS.md` and `PROJECT_PLAN.md`
2. **Approve at checkpoints** - Don't rush, review code at each checkpoint
3. **Follow TDD strictly** - Trust the RED-GREEN-REFACTOR workflow
4. **Commit after sessions** - Clean git history with meaningful commits
5. **Use parallelization** - Run `/execute-phase` for faster execution
6. **Track progress** - Use `/show-progress` frequently

## Success Metrics

A successful plan execution has:
- ✅ All tests passing (>85% coverage backend, >85% frontend/mobile)
- ✅ Type checking passing (mypy + TypeScript strict mode)
- ✅ All sessions committed with good messages
- ✅ No skipped sessions (unless intentional)
- ✅ State file up to date
- ✅ Working application ready to deploy
