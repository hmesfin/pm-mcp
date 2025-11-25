# Project Planner MCP - Troubleshooting Guide

Solutions to common issues and debugging tips.

## Table of Contents

- [MCP Connection Issues](#mcp-connection-issues)
- [GitHub Integration Issues](#github-integration-issues)
- [Plan Generation Issues](#plan-generation-issues)
- [Database Issues](#database-issues)
- [Performance Issues](#performance-issues)
- [Error Reference](#error-reference)
- [Getting Help](#getting-help)

---

## MCP Connection Issues

### MCP Not Loading

**Symptoms:**
- Tools not available in Claude Code
- "MCP not found" errors

**Solutions:**

1. **Check the build**:
   ```bash
   cd mcp-plan
   npm run build
   ls dist/index.js  # Should exist
   ```

2. **Verify absolute path**:
   ```json
   {
     "args": ["/full/absolute/path/to/dist/index.js"]
   }
   ```
   Use `pwd` to get absolute path:
   ```bash
   cd mcp-plan/dist && pwd
   ```

3. **Check JSON syntax**:
   ```bash
   cat config.json | python -m json.tool
   ```

4. **Restart Claude Code** after config changes

5. **Check Node.js version**:
   ```bash
   node --version  # Should be v18+
   ```

### MCP Crashes on Startup

**Symptoms:**
- MCP loads briefly then disconnects
- Error messages about missing modules

**Solutions:**

1. **Reinstall dependencies**:
   ```bash
   cd mcp-plan
   rm -rf node_modules
   npm install
   npm run build
   ```

2. **Check for build errors**:
   ```bash
   npm run build 2>&1 | grep -i error
   ```

3. **Verify TypeScript compilation**:
   ```bash
   npm run type-check
   ```

### Tools Not Responding

**Symptoms:**
- Tool calls hang indefinitely
- Timeouts on tool execution

**Solutions:**

1. **Enable debug mode**:
   ```json
   {
     "env": {
       "PROJECT_PLANNER_DEBUG": "true"
     }
   }
   ```

2. **Check for network issues** (GitHub API)

3. **Verify environment variables are set**

---

## GitHub Integration Issues

### Authentication Failed

**Error:**
```
GITHUB_AUTH_FAILED: GitHub authentication failed
```

**Solutions:**

1. **Check token is set**:
   ```bash
   echo $GITHUB_TOKEN
   ```

2. **Verify token is valid**:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/user
   ```

3. **Check token scopes** - needs `repo` and `read:org`

4. **Regenerate token** if expired:
   - Go to [GitHub Settings > Tokens](https://github.com/settings/tokens)
   - Generate new token with required scopes

### Rate Limiting

**Error:**
```
GITHUB_RATE_LIMITED: API rate limit exceeded
```

**Solutions:**

1. **Wait for reset** - limits reset hourly

2. **Check current limit**:
   ```bash
   curl -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/rate_limit
   ```

3. **Reduce API calls** - use `dryRun: true` for testing

### Repository Not Found

**Error:**
```
Repository not found: owner/repo
```

**Solutions:**

1. **Verify repository exists**

2. **Check access permissions** - token needs repo access

3. **Check owner/repo spelling** - case sensitive

4. **For private repos** - ensure token has private repo access

### Labels/Milestones Already Exist

**Warning:**
```
Label 'phase-1' already exists, skipping
```

**This is normal** - the tool skips existing resources to avoid duplicates.

To recreate from scratch:
1. Delete existing labels/milestones in GitHub
2. Run `setupGitHubProject` again

---

## Plan Generation Issues

### Requirements File Not Found

**Error:**
```
REQUIREMENTS_NOT_FOUND: File not found at path
```

**Solutions:**

1. **Use absolute path**:
   ```typescript
   generateProjectPlan({
     requirementsPath: "/full/path/to/REQUIREMENTS.md"
   })
   ```

2. **Verify file exists**:
   ```bash
   ls -la /path/to/REQUIREMENTS.md
   ```

### Invalid Requirements Format

**Error:**
```
INVALID_REQUIREMENTS: Missing required section: Core Entities
```

**Solutions:**

1. **Check required sections**:
   - Overview
   - Core Entities
   - Features
   - Technical Requirements

2. **Use template**:
   ```markdown
   # App Name

   ## Overview
   Brief description...

   ## Core Entities
   - Entity1 (field1, field2)
   - Entity2 (field1, field2)

   ## Features
   - Feature 1
   - Feature 2

   ## Technical Requirements
   - Backend: Django
   - Frontend: Vue 3
   ```

3. **Run validation first**:
   ```
   Use analyzeRequirements to check format
   ```

### Plan Generation Timeout

**Error:**
```
Timeout: Plan generation exceeded 30s
```

**Solutions:**

1. **Simplify requirements** - break into phases

2. **Check file size** - very large files may timeout

3. **Check network** - template fetching may be slow

---

## Database Issues

### Database Locked

**Error:**
```
SQLITE_BUSY: database is locked
```

**Solutions:**

1. **Close other processes** using the database

2. **Check for stale locks**:
   ```bash
   ls -la ~/.project-planner/*.db*
   rm ~/.project-planner/*.db-journal  # If stale
   ```

3. **Use different database path**:
   ```json
   {
     "env": {
       "PROJECT_PLANNER_DB": "/new/path/data.db"
     }
   }
   ```

### Database Corrupted

**Error:**
```
SQLITE_CORRUPT: database disk image is malformed
```

**Solutions:**

1. **Backup existing data** (if possible)

2. **Delete and recreate**:
   ```bash
   rm ~/.project-planner/data.db
   # Database will be recreated on next use
   ```

3. **Check disk space** - corruption often from full disk

### Migration Errors

**Error:**
```
Migration failed: column already exists
```

**Solutions:**

1. **Delete database** and let it recreate

2. **Manual fix** (advanced):
   ```bash
   sqlite3 ~/.project-planner/data.db
   # Run manual SQL fixes
   ```

---

## Performance Issues

### Slow Plan Generation

**Symptoms:**
- Plan generation takes >30 seconds
- Timeouts on large projects

**Solutions:**

1. **Reduce complexity** - break into smaller projects

2. **Check network speed** - template fetching

3. **Use local templates**:
   ```json
   {
     "env": {
       "PROJECT_PLANNER_TEMPLATES": "/local/templates"
     }
   }
   ```

### High Memory Usage

**Symptoms:**
- MCP consuming >1GB RAM
- System slowdown

**Solutions:**

1. **Restart Claude Code** - memory leak fix

2. **Limit project history**:
   ```bash
   # Archive old projects in database
   sqlite3 ~/.project-planner/data.db \
     "DELETE FROM sessions WHERE created_at < date('now', '-90 days')"
   ```

### Slow GitHub Sync

**Symptoms:**
- Sync takes minutes
- Timeouts during sync

**Solutions:**

1. **Sync direction** - use `push` or `pull` instead of `both`

2. **Reduce issue count** - sync specific sessions

3. **Check rate limits** - may be throttled

---

## Error Reference

### Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `FILE_NOT_FOUND` | Required file missing | Check path exists |
| `INVALID_FORMAT` | File format incorrect | Use templates |
| `GITHUB_AUTH_FAILED` | Token invalid | Regenerate token |
| `GITHUB_RATE_LIMITED` | API limit exceeded | Wait for reset |
| `VALIDATION_ERROR` | Input validation failed | Check parameters |
| `NETWORK_ERROR` | Network request failed | Check connectivity |
| `DATABASE_ERROR` | Database operation failed | Check permissions |
| `TIMEOUT_ERROR` | Operation timed out | Reduce complexity |

### HTTP Status Codes (GitHub API)

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check token |
| 403 | Forbidden | Check scopes |
| 404 | Not found | Check owner/repo |
| 422 | Unprocessable | Check request data |
| 429 | Too many requests | Wait and retry |
| 500 | Server error | GitHub issue |

---

## Debug Mode

Enable debug mode for detailed logs:

```json
{
  "env": {
    "PROJECT_PLANNER_DEBUG": "true"
  }
}
```

Debug output includes:
- API request/response bodies
- Database queries
- Plan parsing steps
- Error stack traces

### Reading Debug Logs

```
[DEBUG] Parsing REQUIREMENTS.md...
[DEBUG] Found 4 entities, 5 features
[DEBUG] Calling GitHub API: POST /repos/owner/repo/issues
[DEBUG] Response: 201 Created
```

---

## Common Scenarios

### "Nothing Happens"

When a tool appears to do nothing:

1. Check for errors in debug mode
2. Verify all required parameters
3. Check network connectivity
4. Restart Claude Code

### "Worked Yesterday, Broken Today"

1. **Token expired** - regenerate
2. **Dependencies updated** - rebuild
3. **Config changed** - verify
4. **GitHub outage** - check status.github.com

### "Works Locally, Fails in Claude Code"

1. **Path issues** - use absolute paths
2. **Environment variables** - set in MCP config
3. **Permissions** - check file/directory access

---

## Getting Help

### Before Reporting Issues

1. **Enable debug mode** and capture logs
2. **Check this guide** for known issues
3. **Search existing issues** on GitHub
4. **Try with minimal example** to isolate

### Reporting Issues

Open an issue at: https://github.com/hmesfin/pm-mcp/issues

Include:
- Error message and stack trace
- Steps to reproduce
- Environment (OS, Node version)
- Debug logs (sanitize tokens!)

### Quick Diagnostics

Run this checklist:

```bash
# Node version
node --version

# Build status
cd mcp-plan && npm run build

# Type check
npm run type-check

# GitHub token valid
curl -s -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/user | jq .login

# Database accessible
ls -la ~/.project-planner/

# Disk space
df -h
```

---

*For API details, see [API_REFERENCE.md](API_REFERENCE.md).*
*For examples, see [EXAMPLES.md](EXAMPLES.md).*
*For configuration, see [CONFIGURATION.md](CONFIGURATION.md).*
