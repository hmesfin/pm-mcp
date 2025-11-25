# App Planning System Guide

This starter template includes an AI-driven planning system that transforms your app idea into a comprehensive, TDD-driven, session-based implementation plan.

**Philosophy**: Planning is the bottleneck, not coding. Poor planning leads to project failure. Good plans enable successful agent execution.

## Quick Start

### Step 1: Invoke the Planning Tool

```bash
/plan-app
```

This launches an interactive planning process. You can choose to start from a **pre-built template** (faster) or build **from scratch** (fully custom).

### Step 1a: Choose Template or From Scratch (NEW!)

**Option A: Pre-Built Template** (5-10 minutes):
```
[1] 📝 Blog Platform - Posts, comments, categories, tags
[2] 🛒 E-Commerce Store - Products, cart, checkout, payments
[3] 💼 SaaS Multi-Tenant - Organizations, teams, billing
[4] 👥 Social Network - Posts, friends, feeds, real-time
[5] 📊 Project Management - Projects, tasks, boards
```

**Option B: From Scratch** (15-20 minutes):
```
[6] ✨ Start from Scratch - Custom app with full discovery
```

**When to use templates:**
- Building a common app type (blog, e-commerce, SaaS, social, PM)
- Want to start quickly with proven structure
- Need customization options (enable/disable features)

**When to build from scratch:**
- Unique app idea that doesn't fit templates
- Need full control over every decision
- Exploring multiple approaches

### Step 1b: Template Customization (if using template)

If you selected a template, Claude will ask customization questions:

**Example - Blog Platform**:
```
1. Enable comments? [Y/n]
2. Enable categories/tags? [Y/n]
3. Multi-author support? [y/N]
4. Media uploads? [Images only / Images + Videos / No]
```

**Example - E-Commerce Store**:
```
1. Product variants (size, color)? [y/N]
2. Inventory tracking? [Y/n]
3. Subscriptions? [y/N]
4. Reviews/Ratings? [Y/n]
```

Based on your answers, Claude will customize the plan (add/remove sessions, adjust estimates).

### Step 2: Answer Discovery Questions (if from scratch)

Claude will ask intelligent questions about:
- App name and purpose
- Complexity level (Basic/Intermediate/Advanced)
- Core entities (data models)
- Relationships between entities
- Key workflows and user journeys
- Authentication requirements
- Real-time features
- Mobile requirements
- Third-party integrations
- Performance/scale needs

**Tip**: Be specific in your answers. Claude will ask follow-up questions based on your responses.

### Step 2.5: Mobile Feature Selection (NEW - Week 3!)

After core features are defined, Claude will ask about mobile requirements:

```
Mobile requirements for your app?

[1] 🌐 Web only (no mobile app)
[2] 📱 Mobile with full feature parity (all features)
[3] 🎯 Mobile with selective features (choose which) ⭐ RECOMMENDED
[4] 📱 Mobile-first (mobile is primary)
```

#### Option 1: Web Only
No mobile planning. Generates web-only phases.

#### Option 2: Full Feature Parity
All web features → mobile. May result in complex mobile UI.

#### Option 3: Selective Features (RECOMMENDED)

**Step 1** - Select which web features go to mobile:
```
Which features do you need in the mobile app?

  [✓] Product catalog
  [✓] Shopping cart
  [✓] Checkout
  [✓] Order tracking
  [ ] Admin dashboard (too complex for mobile)
  [ ] Analytics (desktop-oriented)
  [ ] Inventory management (bulk operations)
```

**Step 2** - Add mobile-specific features:
```
Any mobile-specific features?

  [✓] Push notifications (order updates)
  [✓] Biometric login (Face ID / Touch ID)
  [✓] Offline mode (cache products)
  [ ] Camera (scan barcodes)
  [ ] Geolocation (nearby stores)
```

**Result** - Platform Feature Matrix in REQUIREMENTS.md:

| Feature | Web | Mobile | Notes |
|---------|-----|--------|-------|
| Product catalog | ✅ | ✅ | Mobile: infinite scroll |
| Shopping cart | ✅ | ✅ | Mobile: bottom sheet |
| Checkout | ✅ | ✅ | Mobile: Apple/Google Pay |
| Admin dashboard | ✅ | ❌ | Web only - complex UI |
| Push notifications | ❌ | ✅ | Mobile only - FCM/APNS |

**Time Savings Example**:
- Full parity: 35 sessions total
- Selective (4 web + 3 mobile-only): 26 sessions
- **Saved**: ~15-20 hours, 9 sessions

#### Option 4: Mobile-First
Mobile is primary, web is optional/secondary.

### Step 3: Review Generated Documents

After discovery, Claude generates:

1. **Technical Requirements** (`project-plans/<app-name>/REQUIREMENTS.md`)
   - Detailed data models with fields, relationships, indexes
   - API endpoints with exact routes, methods, permissions
   - Frontend component hierarchy
   - Validation rules (backend + Zod schemas)
   - Test coverage requirements

2. **High-Level Plan** (`project-plans/<app-name>/PROJECT_PLAN.md`)
   - Overview and technical stack
   - Phase breakdown with timelines
   - Success criteria
   - Testing strategy

3. **Phase Task Documents** (`project-plans/<app-name>/tasks/PHASE_X_*.md`)
   - Detailed session-by-session breakdowns
   - TDD workflows (RED-GREEN-REFACTOR)
   - Files to create/modify
   - Test cases to write
   - Exit criteria for each session

### Step 4: Execute Sessions

Work through each session following the TDD workflow:

1. **RED**: Write failing tests
2. **GREEN**: Implement to pass tests
3. **REFACTOR**: Optimize while keeping tests passing

Each session includes:
- Clear objectives
- Estimated context usage (to avoid fatigue)
- Exact commands to run
- Exit criteria checklist

## Example Usage

### Example 1: Basic Blog App

**User**: `/plan-app`

**Claude**: "What app would you like to build?"

**User**: "A blog platform"

**Claude**: "Let me ask some questions to scope this:
1. Complexity: Basic (posts + comments), Intermediate (categories, tags, drafts), or Advanced (multi-author, roles, publishing workflow)?
2. Core features: Besides posts, do you need comments? Likes? Search?
3. User types: Just authors, or different roles?
4. Media: Images in posts? Videos?
5. Social: Following authors? Notifications?"

**User**: "Intermediate. Posts with categories, tags, and comments. Just one author type. Images in posts. No social features."

**Claude**: [Generates complete plan with 4 phases, 11 sessions]

### Generated Plan Structure

```
project-plans/blog/
├── REQUIREMENTS.md
├── PROJECT_PLAN.md
└── tasks/
    ├── PHASE_1_BACKEND_FOUNDATION.md
    ├── PHASE_2_FRONTEND_FOUNDATION.md
    ├── PHASE_3_INTEGRATION_TESTING.md
    └── PHASE_4_POLISH_DEPLOY.md
```

## Session Organization

### Typical Backend Sessions
- **Session 1**: Models + Django Admin (TDD)
- **Session 2**: Serializers + ViewSets (TDD)
- **Session 3**: Business Logic + Celery Tasks (TDD, if needed)
- **Session 4**: Permissions + Security (TDD)

### Typical Frontend Sessions
- **Session 5**: Generate API Client + Zod Schemas
- **Session 6**: Composables + Stores (TDD)
- **Session 7**: UI Components (TDD)
- **Session 8**: Views + Routing (TDD)

### Integration & Polish Sessions
- **Session 9**: E2E Workflows + Error Handling
- **Session 10**: Performance Optimization
- **Session 11**: Final Testing + Deployment Prep

## Context Budget Management

Each session is sized to avoid context fatigue:

- **Basic apps**: ~15K tokens/session
- **Intermediate apps**: ~18K tokens/session
- **Advanced apps**: ~20K tokens/session

Target: Leave 30K+ tokens buffer for conversation and debugging.

## Customization

The generated plans are **markdown files** - you can edit them before execution:

- Add/remove sessions
- Adjust complexity
- Change priorities
- Add custom requirements

## Best Practices

### During Discovery
1. **Be specific**: "Users can create posts with images" vs "posting feature"
2. **Think workflows**: Describe end-to-end user journeys
3. **Mention constraints**: Performance needs, scale expectations
4. **Ask questions**: If Claude's questions aren't clear, ask for clarification

### During Execution
1. **Follow TDD strictly**: RED → GREEN → REFACTOR
2. **One session at a time**: Don't jump ahead
3. **Check exit criteria**: Ensure all checkboxes are done
4. **Commit after sessions**: Clean git history
5. **Run type checking**: Catch errors early

### Session Management
1. **Take breaks**: Between sessions to avoid fatigue
2. **Review generated code**: Don't blindly trust AI
3. **Test thoroughly**: Run all tests, not just new ones
4. **Document changes**: Update docs if deviating from plan

## Integration with Existing Starter Features

The planning tool understands the starter's architecture:

### Backend (Django)
- Custom user model: `apps.users.User`
- API-only (no Django templates except emails)
- DRF with OpenAPI schema generation
- Token + JWT authentication
- Docker-first workflow

### Frontend (Vue.js)
- Composition API with `<script setup lang="ts">`
- Shadcn-vue components (copy-paste, not npm)
- Auto-generated API client from OpenAPI
- Zod validation (mirrors backend)
- TanStack Query for data fetching

### Infrastructure
- Docker Compose for all services
- PostgreSQL database
- Redis for caching
- Celery for async tasks
- Mailpit for local email testing

## Troubleshooting

### "The plan is too complex"
- Choose "Basic" complexity during discovery
- Request fewer features
- Split into multiple apps

### "Sessions are too large"
- Edit phase task documents
- Split sessions manually
- Reduce entities per session

### "Context fatigue mid-session"
- Take a break
- Resume with: "Continue Session X from exit criteria"
- Claude will check what's done and continue

### "Generated plan doesn't match my vision"
- Edit `REQUIREMENTS.md` and phase task documents
- Re-run discovery with more specific answers
- Manually adjust sessions before execution

## Advanced Usage

### Multi-App Projects

For complex systems, run `/plan-app` multiple times:

1. `/plan-app` → Core app (users, auth)
2. `/plan-app` → Feature app (e.g., blog)
3. `/plan-app` → Feature app (e.g., marketplace)

Each generates its own plan in `project-plans/<app-name>/`.

### Partial Planning

You can plan just backend or just frontend:
- During discovery, specify "Backend only" or "Frontend only"
- Claude will adjust phases accordingly

### Custom Templates

Advanced users can modify templates in `.claude/templates/`:
- `PROJECT_PLAN_TEMPLATE.md`
- `PHASE_TASKS_TEMPLATE.md`

## File Locations

- **Slash Command**: `.claude/commands/plan-app.md`
- **Templates**: `.claude/templates/`
- **Generated Plans**: `project-plans/<app-name>/`

## Example Commands

### During Session Execution

```bash
# Backend testing
docker compose run --rm django pytest apps/<app>/tests/
docker compose run --rm django coverage run -m pytest
docker compose run --rm django mypy apps/<app>

# Frontend testing
docker compose run --rm frontend npm run test:run
docker compose run --rm frontend npm run type-check

# Generate API client (after backend changes)
docker compose run --rm frontend npm run generate:api

# Migrations
docker compose run --rm django python manage.py makemigrations
docker compose run --rm django python manage.py migrate
```

## Support

If you encounter issues:
1. Check `DEBUG_DOGMA.md` for debugging patterns
2. Review `DEV_WORKFLOW.md` for command reference
3. Check `ARCHITECTURE.md` for structural guidance

## Contributing

Improvements to the planning system:
1. Edit `.claude/commands/plan-app.md`
2. Update templates in `.claude/templates/`
3. Test with different app types
4. Document new patterns

---

**Ready to plan your first app?** Run `/plan-app` and let Claude guide you through the process! 🚀
