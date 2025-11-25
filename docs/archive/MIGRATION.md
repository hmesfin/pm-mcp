# Migration Guide: Slash Commands → MCP Server

This guide helps you transition from the old slash command-based planning system to the new MCP (Model Context Protocol) server.

## Why Migrate?

The MCP server offers several advantages over the slash command approach:

### ✅ Better GitHub Integration
- **Automatic issue creation** from plan sessions
- **Real-time progress tracking** via GitHub API
- **Milestone management** for phases
- **Label-based organization** (phase, domain, status)

### ✅ Cross-Project Intelligence
- **SQLite database** stores historical data
- **Pattern learning** from past projects
- **Better time estimates** based on actual data
- **Architecture validation** using learned patterns

### ✅ More Modular & Maintainable
- **TypeScript services** for business logic
- **Clear separation of concerns** (tools, services, types)
- **Proper error handling** and validation
- **Type safety** throughout

### ✅ Standard Protocol
- **MCP compliance** means better integration with AI tools
- **Discoverable tools** via MCP protocol
- **Resource endpoints** for accessing plans
- **Prompt templates** for common workflows

## What Changed?

### Old: Slash Commands
```bash
# Old workflow
/plan-app                    # Interactive planning
/execute-session             # Execute a session
/show-progress               # Check progress
```

**Problems:**
- No GitHub integration
- State tracked in local `.agent-state.json` files only
- No cross-project learning
- Hard to extend

### New: MCP Tools
```typescript
// New workflow
generateProjectPlan()        // Generate plan from requirements
setupGitHubProject()         // Create GitHub issues/milestones
trackProgress()              // Query GitHub for metrics
findNextSession()            // Get next available session
```

**Benefits:**
- GitHub as source of truth
- Real-time collaboration
- Cross-project intelligence
- Extensible architecture

## Migration Steps

### 1. Install MCP Server

```bash
cd project-planner-mcp/mcp-plan
npm install
npm run build
```

### 2. Configure MCP in Claude Code

Add to your MCP settings:

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/absolute/path/to/project-planner-mcp/mcp-plan/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

**Get a GitHub token:**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Scopes needed: `repo` (all), `admin:org` (read:org)

### 3. Migrate Existing Plans (Optional)

If you have plans from the old system:

```bash
# Old location
project-plans/<app-name>/
├── REQUIREMENTS.md
├── PROJECT_PLAN.md
└── tasks/
    ├── PHASE_1_*.md
    └── .agent-state.json

# New location (same!)
project-plans/<app-name>/
├── REQUIREMENTS.md
├── PROJECT_PLAN.md
└── .agent-state.json
```

**No file changes needed!** The MCP reads the same files.

**To add GitHub tracking:**
1. Use `setupGitHubProject` tool with your existing `PROJECT_PLAN.md`
2. GitHub issues will be created from existing plan
3. Update `.agent-state.json` with GitHub repo info

### 4. Update Workflows

#### Planning a New App

**Old (Slash Command):**
```
User: /plan-app
Claude: [Interactive discovery...]
Claude: [Generates plan files]
```

**New (MCP):**
```
User: I want to plan a task management app
Claude: Let me use conductDiscovery to gather requirements
[Uses conductDiscovery tool]
Claude: Now I'll generate the plan
[Uses generateProjectPlan tool]
Claude: Would you like me to setup GitHub integration?
[Uses setupGitHubProject tool]
```

#### Tracking Progress

**Old (Slash Command):**
```
User: /show-progress
Claude: [Reads .agent-state.json]
Completed: 3/10 sessions
Current phase: Phase 2
```

**New (MCP):**
```
User: What's the progress on my app?
Claude: Let me check GitHub
[Uses trackProgress tool]
Completed: 3/10 sessions (GitHub issues closed)
Current phase: Phase 2
Current velocity: 2 sessions/week
```

#### Executing a Session

**Old (Slash Command):**
```
User: /execute-session 3
Claude: [Reads PHASE_X.md]
Claude: [Executes TDD workflow]
Claude: [Updates .agent-state.json]
```

**New (MCP):**
```
User: Let's work on the next session
Claude: [Uses findNextSession tool]
Next session: Session 3 - Implement User Authentication
[Opens GitHub issue]
[Executes TDD workflow]
[Updates GitHub issue status]
[Uses updateSessionStatus tool]
```

## Feature Mapping

| Old Slash Command | New MCP Tool(s) | Notes |
|------------------|-----------------|-------|
| `/plan-app` | `conductDiscovery` + `generateProjectPlan` | Now 2 separate tools for better control |
| `/execute-session` | `findNextSession` + manual execution | MCP focuses on planning, not execution |
| `/show-progress` | `trackProgress` | Now queries GitHub for real-time data |
| `/resume-session` | `findNextSession` | Finds in-progress or next available |
| `/initialize-project` | `setupGitHubProject` | Creates GitHub structure |
| N/A | `analyzeRequirements` | New! Validates requirements |
| N/A | `critiquePlan` | New! Reviews plan quality |
| N/A | `syncWithGitHub` | New! Syncs state with GitHub |
| N/A | `reviewArchitecture` | New! Technical feasibility |
| N/A | `estimateEffort` | New! Smart time estimates |

## Templates

Templates work the same way! They're still in `templates/`:

```
templates/
├── blog/
├── ecommerce/
├── saas/
├── social/
├── projectmanagement/
├── PROJECT_PLAN_TEMPLATE.md
└── PHASE_TASKS_TEMPLATE.md
```

The MCP reads these templates when generating plans.

## State Management

### Old: Local Only
```json
// .agent-state.json (local only)
{
  "projectName": "My App",
  "currentPhase": 2,
  "currentSession": 3,
  "completedSessions": [1, 2]
}
```

### New: GitHub + Local
```json
// .agent-state.json (local cache)
{
  "projectName": "My App",
  "currentPhase": 2,
  "currentSession": 3,
  "completedSessions": [1, 2],
  "github": {
    "owner": "username",
    "repo": "my-app",
    "issuesCreated": true
  }
}
```

**GitHub is the source of truth:**
- Session completion = GitHub issue closed
- Phase progress = Milestone completion %
- Session status = GitHub issue state (open/in-progress/closed)

## What's Archived?

The old implementation is preserved in `docs/archive/slash-commands/`:

```
docs/archive/slash-commands/
├── agents/                  # Old agent specs
├── commands/                # Old slash commands
├── infrastructure/          # Old TypeScript executors
└── README.md               # Old system docs
```

**Why keep it?**
- Historical reference
- Learn from past design decisions
- Some concepts may be reused

## Breaking Changes

### 1. No More Slash Commands
The `/plan-app`, `/execute-session`, etc. commands are gone. Use MCP tools instead.

### 2. GitHub Token Required
The MCP needs a GitHub token for integration features. Set it in MCP config.

### 3. TypeScript Required
The MCP is TypeScript-based. You need Node.js 18+ and TypeScript 5.3+.

### 4. Different Tool Interface
Instead of typing `/plan-app`, you ask Claude to use the appropriate MCP tool.

**Old:**
```
User: /plan-app
```

**New:**
```
User: I need to plan a new app
Claude: Let me use the conductDiscovery tool...
```

## Backwards Compatibility

### ✅ Kept Compatible
- **Plan files** - Same format (REQUIREMENTS.md, PROJECT_PLAN.md)
- **Templates** - Same template structure
- **Session structure** - Same TDD workflow (RED-GREEN-REFACTOR)
- **Project directory** - Same `project-plans/` location

### ❌ Not Compatible
- **Slash commands** - Replaced by MCP tools
- **Agent specs** - Replaced by MCP tool implementations
- **Executor scripts** - Not needed (MCP handles orchestration)

## Troubleshooting

### "MCP server not found"
- Check MCP config path is absolute
- Verify `npm run build` completed successfully
- Restart Claude Code after config changes

### "GitHub token invalid"
- Generate new token at https://github.com/settings/tokens
- Ensure `repo` scope is enabled
- Check token is set in MCP config `env`

### "Can't find old plans"
- Plans are in `project-plans/` (same as before)
- Use `setupGitHubProject` to add GitHub tracking to existing plans

### "Missing templates"
- Templates are in `templates/` directory
- Verify `templates/PROJECT_PLAN_TEMPLATE.md` exists
- Check file permissions

## FAQ

**Q: Do I need to delete the old slash commands?**
A: They're archived in `docs/archive/slash-commands/`. You can delete them, but they're kept for reference.

**Q: Can I use both old and new systems?**
A: Not recommended. The MCP is the future. Migrate fully to avoid confusion.

**Q: What about my existing projects?**
A: Existing plans work fine! Just use `setupGitHubProject` to add GitHub tracking.

**Q: Do I need GitHub?**
A: For full features, yes. But `generateProjectPlan` works without GitHub.

**Q: Can I contribute to the MCP?**
A: Yes! See [mcp-plan/REQUIREMENTS.md](../../mcp-plan/REQUIREMENTS.md) for the spec.

## Next Steps

1. ✅ Install and configure MCP
2. ✅ Test with a small project
3. ✅ Migrate existing projects (optional)
4. ✅ Read [PLANNING_GUIDE.md](../PLANNING_GUIDE.md) for full usage guide
5. ✅ Check out the dogfooding example: [project-plans/mcp-server/](../../project-plans/mcp-server/)

## Support

- **Documentation**: [docs/PLANNING_GUIDE.md](../PLANNING_GUIDE.md)
- **GitHub Issues**: https://github.com/hmesfin/pm-mcp/issues
- **Example**: [project-plans/mcp-server/](../../project-plans/mcp-server/)

---

**Welcome to the MCP era!** 🚀
