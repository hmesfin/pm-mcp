# Project Planner MCP - User Guide

> **Note**: This guide is for the **MCP server** version. For the old slash command documentation, see [archive/PLANNING_GUIDE.md](archive/PLANNING_GUIDE.md).

## Overview

The Project Planner MCP server transforms app ideas into comprehensive, TDD-driven, session-based implementation plans with full GitHub integration.

**Philosophy**: Planning is the bottleneck, not coding. Poor planning leads to project failure. Good plans enable successful agent execution.

## Quick Start

### 1. Installation

```bash
# Navigate to MCP directory
cd mcp-plan

# Install dependencies
npm install

# Build the server
npm run build
```

### 2. Configuration

Add to your Claude Code MCP settings file:

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/absolute/path/to/project-planner-mcp/mcp-plan/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-personal-access-token"
      }
    }
  }
}
```

**Get a GitHub token**: https://github.com/settings/tokens
Required scopes: `repo` (all), `admin:org` (read:org)

### 3. Usage Example

```
You: I want to plan a task management app
Claude: I'll help you plan that using the project planner MCP tools.
        Let me start by gathering requirements...
        [Uses conductDiscovery tool]

You: [Answer questions about features, entities, etc.]

Claude: Perfect! Now I'll generate the project plan...
        [Uses generateProjectPlan tool]
        Generated: 12 sessions across 4 phases

Claude: Would you like me to setup GitHub integration?
You: Yes
Claude: [Uses setupGitHubProject tool]
        ✓ Created 16 labels
        ✓ Created 4 milestones
        ✓ Created 12 issues
```

## MCP Tools

### Planning Tools

#### conductDiscovery
Interactive Q&A to gather app requirements.

**Asks about:**
- App name and purpose
- Complexity level (Basic/Intermediate/Advanced)
- Core entities (data models)
- Relationships between entities
- Key workflows and user journeys
- Authentication requirements
- Real-time features
- Mobile requirements
- Third-party integrations

**Output**: Creates or updates `REQUIREMENTS.md`

#### generateProjectPlan
Generate structured plan from requirements.

**Parameters:**
- `requirementsPath` - Path to REQUIREMENTS.md
- `outputDir` - Directory for plan output

**Output:**
- `PROJECT_PLAN.md` - High-level plan
- `.agent-state.json` - State tracking

#### analyzeRequirements
Parse and validate REQUIREMENTS.md.

**Returns:**
- Feature count, entity count
- Estimated complexity
- Missing sections
- Validation errors

#### critiquePlan
Review plan quality.

**Checks:**
- Session sizing (context budget)
- Dependency ordering
- Test coverage
- Exit criteria
- Time estimates

### GitHub Tools

#### setupGitHubProject
Create GitHub issues, milestones, labels.

**Parameters:**
- `planPath` - Path to PROJECT_PLAN.md
- `owner` - GitHub username/org
- `repo` - Repository name

**Creates:**
- 16 labels (phase, domain, status, TDD)
- Milestones (one per phase)
- Issues (one per session)

#### trackProgress
Query GitHub for progress metrics.

**Returns:**
- Completed/total sessions
- Current phase
- Completion percentage
- Velocity
- Estimated completion

#### syncWithGitHub
Sync local state with GitHub.

#### findNextSession
Get next available session.

**Returns:**
- Session number and title
- Phase name
- Objectives
- Dependencies
- Estimated time

#### updateSessionStatus
Mark session as started/completed.

**Updates:**
- Local `.agent-state.json`
- GitHub issue state
- Session labels

### Intelligence Tools

#### reviewArchitecture
Technical feasibility analysis.

**Checks:**
- Over-engineering risks
- Missing infrastructure
- Security considerations
- Scalability concerns

#### estimateEffort
Smart time/complexity estimates.

**Uses:**
- Historical data
- Entity/feature counts
- Tech stack complexity

## Workflows

### Planning a New App

1. **Gather requirements**: Use `conductDiscovery`
2. **Generate plan**: Use `generateProjectPlan`
3. **Setup GitHub**: Use `setupGitHubProject`
4. **Start building**: Use `findNextSession`

### Tracking Progress

1. **Check progress**: Use `trackProgress`
2. **Find next work**: Use `findNextSession`
3. **Update status**: Use `updateSessionStatus` after completing sessions

### Reviewing Plans

1. **Validate requirements**: Use `analyzeRequirements`
2. **Critique plan**: Use `critiquePlan`
3. **Architecture review**: Use `reviewArchitecture`

## TDD Workflow

Every session follows RED-GREEN-REFACTOR:

### 🔴 RED Phase
Write failing tests FIRST
```bash
npm run test  # Expected: ❌ Tests fail
```

### 🟢 GREEN Phase
Implement to pass tests
```bash
npm run test         # Expected: ✅ Tests pass
npm run type-check   # Expected: ✅ No errors
```

### 🔵 REFACTOR Phase
Improve code quality
```bash
npm run test  # Expected: ✅ Tests still pass
npm run lint  # Expected: ✅ No issues
```

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

**Mobile sessions:**
- 3-4 screens
- 5-7 components
- 3-5 hooks

## GitHub Integration

### Labels (16 total)
- Phase: `phase-1` to `phase-5`
- Domain: `backend`, `frontend`, `mobile`, `e2e`, `infrastructure`
- TDD: `red-phase`, `green-phase`, `refactor-phase`
- Status: `in-progress`, `blocked`, `ready-for-review`

### Milestones
One per phase with:
- Phase name
- Goal description
- Session count
- Time estimate

### Issues
One per session with:
- 🎯 Objectives
- 🔴 RED phase tasks
- 🟢 GREEN phase tasks
- 🔵 REFACTOR phase tasks
- ✅ Exit criteria
- 📊 Metadata

## Best Practices

### Before Planning
✅ Research similar apps
✅ List core features
✅ Identify main entities
✅ Think through workflows

### During Planning
✅ Be specific in requirements
✅ Use `analyzeRequirements` to validate
✅ Use `critiquePlan` before executing
✅ Setup GitHub early

### During Execution
✅ Follow TDD strictly
✅ Work sequentially
✅ Use `findNextSession`
✅ Use `updateSessionStatus`
✅ Commit after each session

## Troubleshooting

### MCP Not Working
- Check installation: `npm run build`
- Verify MCP config uses absolute path
- Ensure GitHub token is set

### GitHub Issues
- Generate new token: https://github.com/settings/tokens
- Ensure `repo` scope enabled
- Check repository exists

### State Out of Sync
Use `syncWithGitHub` tool to sync local and GitHub state

## Migration

See [archive/MIGRATION.md](archive/MIGRATION.md) for migrating from slash commands.

## Support

- **GitHub Issues**: https://github.com/hmesfin/pm-mcp/issues
- **Main README**: [../README.md](../README.md)
- **Example**: [../project-plans/mcp-server/](../project-plans/mcp-server/)

---

**Ready to plan your app?** Install the MCP and start with `conductDiscovery`! 🚀
