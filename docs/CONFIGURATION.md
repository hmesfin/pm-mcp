# Project Planner MCP - Configuration Guide

Complete guide to configuring the Project Planner MCP server.

## Table of Contents

- [Quick Start](#quick-start)
- [MCP Configuration](#mcp-configuration)
- [Environment Variables](#environment-variables)
- [GitHub Token Setup](#github-token-setup)
- [Advanced Configuration](#advanced-configuration)
- [Platform-Specific Setup](#platform-specific-setup)

---

## Quick Start

### 1. Build the MCP Server

```bash
cd mcp-plan
npm install
npm run build
```

### 2. Add to Claude Code

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": ["/path/to/project-planner-mcp/mcp-plan/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx"
      }
    }
  }
}
```

### 3. Verify Installation

Restart Claude Code and verify the tools are available:

```
User: What MCP tools do you have access to?

Claude: I have access to the project-planner MCP with tools:
- generateProjectPlan
- analyzeRequirements
- critiquePlan
- setupGitHubProject
- trackProgress
- syncWithGitHub
- reviewArchitecture
- estimateEffort
```

---

## MCP Configuration

### Configuration File Locations

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/claude/claude_desktop_config.json` |

### Full Configuration Example

```json
{
  "mcpServers": {
    "project-planner": {
      "command": "node",
      "args": [
        "/absolute/path/to/project-planner-mcp/mcp-plan/dist/index.js"
      ],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxxxxxxxxx",
        "PROJECT_PLANNER_DB": "/path/to/project-planner.db",
        "PROJECT_PLANNER_DEBUG": "false"
      }
    }
  }
}
```

### Configuration Options

| Option | Required | Description |
|--------|----------|-------------|
| `command` | Yes | Always `"node"` |
| `args` | Yes | Path to compiled `index.js` |
| `env.GITHUB_TOKEN` | Yes | GitHub Personal Access Token |
| `env.PROJECT_PLANNER_DB` | No | Custom database path |
| `env.PROJECT_PLANNER_DEBUG` | No | Enable debug logging |

---

## Environment Variables

### Required Variables

#### GITHUB_TOKEN

GitHub Personal Access Token for API access.

```bash
export GITHUB_TOKEN="ghp_xxxxxxxxxxxx"
```

**Required Scopes:**
- `repo` - Full repository access
- `read:org` - Read organization membership

### Optional Variables

#### PROJECT_PLANNER_DB

Path to SQLite database for cross-project intelligence.

```bash
export PROJECT_PLANNER_DB="/path/to/project-planner.db"
```

Default: `~/.project-planner/data.db`

#### PROJECT_PLANNER_DEBUG

Enable verbose debug logging.

```bash
export PROJECT_PLANNER_DEBUG="true"
```

Default: `"false"`

#### PROJECT_PLANNER_TEMPLATES

Custom templates directory.

```bash
export PROJECT_PLANNER_TEMPLATES="/path/to/custom/templates"
```

Default: Built-in templates

---

## GitHub Token Setup

### Creating a Personal Access Token

1. Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)

2. Click **"Generate new token (classic)"**

3. Configure the token:
   - **Note**: "Project Planner MCP"
   - **Expiration**: 90 days or custom
   - **Scopes**:
     - [x] `repo` (all)
     - [x] `read:org`

4. Click **"Generate token"**

5. Copy the token immediately (you won't see it again)

### Token Security Best Practices

1. **Never commit tokens** - Add to `.gitignore`:
   ```
   .env
   *.env.local
   config.local.json
   ```

2. **Use environment variables** - Don't hardcode in config:
   ```json
   {
     "env": {
       "GITHUB_TOKEN": "${GITHUB_TOKEN}"
     }
   }
   ```

3. **Rotate regularly** - Set calendar reminders

4. **Use fine-grained tokens** - Limit to specific repositories when possible

### Using a .env File

Create `.env` in project root:

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
PROJECT_PLANNER_DB=/path/to/db
```

Load with dotenv or shell:

```bash
# In shell profile
export $(cat .env | xargs)
```

---

## Advanced Configuration

### Multiple GitHub Accounts

For managing multiple GitHub accounts (personal/work):

```json
{
  "mcpServers": {
    "project-planner-personal": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_personal_token"
      }
    },
    "project-planner-work": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_work_token"
      }
    }
  }
}
```

### Custom Database Location

For sharing database across machines:

```json
{
  "env": {
    "PROJECT_PLANNER_DB": "/sync/dropbox/project-planner/data.db"
  }
}
```

### Debug Mode

Enable for troubleshooting:

```json
{
  "env": {
    "PROJECT_PLANNER_DEBUG": "true"
  }
}
```

Debug output includes:
- API request/response logs
- Database queries
- Plan parsing details
- GitHub API calls

---

## Platform-Specific Setup

### macOS

1. **Install Node.js** (if not installed):
   ```bash
   brew install node
   ```

2. **Locate config file**:
   ```bash
   open ~/Library/Application\ Support/Claude/
   ```

3. **Edit configuration**:
   ```bash
   nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

4. **Use absolute paths**:
   ```json
   {
     "args": ["/Users/yourusername/projects/project-planner-mcp/mcp-plan/dist/index.js"]
   }
   ```

### Windows

1. **Install Node.js**: Download from [nodejs.org](https://nodejs.org/)

2. **Locate config file**:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

3. **Use Windows paths**:
   ```json
   {
     "args": ["C:\\Users\\yourusername\\projects\\project-planner-mcp\\mcp-plan\\dist\\index.js"]
   }
   ```

4. **Handle path escaping**: Use double backslashes or forward slashes

### Linux

1. **Install Node.js**:
   ```bash
   # Ubuntu/Debian
   sudo apt install nodejs npm

   # Fedora
   sudo dnf install nodejs
   ```

2. **Locate config file**:
   ```bash
   ~/.config/claude/claude_desktop_config.json
   ```

3. **Create config directory if needed**:
   ```bash
   mkdir -p ~/.config/claude
   ```

---

## Verifying Configuration

### Check MCP is Loaded

```
User: List available MCP tools

Claude: I have access to these MCP tools from project-planner:
- generateProjectPlan
- analyzeRequirements
- critiquePlan
...
```

### Test GitHub Connection

```
User: Test GitHub connection for owner/repo

Claude: [Uses trackProgress tool]

✓ GitHub connection successful
✓ Repository found
✓ API rate limit: 4,892/5,000 remaining
```

### Verify Database

```
User: Check project planner database status

Claude: Database Status:
- Path: ~/.project-planner/data.db
- Size: 2.4 MB
- Projects: 5
- Sessions: 47
- Last updated: 2 hours ago
```

---

## Updating the MCP

### Updating to New Version

```bash
cd project-planner-mcp

# Pull latest changes
git pull origin main

# Rebuild
cd mcp-plan
npm install
npm run build

# Restart Claude Code
```

### Version Check

The MCP version is in `mcp-plan/package.json`:

```bash
cat mcp-plan/package.json | grep version
```

---

## Configuration Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| MCP not loading | Check absolute path in config |
| GitHub API errors | Verify token and scopes |
| Database errors | Check write permissions |
| Build errors | Run `npm install` and `npm run build` |

### Validating JSON Configuration

```bash
# Check JSON syntax
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | python -m json.tool
```

### Checking Logs

Enable debug mode and check Claude Code logs for MCP errors.

---

*For API details, see [API_REFERENCE.md](API_REFERENCE.md).*
*For examples, see [EXAMPLES.md](EXAMPLES.md).*
*For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).*
