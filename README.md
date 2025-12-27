# Project Planner MCP Server

[![npm version](https://img.shields.io/npm/v/project-planner-mcp.svg)](https://www.npmjs.com/package/project-planner-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that transforms app ideas into comprehensive, TDD-driven implementation plans with GitHub integration.

## What It Does

- **Generates structured project plans** from requirements documents
- **Creates GitHub issues, milestones, and labels** automatically
- **Tracks progress** through GitHub issue status
- **Enforces TDD workflow** (RED-GREEN-REFACTOR) for every session

## Installation

### Via npm (recommended)

```bash
npm install -g project-planner-mcp
```

### Via npx (no install)

```bash
npx project-planner-mcp
```

## Configuration

### Claude Code

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "project-planner": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "project-planner-mcp"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):

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

### GitHub Token

Create a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope.

## Available Tools

| Tool | Description |
|------|-------------|
| `generateProjectPlan` | Create PROJECT_PLAN.md from requirements |
| `setupGitHubProject` | Create GitHub issues, milestones, labels |
| `trackProgress` | Query GitHub for progress metrics |
| `analyzeRequirements` | Validate requirements for completeness |
| `critiquePlan` | Review plan for issues |
| `findNextSession` | Get next available session |
| `reviewArchitecture` | Technical feasibility analysis |
| `estimateEffort` | Time and complexity estimates |

See [PLANNING_GUIDE.md](docs/PLANNING_GUIDE.md) for detailed usage.

## Development

### Clone and Setup

```bash
git clone https://github.com/hmesfin/pm-mcp.git
cd pm-mcp/mcp-plan
npm install
```

### Build

```bash
npm run build       # Compile TypeScript
npm run watch       # Watch mode
```

### Test

```bash
npm test            # Run tests
npm run type-check  # Type checking only
```

### Project Structure

```
pm-mcp/
├── mcp-plan/           # MCP server source
│   ├── src/
│   │   ├── tools/      # Tool implementations
│   │   ├── services/   # Business logic
│   │   └── types/      # TypeScript types
│   └── index.ts        # Entry point
├── templates/          # Plan generation templates
├── project-plans/      # Generated plans (output)
└── docs/               # Documentation
```

## Documentation

- [PLANNING_GUIDE.md](docs/PLANNING_GUIDE.md) - User guide
- [CLAUDE.md](CLAUDE.md) - Architecture & development notes
- [REQUIREMENTS.md](mcp-plan/REQUIREMENTS.md) - Full specification

## Contributing

Contributions welcome! Please read [REQUIREMENTS.md](mcp-plan/REQUIREMENTS.md) for the complete specification.

## License

MIT
