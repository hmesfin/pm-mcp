# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project Overview

This is the **Project Planner MCP Server** - an MCP (Model Context Protocol) server that transforms app ideas into comprehensive, TDD-driven, session-based implementation plans with GitHub integration.

**Philosophy**: Planning is the bottleneck, not coding. Poor planning leads to project failure. Good plans enable successful agent execution.

## Current State

### ✅ Implemented (Sessions 1-2 Complete)
- **generateProjectPlan** tool - Generates PROJECT_PLAN.md from REQUIREMENTS.md
- **setupGitHubProject** tool - Creates GitHub issues, milestones, labels
- **planParser** service - Parses PROJECT_PLAN.md into structured data
- TypeScript type system - Complete types for all tools and resources
- GitHub integration - Full issue creation with TDD workflows

### 🚧 Next Up (Session 7)
- **trackProgress** tool - Query GitHub for progress metrics
  - Issue: https://github.com/hmesfin/pm-mcp/issues/8
  - Estimate: 3-4 hours
  - Dependencies: generateProjectPlan, setupGitHubProject (both complete)

### 📋 Remaining (Sessions 8-15)
See: https://github.com/hmesfin/pm-mcp/milestones

## Architecture

### Directory Structure

```
project-planner-mcp/
├── mcp-plan/                    # MCP server implementation
│   ├── src/
│   │   ├── tools/              # MCP tool implementations
│   │   │   ├── planning/       # generateProjectPlan, analyzeRequirements, critiquePlan
│   │   │   ├── github/         # setupGitHubProject, trackProgress, syncWithGitHub
│   │   │   └── intelligence/   # reviewArchitecture, estimateEffort
│   │   ├── services/           # Business logic
│   │   │   └── planParser.ts   # Parse PROJECT_PLAN.md
│   │   └── types/              # TypeScript type definitions
│   │       ├── common.ts       # Shared types
│   │       ├── tools.ts        # Tool parameter/return types
│   │       ├── resources.ts    # Resource types
│   │       └── prompts.ts      # Prompt types
│   ├── index.ts                # MCP server entry point
│   ├── REQUIREMENTS.md         # Complete MCP specification
│   └── package.json
├── project-plans/               # Generated plans (output)
│   └── mcp-server/             # Dogfooding: MCP planning itself
│       ├── PROJECT_PLAN.md     # 15 sessions, 5 phases
│       ├── REQUIREMENTS.md     # MCP requirements
│       └── .agent-state.json   # State tracking
├── templates/                   # Plan generation templates
│   ├── blog/, ecommerce/, saas/, social/, projectmanagement/
│   ├── PROJECT_PLAN_TEMPLATE.md
│   └── PHASE_TASKS_TEMPLATE.md
└── docs/                        # Documentation
    ├── PLANNING_GUIDE.md       # User guide
    └── archive/                # Old slash command implementation

```

### MCP Tools (11 total)

**Planning Tools:**
- `conductDiscovery` - Interactive Q&A for requirements
- `generateProjectPlan` - ✅ IMPLEMENTED - Generate plan from requirements
- `analyzeRequirements` - Parse and validate REQUIREMENTS.md
- `critiquePlan` - Review plan quality

**GitHub Tools:**
- `setupGitHubProject` - ✅ IMPLEMENTED - Create issues/milestones/labels
- `trackProgress` - 🚧 NEXT - Query GitHub for metrics
- `syncWithGitHub` - Sync local state with GitHub
- `findNextSession` - Get next available session
- `updateSessionStatus` - Mark sessions as started/completed

**Intelligence Tools:**
- `reviewArchitecture` - Technical feasibility analysis
- `estimateEffort` - Time/complexity estimates

## Development Workflow

### TDD Methodology (Mandatory)

Every session follows RED-GREEN-REFACTOR:

1. **🔴 RED Phase**: Write failing tests FIRST
   ```bash
   npm run test  # Expected: ❌ Tests fail
   ```

2. **🟢 GREEN Phase**: Implement to pass tests
   ```bash
   npm run test         # Expected: ✅ Tests pass
   npm run type-check   # Expected: ✅ No errors
   ```

3. **🔵 REFACTOR Phase**: Improve code quality
   ```bash
   npm run test  # Expected: ✅ Tests still pass
   npm run lint  # Expected: ✅ No issues
   ```

4. **✅ COMMIT Phase**: Git commit after exit criteria met

### Session Exit Criteria

Before marking a session complete:
- [ ] All tests passing (write tests for new tools)
- [ ] Type checking passes (strict mode)
- [ ] Linting passes
- [ ] Code documented (JSDoc comments)
- [ ] Git commit created
- [ ] GitHub issue updated (if applicable)

### Building the MCP

```bash
# Development
cd mcp-plan
npm install
npm run build        # TypeScript compilation
npm run watch        # Watch mode for development

# Type checking
npm run type-check   # Must pass before commits

# Testing (when test suite is built)
npm run test         # Run all tests
```

## Key Files

### `mcp-plan/index.ts`
MCP server entry point. Registers tools and handles requests.

**Structure:**
```typescript
// Tool registration
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [...] };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (name) {
    case "generateProjectPlan":
      return await generateProjectPlan(args);
    case "setupGitHubProject":
      return await setupGitHubProject(args);
    // ... other tools
  }
});
```

### `mcp-plan/src/types/common.ts`
Shared type definitions used across all tools.

**Key types:**
- `ComplexityLevel` - "basic" | "intermediate" | "advanced"
- `ProjectType` - App category
- `Session` - Session structure (title, objectives, estimates)
- `Phase` - Phase structure (sessions, goals, time)
- `ProjectPlan` - Complete plan structure

### `mcp-plan/src/services/planParser.ts`
Parses PROJECT_PLAN.md into structured TypeScript objects.

**Used by:**
- `setupGitHubProject` - Parse plan to create issues
- `trackProgress` - Parse plan to calculate metrics
- `analyzeRequirements` - Validate plan structure

### Templates

**`templates/PROJECT_PLAN_TEMPLATE.md`**
- High-level plan structure
- Variables: `{{APP_NAME}}`, `{{PHASES}}`, etc.

**`templates/PHASE_TASKS_TEMPLATE.md`**
- Detailed session breakdowns
- TDD workflow structure
- Exit criteria

## GitHub Integration

### Labels (16 total)
- **Phase**: `phase-1` to `phase-5`
- **Domain**: `backend`, `frontend`, `mobile`, `e2e`, `infrastructure`
- **TDD**: `red-phase`, `green-phase`, `refactor-phase`
- **Status**: `in-progress`, `blocked`, `ready-for-review`

### Issues
One issue per session with:
- 🎯 Objectives
- 🔴 RED phase tasks (write tests)
- 🟢 GREEN phase tasks (implement)
- 🔵 REFACTOR phase tasks (optimize)
- ✅ Exit criteria checklist
- 📊 Metadata (estimates, dependencies)

**Current GitHub Project:**
- Repository: https://github.com/hmesfin/pm-mcp
- 15 issues created (sessions 1-15)
- 5 milestones (phases 1-5)

## Dogfooding

**This MCP was planned using itself!**

1. Created `mcp-plan/REQUIREMENTS.md` manually
2. Used `generateProjectPlan` to create `project-plans/mcp-server/PROJECT_PLAN.md`
3. Used `setupGitHubProject` to create all GitHub issues
4. Now following the plan to build the remaining tools

**See:** `project-plans/mcp-server/` for the complete plan

## Session Sizing

Context budget management:
- **Basic apps**: ~15K tokens/session (30K+ buffer)
- **Intermediate apps**: ~18K tokens/session (30K+ buffer)
- **Advanced apps**: ~20K tokens/session (30K+ buffer)

**Backend sessions:**
- 3-5 models, serializers, or ViewSets
- 1-2 complex workflows

**Frontend sessions:**
- 5-7 components
- 3-4 views
- 3-5 composables

## Common Patterns

### Adding a New MCP Tool

1. **Define types** in `src/types/tools.ts`:
   ```typescript
   export interface MyToolParams {
     param1: string;
     param2: number;
   }

   export interface MyToolResult {
     success: boolean;
     data: SomeType;
   }
   ```

2. **Implement tool** in `src/tools/<category>/myTool.ts`:
   ```typescript
   export async function myTool(
     params: MyToolParams
   ): Promise<MyToolResult> {
     // Implementation
   }
   ```

3. **Register in index.ts**:
   ```typescript
   // In ListToolsRequestSchema handler
   {
     name: "myTool",
     description: "...",
     inputSchema: { /* Zod schema */ }
   }

   // In CallToolRequestSchema handler
   case "myTool":
     return await myTool(args);
   ```

4. **Write tests** (RED-GREEN-REFACTOR)

5. **Update types** if needed

6. **Document** in README.md

### Using GitHub API

Tools use Octokit REST API via environment variables:

```typescript
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Example: List issues
const { data: issues } = await octokit.issues.listForRepo({
  owner: "username",
  repo: "repo-name"
});
```

**Token setup:**
- User provides token in MCP config
- Scopes needed: `repo` (all), `admin:org` (read:org)

### Parsing Plans

Use the `planParser` service:

```typescript
import { parsePlan } from '../services/planParser.js';
import fs from 'fs/promises';

const content = await fs.readFile(planPath, 'utf-8');
const plan = parsePlan(content);

// plan.phases[0].sessions[0].title
// plan.totalSessions
// plan.totalTime
```

## Important Notes

### For New Sessions

When starting a new session:
1. Check the GitHub issue for that session
2. Read the objectives and dependencies
3. Follow TDD strictly (RED-GREEN-REFACTOR)
4. Update the issue when complete
5. Commit with descriptive message

### Before Committing

Run these checks:
```bash
npm run build        # Must succeed
npm run type-check   # Must pass
npm run test         # Must pass (when tests exist)
```

### Documentation

Keep these in sync:
- `README.md` - User-facing documentation
- `docs/PLANNING_GUIDE.md` - User guide
- `CLAUDE.md` - This file (for Claude Code)
- `mcp-plan/REQUIREMENTS.md` - Complete specification

## Migration Notes

This project was reorganized from a slash command system to an MCP server.

**Old implementation:** `docs/archive/slash-commands/`
**Migration guide:** `docs/archive/MIGRATION.md`

The templates and plan structure remain the same, only the delivery mechanism changed (slash commands → MCP tools).

## Resources

- **Main README**: [README.md](README.md)
- **User Guide**: [docs/PLANNING_GUIDE.md](docs/PLANNING_GUIDE.md)
- **Requirements**: [mcp-plan/REQUIREMENTS.md](mcp-plan/REQUIREMENTS.md)
- **GitHub Issues**: https://github.com/hmesfin/pm-mcp/issues
- **Migration Guide**: [docs/archive/MIGRATION.md](docs/archive/MIGRATION.md)

---

**Current Focus:** Implementing `trackProgress` tool (Session 7)
**Next Issue:** https://github.com/hmesfin/pm-mcp/issues/8
