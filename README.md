# Project Planner MCP Server

An MCP (Model Context Protocol) server that transforms app ideas into comprehensive, TDD-driven, session-based implementation plans with GitHub integration.

## Philosophy

**Planning is the bottleneck, not coding.** Poor planning leads to project failure. Good plans enable successful agent execution.

This MCP server focuses on creating comprehensive, executable plans that AI agents can follow to build your app, with full GitHub integration for tracking and progress management.

## Features

### 🎯 Intelligent Planning
- **AI-driven discovery** - Asks strategic questions to understand your app requirements
- **Template-based generation** - Pre-built templates for common app types (Blog, E-commerce, SaaS, etc.)
- **Custom planning** - Build from scratch for unique requirements
- **TDD enforcement** - Every session follows RED-GREEN-REFACTOR cycle

### 🐙 GitHub Integration
- **Automated setup** - Creates issues, milestones, and labels from your plan
- **Progress tracking** - Real-time metrics from GitHub issue status
- **Session management** - Each session = 1 GitHub issue with full TDD workflow
- **Milestone tracking** - Each phase = 1 GitHub milestone

### 🧠 Cross-Project Intelligence
- **Pattern learning** - Learns from past projects to improve estimates
- **Architecture review** - Analyzes requirements for technical feasibility
- **Effort estimation** - Smart time estimates based on historical data

### 📊 Session-Based Execution
- **Context-optimized** - Sessions sized to avoid AI context fatigue
- **Clear exit criteria** - Know exactly when a session is complete
- **Dependency management** - Proper ordering of implementation tasks

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/hmesfin/project-planner-mcp.git
cd project-planner-mcp

# Install dependencies
cd mcp-plan
npm install

# Build the server
npm run build

# Add to your Claude Code MCP settings
# Copy config-template.json and update paths
```

### Configuration

Add to your MCP settings (e.g., `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/path/to/project-planner-mcp/mcp-plan/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

### Basic Usage

1. **Generate a plan from requirements**
   ```
   Use the generateProjectPlan tool with your REQUIREMENTS.md
   ```

2. **Setup GitHub project**
   ```
   Use the setupGitHubProject tool to create issues and milestones
   ```

3. **Track progress**
   ```
   Use the trackProgress tool to see completion metrics
   ```

See [docs/PLANNING_GUIDE.md](docs/PLANNING_GUIDE.md) for detailed usage instructions.

## Project Structure

```
project-planner-mcp/
├── mcp-plan/                    # MCP server implementation
│   ├── src/
│   │   ├── tools/              # MCP tool implementations
│   │   ├── services/           # Business logic
│   │   └── types/              # TypeScript type definitions
│   ├── index.ts                # MCP server entry point
│   └── REQUIREMENTS.md         # MCP server requirements
├── project-plans/               # Generated plans (output)
│   └── <your-app>/
│       ├── REQUIREMENTS.md
│       ├── PROJECT_PLAN.md
│       └── .agent-state.json
├── templates/                   # Plan generation templates
│   ├── blog/
│   ├── ecommerce/
│   ├── saas/
│   ├── social/
│   ├── projectmanagement/
│   ├── PROJECT_PLAN_TEMPLATE.md
│   └── PHASE_TASKS_TEMPLATE.md
├── docs/                        # Documentation
│   ├── PLANNING_GUIDE.md       # User guide
│   └── archive/                # Old implementation (reference)
└── CLAUDE.md                    # Project documentation for Claude Code
```

## MCP Tools

### Planning Tools
- **conductDiscovery** - Interactive Q&A to gather requirements
- **generateProjectPlan** - Create PROJECT_PLAN.md from requirements
- **analyzeRequirements** - Parse and validate REQUIREMENTS.md
- **critiquePlan** - Review plan for issues and improvements

### GitHub Integration Tools
- **setupGitHubProject** - Create issues, milestones, labels
- **trackProgress** - Query GitHub for progress metrics
- **syncWithGitHub** - Sync local state with GitHub
- **findNextSession** - Get next available session to work on
- **updateSessionStatus** - Mark sessions as started/completed

### Intelligence Tools
- **reviewArchitecture** - Technical feasibility analysis
- **estimateEffort** - Time and complexity estimates

## TDD Enforcement

Every session follows the RED-GREEN-REFACTOR cycle:

1. **🔴 RED Phase**: Write failing tests first
   - Expected result: ❌ Tests fail (implementation doesn't exist)

2. **🟢 GREEN Phase**: Write minimal code to pass tests
   - Expected result: ✅ Tests pass

3. **🔵 REFACTOR Phase**: Optimize while keeping tests passing
   - Expected result: ✅ Tests still pass after refactoring

## Session Sizing

Sessions are sized to avoid context fatigue:

- **Basic apps**: ~15K tokens/session (30K+ buffer remaining)
- **Intermediate apps**: ~18K tokens/session (30K+ buffer remaining)
- **Advanced apps**: ~20K tokens/session (30K+ buffer remaining)

## GitHub Integration

The MCP creates a complete GitHub project structure:

### Labels (16 total)
- **Phase labels**: `phase-1` through `phase-5`
- **Domain labels**: `backend`, `frontend`, `mobile`, `e2e`, `infrastructure`
- **TDD phase labels**: `red-phase`, `green-phase`, `refactor-phase`
- **Status labels**: `in-progress`, `blocked`, `ready-for-review`

### Milestones (1 per phase)
- Phase 1: Core Infrastructure
- Phase 2: Feature Implementation
- Phase 3: Integration & Testing
- Phase 4: Polish & Optimization
- Phase 5: Documentation & Deployment

### Issues (1 per session)
Each issue includes:
- 🎯 Objectives
- 🔴 RED phase tasks
- 🟢 GREEN phase tasks
- 🔵 REFACTOR phase tasks
- ✅ Exit criteria checklist
- 📊 Metadata (estimates, dependencies)

## Example Workflow

```typescript
// 1. Generate a plan from requirements
const plan = await generateProjectPlan({
  requirementsPath: "path/to/REQUIREMENTS.md",
  outputDir: "project-plans/my-app"
});

// 2. Setup GitHub project
const github = await setupGitHubProject({
  planPath: "project-plans/my-app/PROJECT_PLAN.md",
  owner: "yourusername",
  repo: "your-repo"
});

// 3. Track progress
const progress = await trackProgress({
  owner: "yourusername",
  repo: "your-repo",
  planPath: "project-plans/my-app/PROJECT_PLAN.md"
});

console.log(`Completed: ${progress.completedSessions}/${progress.totalSessions}`);
console.log(`Current phase: ${progress.currentPhase}`);
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Type checking
npm run type-check

# Format
npm run format
```

## Migration from Slash Commands

This MCP server replaces the old slash command-based planning system. See [docs/archive/MIGRATION.md](docs/archive/MIGRATION.md) for migration instructions.

**Key differences:**
- **MCP tools** instead of slash commands
- **GitHub integration** for progress tracking
- **Cross-project intelligence** with SQLite database
- **Better modularity** with TypeScript services

## Dogfooding

This MCP server was planned and is being built using itself! See [project-plans/mcp-server/](project-plans/mcp-server/) for the plan we're following.

**View the actual GitHub project**: https://github.com/hmesfin/pm-mcp

## Contributing

Contributions welcome! See [mcp-plan/REQUIREMENTS.md](mcp-plan/REQUIREMENTS.md) for the complete specification.

## License

MIT

## Support

- **Documentation**: [docs/PLANNING_GUIDE.md](docs/PLANNING_GUIDE.md)
- **Issues**: https://github.com/hmesfin/pm-mcp/issues
- **Architecture**: [CLAUDE.md](CLAUDE.md)

---

**Ready to plan your app?** Install the MCP server and start building! 🚀
