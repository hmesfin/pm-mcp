# Project Planner MCP Server

AI-driven project planning and execution orchestrator with GitHub integration.

[![npm version](https://img.shields.io/npm/v/project-planner-mcp.svg)](https://www.npmjs.com/package/project-planner-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

### Claude Code (Recommended)

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "npx",
      "args": ["-y", "project-planner-mcp"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

### Manual Installation

```bash
npm install -g project-planner-mcp
```

Then add to your MCP settings:

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "project-planner-mcp",
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

### GitHub Token

Get a GitHub Personal Access Token at https://github.com/settings/tokens

Required scopes:
- `repo` (all)
- `admin:org` (read:org) - optional, for organization projects

## Overview

This MCP server provides intelligent project planning capabilities with GitHub integration, combining:

- **Interactive Discovery** - AI-driven Q&A that challenges assumptions and finds gaps
- **Requirements Analysis** - Deep analysis for completeness, conflicts, and feasibility
- **Project Planning** - Automated generation of comprehensive project plans
- **GitHub Integration** - Full orchestration of issues, projects, milestones, and PRs
- **Progress Tracking** - Real-time sync between local state and GitHub
- **Intelligence Engine** - Cross-project learning and pattern recognition

## Architecture

```
project-planner-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                    # MCP server entry point
│   ├── types/
│   │   ├── tools.ts                # Tool parameter/return types
│   │   ├── resources.ts            # Resource types
│   │   ├── prompts.ts              # Prompt types
│   │   └── common.ts               # Shared types
│   ├── tools/
│   │   ├── planning/               # Planning tools
│   │   ├── github/                 # GitHub integration
│   │   └── intelligence/           # Intelligence tools
│   ├── resources/                  # Resource handlers
│   ├── prompts/                    # Prompt handlers
│   ├── services/                   # Business logic
│   └── database/                   # SQLite database
```

## Tools (11 total)

### Planning Tools (4)
1. **conductDiscovery** - Interactive AI-driven Q&A with assumption checking
2. **analyzeRequirements** - Gap finding, conflict detection, feasibility analysis
3. **generateProjectPlan** - Create PROJECT_PLAN.md and REQUIREMENTS.md files
4. **critiquePlan** - Review existing plans for issues and improvements

### GitHub Integration Tools (5)
5. **setupGitHubProject** - Create issues, milestones, project board from plan
6. **syncWithGitHub** - Bidirectional sync between .agent-state.json and GitHub
7. **trackProgress** - Query GitHub for progress metrics and status
8. **updateSessionStatus** - Update session status in GitHub issue
9. **findNextSession** - Find next session based on dependencies

### Intelligence Tools (2)
10. **reviewArchitecture** - Review for patterns, anti-patterns, security, scalability
11. **estimateEffort** - Data-driven estimates from historical project data

## Resources (4 categories)

1. **Projects** (`project://*`) - Access to all tracked projects
2. **Templates** (`template://*`) - Project templates (blog, ecommerce, saas, etc.)
3. **Patterns** (`pattern://*`) - Best practices database
4. **Metrics** (`metrics://*`) - Historical metrics and learnings

## Prompts (3)

1. **discovery-questions** - Generate intelligent discovery questions
2. **architecture-review** - Comprehensive architecture review
3. **estimate-effort** - Effort estimation with historical context

## Integration with Existing System

This MCP server **complements** the existing `.claude/` system:

### MCP Handles:
- Interactive planning and discovery
- GitHub orchestration and tracking
- Cross-project intelligence
- Requirements analysis and critique

### .claude/ Handles:
- Templates and generated plans (version controlled)
- Execution agents (backend-builder, frontend-builder, etc.)
- Session state tracking (.agent-state.json)
- TDD workflow execution

## Workflow Example

```typescript
// 1. Discovery (MCP)
const discovery = await mcp.conductDiscovery({
  projectType: "ecommerce"
});

// 2. Generate Plan (MCP writes to .claude/)
await mcp.generateProjectPlan({
  discoverySummary: discovery.summary,
  outputPath: "project-plans/my-store"
});

// 3. Setup GitHub (MCP + GitHub MCP)
await mcp.setupGitHubProject({
  owner: "user",
  repo: "my-store",
  planPath: "project-plans/my-store/PROJECT_PLAN.md"
});

// 4. Execute Sessions (.claude/ agents)
/execute-session my-store 1
// Agents auto-update GitHub via MCP

// 5. Track Progress (MCP)
const progress = await mcp.trackProgress({
  owner: "user",
  repo: "my-store"
});
```

## Database Schema

SQLite database tracks:
- Projects (name, type, complexity, GitHub info)
- Sessions (status, metrics, GitHub issue/PR mapping)
- Patterns (best practices with usage/success rates)
- Metrics (time, coverage, velocity per project)
- Learnings (cross-project insights)

## Configuration

User config in `~/.project-planner-config.json`:
- Database path
- GitHub token
- Default settings
- Intelligence options

## Type Safety

Full TypeScript with strict mode:
- All tool parameters/returns typed
- All resources typed
- All prompts typed
- Zod schemas for runtime validation

## Files in This Specification

- `README.md` - This overview
- `package.json` - NPM package configuration
- `tsconfig.json` - TypeScript configuration
- `types/common.ts` - Shared type definitions
- `types/tools.ts` - Tool parameter/return types
- `types/resources.ts` - Resource types
- `types/prompts.ts` - Prompt types
- `index.ts` - MCP server implementation
- `database-schema.ts` - Database schema and initialization
- `config-template.json` - Configuration file template

## Implementation Status

**Status**: v1.0.0 Released

- 11 MCP tools implemented
- 4 resource handlers
- 3 prompt templates
- 593+ tests passing
- Full TypeScript with strict mode

See [CHANGELOG.md](CHANGELOG.md) for details.

## License

MIT - See [LICENSE](LICENSE) for details.
