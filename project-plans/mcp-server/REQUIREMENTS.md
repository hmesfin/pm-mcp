# Requirements: Project Planner MCP Server

## Overview

Build a Model Context Protocol (MCP) server that provides AI-driven project planning and execution orchestration with GitHub integration. The server enables intelligent project planning through interactive discovery, requirements analysis, and automated GitHub project setup.

## Core Entities

### 1. Project
- **Fields**: name, type, complexity, created_at, completed_at, plan_path, state_path, github_owner, github_repo
- **Types**: blog, ecommerce, saas, social, projectmanagement, custom
- **Complexity Levels**: basic, intermediate, advanced
- **Stored in**: SQLite database + file system (PROJECT_PLAN.md)

### 2. Session
- **Fields**: number, title, phase, domain, objectives, tdd_workflow, files_to_create, dependencies, exit_criteria, estimated_time, status, github_issue, github_pr
- **Domains**: backend, frontend, mobile, e2e, infrastructure
- **Status**: not_started, in_progress, red_phase, green_phase, refactor_phase, awaiting_approval, completed, blocked, skipped
- **TDD Workflow**: red_phase (write tests), green_phase (implement), refactor_phase (optimize)

### 3. Pattern
- **Fields**: name, category, subcategory, description, when_to_use, example_code, usage_count, success_rate
- **Categories**: backend, frontend, mobile, infrastructure
- **Purpose**: Best practices database learned from past projects

### 4. Metrics
- **Fields**: project_id, metric_type, metric_value, metric_unit, recorded_at
- **Types**: estimation_accuracy, velocity, coverage, time_variance
- **Purpose**: Historical data for intelligent estimation

## MCP Tools (11 Total)

### Planning Tools (4)

#### 1. conductDiscovery
**Purpose**: Interactive Q&A to gather requirements
**Input**:
- projectType (optional)
- conversationHistory (array of {role, content, timestamp})
**Output**:
- questions (array of DiscoveryQuestion)
- challenges (array of Challenge - things user should reconsider)
- suggestions (array of Suggestion - recommended features/approaches)
- risks (array of Risk - identified risks)
- nextQuestion (next question to ask, or null if complete)
- summary (DiscoverySummary if complete)

**Behavior**:
- Ask domain-specific questions based on project type
- Challenge assumptions ("You said real-time but no WebSocket infrastructure?")
- Find gaps ("No mention of GDPR compliance for user data")
- Learn from past projects ("Similar e-commerce projects needed X")
- Follow-up questions based on answers
- Progressive disclosure (don't ask everything at once)

#### 2. analyzeRequirements
**Purpose**: Analyze requirements for completeness, conflicts, gaps
**Input**:
- requirements (markdown string)
- projectType (optional)
**Output**:
- valid (boolean)
- completeness (0-100)
- clarity (0-100)
- feasibility (0-100)
- gaps (array of Gap)
- conflicts (array of Conflict)
- ambiguities (array of Ambiguity)
- suggestions (array of Suggestion)
- risks (array of Risk)
- estimatedComplexity (basic/intermediate/advanced)

**Behavior**:
- Check for missing data models
- Check for missing API endpoints
- Check for missing UI components
- Find conflicting requirements
- Find ambiguous language
- Suggest improvements

#### 3. generateProjectPlan
**Purpose**: Generate PROJECT_PLAN.md and REQUIREMENTS.md from discovery
**Input**:
- requirementsPath OR requirements (string)
- discoverySummary (from conductDiscovery, optional)
- outputPath (where to write files)
- templateType (blog/ecommerce/saas/social/projectmanagement/custom)
- customizations (object)
**Output**:
- success (boolean)
- projectPlan (ProjectPlan object)
- filesCreated (array of file paths)
- warnings (array of strings)
- errors (array of strings)

**Behavior**:
- Read template files (PROJECT_PLAN_TEMPLATE.md, PHASE_TASKS_TEMPLATE.md)
- Replace {{VARIABLES}} with actual values
- Break down into phases and sessions
- Size sessions appropriately (15-20K tokens)
- Identify dependencies between sessions
- Calculate estimates based on complexity
- Write PROJECT_PLAN.md, REQUIREMENTS.md to outputPath

#### 4. critiquePlan
**Purpose**: Review existing plan for issues and improvements
**Input**:
- planPath (path to PROJECT_PLAN.md)
**Output**:
- overall (score, strengths, weaknesses)
- sessions (array of SessionCritique)
- dependencies (valid, circularDependencies, missingDependencies)
- parallelization (opportunities, estimatedTimeSavings)
- risks (array of Risk)
- recommendations (array of strings)

**Behavior**:
- Parse PROJECT_PLAN.md
- Check dependency graph for cycles
- Identify parallelization opportunities
- Check session sizing (not too large)
- Validate TDD workflow completeness
- Compare to patterns from database

### GitHub Integration Tools (5)

#### 5. setupGitHubProject
**Purpose**: Create GitHub issues, milestones, project board from plan
**Input**:
- owner (GitHub username/org)
- repo (repository name)
- planPath (path to PROJECT_PLAN.md)
- createProject (boolean, default true)
- createMilestones (boolean, default true)
- labels (LabelConfig object)
**Output**:
- success (boolean)
- projectUrl (GitHub Project board URL)
- issuesCreated (array of {sessionNumber, issueNumber, title, url})
- milestonesCreated (array of {phaseNumber, milestoneNumber, title, url})
- labelsCreated (array of label names)
- errors (array of strings)

**Behavior**:
- Parse PROJECT_PLAN.md to extract sessions
- Create GitHub labels (phase-1, backend, session-1, red-phase, etc.)
- Create milestones (one per phase)
- Create issues (one per session) with:
  - Title: "Session X: [Title]"
  - Body: Objectives, TDD workflow, exit criteria, files to create
  - Labels: phase, domain, session number
  - Milestone: corresponding phase
  - Dependencies: using "Depends on #X" syntax
- Create GitHub Project board with columns:
  - 📋 Planned
  - 🔴 RED Phase
  - 🟢 GREEN Phase
  - 🔵 REFACTOR Phase
  - 👀 Review
  - ✅ Done
- Add all issues to project board

#### 6. syncWithGitHub
**Purpose**: Sync state between .agent-state.json and GitHub
**Input**:
- owner, repo
- direction (pull/push/bidirectional)
- statePath (path to .agent-state.json, optional)
**Output**:
- success (boolean)
- sessionsSynced (number)
- updates (array of {sessionNumber, field, oldValue, newValue, source})
- conflicts (array of {sessionNumber, field, githubValue, localValue})
- errors (array of strings)

**Behavior**:
- **Pull**: Query GitHub issues for status/labels → update .agent-state.json
- **Push**: Read .agent-state.json → update GitHub issue labels/status
- **Bidirectional**: Pull first, then push any local changes
- Detect conflicts (both changed since last sync)
- Update issue mapping (sessionNumber → issueNumber)
- Update PR mapping (sessionNumber → prNumber)

#### 7. trackProgress
**Purpose**: Query GitHub for project progress and metrics
**Input**:
- owner, repo
- format (summary/detailed/json)
**Output**:
- project (name)
- status (not_started/in_progress/completed/paused)
- progress (overall, byPhase, byDomain metrics)
- metrics (totalTests, avgCoverage, timeSpent, velocity, estimatedCompletion)
- pullRequests (open, merged, draft)
- blockers (array of Blocker)
- upNext (next Session to execute)
- recommendations (array of strings)

**Behavior**:
- Query GitHub issues for project
- Parse labels to determine session status
- Calculate progress percentages
- Parse issue comments for metrics (tests, coverage)
- Find PRs linked to sessions
- Identify blockers (sessions waiting on dependencies)
- Suggest next session based on dependencies

#### 8. updateSessionStatus
**Purpose**: Update session status in GitHub issue
**Input**:
- owner, repo, sessionNumber
- status (SessionStatus enum)
- phase (TDDPhase enum, optional)
- metrics (TestMetrics object, optional)
- comment (string, optional)
- moveProjectCard (boolean, default true)
**Output**:
- success (boolean)
- issueNumber (number)
- commentAdded (boolean)
- labelsUpdated (array of strings)
- cardMoved (boolean)
- newColumn (string, optional)

**Behavior**:
- Find GitHub issue for session
- Update labels based on status/phase
- Add comment with metrics if provided
- Move project board card to appropriate column
- Record in database

#### 9. findNextSession
**Purpose**: Find next session to execute
**Input**:
- owner, repo
- considerDependencies (boolean, default true)
- preferDomain (Domain enum, optional)
**Output**:
- found (boolean)
- session (Session object, optional)
- issueNumber (number, optional)
- issueUrl (string, optional)
- blockedBy (array of session numbers, optional)
- parallelOptions (array of Session, optional)

**Behavior**:
- Query GitHub for incomplete sessions
- Filter by satisfied dependencies
- Filter by preferDomain if specified
- Find sessions that can run in parallel
- Return highest priority session

### Intelligence Tools (2)

#### 10. reviewArchitecture
**Purpose**: Review architecture for patterns, anti-patterns, security
**Input**:
- planPath OR plan (string)
- requirementsPath OR requirements (string)
- focus (backend/frontend/mobile/infrastructure/all)
**Output**:
- overall (score, strengths, concerns)
- patterns (recognized, recommended, antiPatterns)
- techStack (appropriate, recommendations)
- scalability (score, concerns, recommendations)
- security (score, vulnerabilities, recommendations)
- testability (score, concerns, recommendations)

**Behavior**:
- Parse plan and requirements
- Match against pattern database
- Identify recognized patterns (e.g., "Repository Pattern")
- Recommend missing patterns
- Flag anti-patterns (e.g., "God Object", "Circular Dependencies")
- Security analysis (auth, authorization, data protection)
- Scalability analysis (caching, database design, API design)
- Testability analysis (test coverage targets, TDD workflow)

#### 11. estimateEffort
**Purpose**: Data-driven estimation from historical data
**Input**:
- requirements OR plan (string)
- complexity (basic/intermediate/advanced, optional)
- features (array of strings, optional)
- similarProjects (array of project names, optional)
**Output**:
- total (sessions, time, confidence)
- byPhase (array of {phase, sessions, time, confidence})
- byDomain (array of {domain, sessions, time})
- breakdown (array of {feature, sessions, time, complexity})
- adjustments (array of {factor, impact, reason})
- risks (array of risk objects)
- historicalComparison (array of similar projects with variance)

**Behavior**:
- Parse requirements to extract features
- Query database for similar past projects
- Calculate base estimate from complexity
- Adjust based on features (auth +X hours, payments +Y hours)
- Apply historical variance (user tends to underestimate auth by 40%)
- Calculate confidence based on similarity to past projects
- Identify estimation risks

## MCP Resources (4 Categories)

### 1. project://
- **URIs**:
  - `project://list` - All projects
  - `project://{name}` - Specific project
- **Content**: ProjectPlan + AgentState + GitHub info

### 2. template://
- **URIs**:
  - `template://list` - All templates
  - `template://{type}` - Specific template (blog, ecommerce, etc.)
  - `template://{type}/PROJECT_PLAN` - Template file
- **Content**: Template metadata or markdown content

### 3. pattern://
- **URIs**:
  - `pattern://list` - All patterns
  - `pattern://{category}` - Patterns by category (backend, frontend, etc.)
  - `pattern://{category}/{name}` - Specific pattern
- **Content**: Pattern details with examples

### 4. metrics://
- **URIs**:
  - `metrics://all` - All metrics aggregated
  - `metrics://estimation` - Estimation accuracy metrics
  - `metrics://velocity` - Velocity metrics
- **Content**: MetricsData with historical comparisons

## MCP Prompts (3)

### 1. discovery-questions
**Purpose**: Generate smart discovery questions
**Arguments**: projectType, previousAnswers
**Output**: Prompt with context-aware questions

### 2. architecture-review
**Purpose**: Generate architecture review prompt
**Arguments**: plan, requirements, focus
**Output**: Detailed review prompt

### 3. estimate-effort
**Purpose**: Generate estimation prompt with history
**Arguments**: requirements, complexity, similarProjects
**Output**: Estimation prompt with historical context

## Database Schema

### Tables

#### projects
- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE)
- type (TEXT)
- complexity (TEXT)
- created_at (INTEGER)
- completed_at (INTEGER, nullable)
- plan_path (TEXT)
- state_path (TEXT)
- github_owner (TEXT, nullable)
- github_repo (TEXT, nullable)

#### sessions
- id (INTEGER PRIMARY KEY)
- project_id (INTEGER FK)
- session_number (INTEGER)
- title (TEXT)
- phase (INTEGER)
- domain (TEXT)
- status (TEXT)
- estimated_time (TEXT)
- actual_time (TEXT, nullable)
- tests_written (INTEGER)
- tests_passing (INTEGER)
- coverage (REAL)
- started_at (INTEGER, nullable)
- completed_at (INTEGER, nullable)
- github_issue (INTEGER, nullable)
- github_pr (INTEGER, nullable)
- UNIQUE(project_id, session_number)

#### patterns
- id (INTEGER PRIMARY KEY)
- name (TEXT UNIQUE)
- category (TEXT)
- subcategory (TEXT)
- description (TEXT)
- when_to_use (TEXT)
- example_code (TEXT)
- example_language (TEXT)
- usage_count (INTEGER DEFAULT 0)
- success_count (INTEGER DEFAULT 0)

#### metrics
- id (INTEGER PRIMARY KEY)
- project_id (INTEGER FK)
- metric_type (TEXT)
- metric_value (REAL)
- metric_unit (TEXT)
- recorded_at (INTEGER)

#### learnings
- id (INTEGER PRIMARY KEY)
- project_id (INTEGER FK)
- category (TEXT)
- title (TEXT)
- description (TEXT)
- impact (TEXT)
- created_at (INTEGER)

## File System Structure

```
~/.project-planner/
├── database.sqlite                 # SQLite database
├── backups/                        # Database backups
│   └── database-2025-01-15.sqlite
├── templates/                      # Custom templates
│   └── my-custom-template/
│       ├── PROJECT_PLAN.md
│       └── REQUIREMENTS.md
└── config.json                     # User configuration
```

```
project-plans/{project-name}/
├── REQUIREMENTS.md                 # Generated requirements
├── PROJECT_PLAN.md                 # Generated plan
├── .agent-state.json               # Execution state
└── tasks/                          # (legacy, may not be needed)
    └── PHASE_1_*.md
```

## Integration Points

### With Existing .claude/ System
- MCP generates plans → writes to `.claude/` format
- `.claude/` agents execute → update via MCP
- Bidirectional sync via `.agent-state.json`

### With GitHub MCP
- Uses GitHub MCP tools for all GitHub operations
- `setupGitHubProject` calls GitHub MCP to create issues
- `trackProgress` calls GitHub MCP to query issues
- `syncWithGitHub` calls GitHub MCP for updates

### With Template System
- Reads from existing `.claude/templates/` directory
- Supports custom templates in `~/.project-planner/templates/`
- Variable replacement with `{{VARIABLE}}` syntax

## API Contracts

### Template Variables
- `{{APP_NAME}}` - Application name
- `{{APP_DESCRIPTION}}` - Brief description
- `{{COMPLEXITY_LEVEL}}` - basic/intermediate/advanced
- `{{PROJECT_TYPE}}` - blog/ecommerce/saas/social/projectmanagement
- `{{MOBILE_STACK}}` - Flutter or "Not applicable"
- `{{CORE_FEATURES}}` - Bulleted list
- `{{INTEGRATIONS}}` - Third-party services
- `{{PHASE_X_SESSIONS}}` - Session breakdown
- `{{PHASE_X_TIME}}` - Estimated time

### GitHub Issue Format
```markdown
# Session X: [Title]

## 🎯 Objectives
- Objective 1
- Objective 2

## 🔴 RED Phase (XX min)
- [ ] Write test 1
- [ ] Write test 2

## 🟢 GREEN Phase (XX min)
- [ ] Implement feature 1
- [ ] Implement feature 2

## 🔵 REFACTOR Phase (XX min)
- [ ] Add docstrings
- [ ] Optimize

## ✅ Exit Criteria
- [ ] XX+ tests passing
- [ ] XX%+ coverage
- [ ] Type checking passes

## 📊 Metadata
- Phase: X
- Domain: backend/frontend/mobile
- Estimated Time: X.Xh
- Dependencies: #Y, #Z

## 🔗 Links
- [PROJECT_PLAN.md](...)
- [REQUIREMENTS.md](...)
```

## Testing Strategy

### Unit Tests
- Test each tool in isolation
- Mock GitHub API calls
- Mock file system operations
- Test database operations

### Integration Tests
- Test tool combinations (generateProjectPlan → setupGitHubProject)
- Test GitHub integration end-to-end
- Test state synchronization

### Dogfooding Tests
- Use MCP to plan MCP implementation
- Track MCP development via GitHub
- Validate accuracy of estimates

## Performance Requirements

### Response Times
- `conductDiscovery`: < 2s per question
- `generateProjectPlan`: < 5s for basic, < 10s for advanced
- `setupGitHubProject`: < 30s for 20 sessions
- `trackProgress`: < 3s

### Scalability
- Support 100+ projects in database
- Handle plans with 50+ sessions
- Efficient template parsing (cache compiled templates)

## Security Requirements

### GitHub Token
- Store in environment variable `GITHUB_TOKEN`
- Never log token
- Validate token on startup
- Clear error messages if token invalid

### Database
- No sensitive data in database
- File paths only (not file contents)
- Backup before migrations

### File Operations
- Validate all file paths (no directory traversal)
- Create directories if missing
- Handle file permission errors gracefully

## Error Handling

### Graceful Degradation
- If GitHub unavailable → local-only mode
- If database locked → retry with exponential backoff
- If template missing → use default

### User-Friendly Errors
- Clear error messages
- Suggest fixes (e.g., "Set GITHUB_TOKEN environment variable")
- Log detailed errors to stderr
- Return sanitized errors to user

## Configuration

### User Config (~/.project-planner/config.json)
```json
{
  "database": {
    "path": "~/.project-planner/database.sqlite"
  },
  "github": {
    "token": "${GITHUB_TOKEN}",
    "projectAutomation": true
  },
  "intelligence": {
    "enableLearning": true,
    "trackMetrics": true
  }
}
```

### Environment Variables
- `GITHUB_TOKEN` - GitHub personal access token
- `PROJECT_PLANNER_DB` - Override database path
- `PROJECT_PLANNER_CONFIG` - Override config path

## Success Criteria

### For MCP Server
- ✅ All 11 tools implemented and working
- ✅ All 4 resource categories accessible
- ✅ All 3 prompts functional
- ✅ Database operations reliable
- ✅ GitHub integration working
- ✅ Type safety enforced (TypeScript strict mode)
- ✅ Error handling comprehensive
- ✅ Documentation complete

### For Dogfooding
- ✅ Used MCP to plan MCP implementation
- ✅ GitHub project set up via MCP
- ✅ Progress tracked via MCP
- ✅ Estimates validated against actual time
- ✅ Patterns learned and stored

## Open Questions

1. **Template Discovery**: Should we auto-detect templates in multiple locations?
2. **Pattern Learning**: Should patterns be auto-learned from successful projects?
3. **Estimation Tuning**: How many projects needed for accurate estimates?
4. **GitHub Permissions**: What minimum permissions needed for token?
5. **Concurrent Execution**: Support multiple users/projects simultaneously?
