# Project Planner MCP - API Reference

Complete API documentation for all MCP tools, resources, and prompts.

## Table of Contents

- [Planning Tools](#planning-tools)
  - [generateProjectPlan](#generateprojectplan)
  - [analyzeRequirements](#analyzerequirements)
  - [critiquePlan](#critiqueplan)
- [GitHub Integration Tools](#github-integration-tools)
  - [setupGitHubProject](#setupgithubproject)
  - [trackProgress](#trackprogress)
  - [syncWithGitHub](#syncwithgithub)
- [Intelligence Tools](#intelligence-tools)
  - [reviewArchitecture](#reviewarchitecture)
  - [estimateEffort](#estimateeffort)
- [Resources](#resources)
- [Prompts](#prompts)

---

## Planning Tools

### generateProjectPlan

Generate a comprehensive PROJECT_PLAN.md from a REQUIREMENTS.md file.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requirementsPath` | `string` | Yes | Absolute path to REQUIREMENTS.md |
| `outputDir` | `string` | Yes | Directory to output PROJECT_PLAN.md |
| `projectType` | `ProjectType` | No | App type hint (blog, ecommerce, saas, social, projectmanagement, custom) |

**Returns:**

```typescript
interface GenerateProjectPlanResult {
  success: boolean;
  planPath: string;           // Path to generated PROJECT_PLAN.md
  statePath: string;          // Path to .agent-state.json
  projectName: string;
  totalPhases: number;
  totalSessions: number;
  estimatedTime: string;      // e.g., "45h"
  complexity: ComplexityLevel;
}
```

**Example:**

```typescript
const result = await generateProjectPlan({
  requirementsPath: "/path/to/REQUIREMENTS.md",
  outputDir: "/path/to/project-plans/my-app"
});

console.log(`Generated ${result.totalSessions} sessions`);
console.log(`Estimated time: ${result.estimatedTime}`);
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `REQUIREMENTS_NOT_FOUND` | REQUIREMENTS.md file not found |
| `INVALID_REQUIREMENTS` | REQUIREMENTS.md is malformed |
| `OUTPUT_DIR_ERROR` | Cannot write to output directory |

---

### analyzeRequirements

Parse and validate a REQUIREMENTS.md file, identifying gaps and issues.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requirementsPath` | `string` | Yes | Path to REQUIREMENTS.md file |
| `strictMode` | `boolean` | No | Enable strict validation (default: false) |

**Returns:**

```typescript
interface AnalyzeRequirementsResult {
  isValid: boolean;
  projectName: string;
  projectType: ProjectType;
  complexity: ComplexityLevel;

  // Counts
  featureCount: number;
  entityCount: number;
  integrationCount: number;

  // Analysis
  sections: {
    name: string;
    present: boolean;
    quality: 'good' | 'needs-improvement' | 'missing';
  }[];

  // Issues
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];

  // Estimates
  estimatedSessions: number;
  estimatedTime: string;
}
```

**Example:**

```typescript
const analysis = await analyzeRequirements({
  requirementsPath: "/path/to/REQUIREMENTS.md",
  strictMode: true
});

if (!analysis.isValid) {
  console.log("Issues found:");
  analysis.errors.forEach(e => console.log(`  - ${e.message}`));
}
```

---

### critiquePlan

Review an existing PROJECT_PLAN.md for quality, completeness, and issues.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `planPath` | `string` | Yes | Path to PROJECT_PLAN.md |
| `focusAreas` | `string[]` | No | Specific areas to critique (e.g., ["sizing", "dependencies"]) |

**Returns:**

```typescript
interface CritiquePlanResult {
  overallScore: number;       // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  categories: {
    name: string;
    score: number;
    issues: CritiqueIssue[];
    suggestions: string[];
  }[];

  // Specific checks
  sessionSizing: {
    oversized: SessionRef[];
    undersized: SessionRef[];
    optimal: SessionRef[];
  };

  dependencies: {
    circular: DependencyIssue[];
    missing: DependencyIssue[];
    valid: boolean;
  };

  coverage: {
    hasTests: boolean;
    hasDocs: boolean;
    hasE2E: boolean;
  };

  summary: string;
  recommendations: string[];
}
```

**Example:**

```typescript
const critique = await critiquePlan({
  planPath: "/path/to/PROJECT_PLAN.md",
  focusAreas: ["sizing", "tdd-compliance"]
});

console.log(`Plan grade: ${critique.grade} (${critique.overallScore}/100)`);
critique.recommendations.forEach(r => console.log(`  - ${r}`));
```

---

## GitHub Integration Tools

### setupGitHubProject

Create GitHub issues, milestones, and labels from a PROJECT_PLAN.md.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `planPath` | `string` | Yes | Path to PROJECT_PLAN.md |
| `owner` | `string` | Yes | GitHub username or organization |
| `repo` | `string` | Yes | Repository name |
| `dryRun` | `boolean` | No | Preview without creating (default: false) |

**Returns:**

```typescript
interface SetupGitHubProjectResult {
  success: boolean;

  labels: {
    created: string[];
    existing: string[];
    failed: string[];
  };

  milestones: {
    created: MilestoneRef[];
    existing: MilestoneRef[];
  };

  issues: {
    created: IssueRef[];
    failed: IssueRef[];
  };

  summary: {
    labelsCreated: number;
    milestonesCreated: number;
    issuesCreated: number;
  };

  projectUrl: string;
}
```

**Labels Created:**

| Category | Labels |
|----------|--------|
| Phase | `phase-1`, `phase-2`, `phase-3`, `phase-4`, `phase-5` |
| Domain | `backend`, `frontend`, `mobile`, `e2e`, `infrastructure` |
| TDD | `red-phase`, `green-phase`, `refactor-phase` |
| Status | `in-progress`, `blocked`, `ready-for-review` |

**Example:**

```typescript
const result = await setupGitHubProject({
  planPath: "/path/to/PROJECT_PLAN.md",
  owner: "myusername",
  repo: "my-app",
  dryRun: false
});

console.log(`Created ${result.summary.issuesCreated} issues`);
console.log(`Project: ${result.projectUrl}`);
```

---

### trackProgress

Query GitHub for project progress metrics and status.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `owner` | `string` | Yes | GitHub username or organization |
| `repo` | `string` | Yes | Repository name |
| `planPath` | `string` | No | Path to PROJECT_PLAN.md for local validation |

**Returns:**

```typescript
interface TrackProgressResult {
  // Counts
  totalSessions: number;
  completedSessions: number;
  inProgressSessions: number;
  blockedSessions: number;

  // Percentages
  completionPercentage: number;

  // Phase info
  currentPhase: {
    number: number;
    name: string;
    progress: number;
  };

  // Velocity
  velocity: {
    sessionsPerDay: number;
    averageSessionTime: string;
  };

  // Estimates
  estimatedCompletion: string;  // ISO date
  remainingTime: string;        // e.g., "15h"

  // Sessions
  recentCompleted: SessionRef[];
  nextUp: SessionRef[];
  blocked: SessionRef[];

  // Health
  health: 'on-track' | 'at-risk' | 'behind';
  healthDetails: string;
}
```

**Example:**

```typescript
const progress = await trackProgress({
  owner: "myusername",
  repo: "my-app"
});

console.log(`Progress: ${progress.completionPercentage}%`);
console.log(`Phase: ${progress.currentPhase.name}`);
console.log(`Health: ${progress.health}`);
```

---

### syncWithGitHub

Synchronize local .agent-state.json with GitHub issue states.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `owner` | `string` | Yes | GitHub username or organization |
| `repo` | `string` | Yes | Repository name |
| `statePath` | `string` | Yes | Path to .agent-state.json |
| `direction` | `'push' \| 'pull' \| 'both'` | No | Sync direction (default: 'both') |

**Returns:**

```typescript
interface SyncWithGitHubResult {
  success: boolean;

  changes: {
    localUpdated: SessionChange[];
    githubUpdated: SessionChange[];
    conflicts: SessionConflict[];
  };

  summary: {
    synced: number;
    conflicts: number;
    errors: number;
  };
}
```

**Example:**

```typescript
const sync = await syncWithGitHub({
  owner: "myusername",
  repo: "my-app",
  statePath: "/path/to/.agent-state.json",
  direction: "both"
});

if (sync.changes.conflicts.length > 0) {
  console.log("Conflicts found - manual resolution required");
}
```

---

## Intelligence Tools

### reviewArchitecture

Analyze project architecture for patterns, anti-patterns, and recommendations.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requirementsPath` | `string` | Yes | Path to REQUIREMENTS.md |
| `planPath` | `string` | No | Path to PROJECT_PLAN.md |
| `focusAreas` | `string[]` | No | Specific areas to review |

**Returns:**

```typescript
interface ReviewArchitectureResult {
  overallScore: number;  // 0-100

  patterns: {
    identified: Pattern[];
    recommended: Pattern[];
  };

  antiPatterns: {
    detected: AntiPattern[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };

  security: {
    concerns: SecurityConcern[];
    recommendations: string[];
  };

  scalability: {
    bottlenecks: Bottleneck[];
    recommendations: string[];
  };

  complexity: {
    level: ComplexityLevel;
    drivers: string[];
    simplificationOpportunities: string[];
  };

  techDebt: {
    risks: TechDebtRisk[];
    mitigations: string[];
  };

  summary: string;
  recommendations: string[];
}
```

**Example:**

```typescript
const review = await reviewArchitecture({
  requirementsPath: "/path/to/REQUIREMENTS.md",
  focusAreas: ["security", "scalability"]
});

console.log(`Architecture score: ${review.overallScore}/100`);
review.recommendations.forEach(r => console.log(`  - ${r}`));
```

---

### estimateEffort

Generate effort estimates based on requirements and historical data.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `requirementsPath` | `string` | Yes | Path to REQUIREMENTS.md |
| `planPath` | `string` | No | Path to PROJECT_PLAN.md |
| `teamSize` | `number` | No | Team size (default: 1) |
| `experienceLevel` | `'junior' \| 'mid' \| 'senior'` | No | Team experience (default: 'mid') |

**Returns:**

```typescript
interface EstimateEffortResult {
  // Time estimates
  totalHours: number;
  rangeMin: number;
  rangeMax: number;
  confidence: number;  // 0-100

  // Breakdown
  byPhase: {
    phase: string;
    hours: number;
    sessions: number;
  }[];

  byDomain: {
    domain: string;
    hours: number;
    percentage: number;
  }[];

  // Factors
  complexityFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    hoursAdded: number;
  }[];

  // Comparison
  similarProjects: {
    name: string;
    actualHours: number;
    accuracy: number;
  }[];

  // Recommendations
  recommendations: string[];
  risks: string[];
}
```

**Example:**

```typescript
const estimate = await estimateEffort({
  requirementsPath: "/path/to/REQUIREMENTS.md",
  teamSize: 2,
  experienceLevel: "mid"
});

console.log(`Estimated: ${estimate.totalHours}h`);
console.log(`Range: ${estimate.rangeMin}h - ${estimate.rangeMax}h`);
console.log(`Confidence: ${estimate.confidence}%`);
```

---

## Resources

MCP resources provide read-only access to project data.

### project://

Access project information.

| URI | Description |
|-----|-------------|
| `project://list` | List all tracked projects |
| `project://{name}` | Get specific project details |
| `project://{name}/sessions` | List project sessions |
| `project://{name}/progress` | Get project progress |

### template://

Access project templates.

| URI | Description |
|-----|-------------|
| `template://list` | List available templates |
| `template://{type}` | Get specific template (blog, ecommerce, saas, etc.) |

### pattern://

Access best practice patterns.

| URI | Description |
|-----|-------------|
| `pattern://list` | List all patterns |
| `pattern://{category}` | Get patterns by category |

### metrics://

Access historical metrics.

| URI | Description |
|-----|-------------|
| `metrics://velocity` | Get velocity metrics |
| `metrics://accuracy` | Get estimation accuracy |

---

## Prompts

Pre-configured prompts for common workflows.

### discovery-questions

Generate intelligent discovery questions for a project type.

**Arguments:**

| Name | Type | Description |
|------|------|-------------|
| `projectType` | `ProjectType` | Type of project |
| `existingInfo` | `string` | Already known information |

### architecture-review

Generate comprehensive architecture review.

**Arguments:**

| Name | Type | Description |
|------|------|-------------|
| `requirementsPath` | `string` | Path to REQUIREMENTS.md |
| `focusAreas` | `string[]` | Areas to focus on |

### estimate-effort

Generate effort estimation with context.

**Arguments:**

| Name | Type | Description |
|------|------|-------------|
| `requirementsPath` | `string` | Path to REQUIREMENTS.md |
| `constraints` | `string` | Time/budget constraints |

---

## Type Definitions

### ProjectType

```typescript
type ProjectType =
  | 'blog'
  | 'ecommerce'
  | 'saas'
  | 'social'
  | 'projectmanagement'
  | 'custom';
```

### ComplexityLevel

```typescript
type ComplexityLevel = 'basic' | 'intermediate' | 'advanced';
```

### SessionStatus

```typescript
type SessionStatus =
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'blocked';
```

### Phase

```typescript
interface Phase {
  number: number;
  name: string;
  goal: string;
  sessions: Session[];
  estimatedTime: string;
}
```

### Session

```typescript
interface Session {
  number: number;
  title: string;
  phase: number;
  objectives: string[];
  tasks: Task[];
  exitCriteria: string[];
  estimatedTime: string;
  dependencies: number[];
  domain: Domain;
}
```

---

## Error Handling

All tools follow consistent error handling:

```typescript
interface ToolError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
  suggestions?: string[];
}
```

**Common Error Codes:**

| Code | Description |
|------|-------------|
| `FILE_NOT_FOUND` | Required file not found |
| `INVALID_FORMAT` | File format is invalid |
| `GITHUB_AUTH_FAILED` | GitHub authentication failed |
| `GITHUB_RATE_LIMITED` | GitHub API rate limit exceeded |
| `VALIDATION_ERROR` | Input validation failed |
| `NETWORK_ERROR` | Network request failed |

---

## Rate Limiting

GitHub API has rate limits:

- **Authenticated**: 5,000 requests/hour
- **Search API**: 30 requests/minute

The MCP server handles rate limiting automatically with exponential backoff.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub Personal Access Token |
| `PROJECT_PLANNER_DB` | No | Path to SQLite database |
| `PROJECT_PLANNER_DEBUG` | No | Enable debug logging |

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial release with core tools |

---

*For usage examples, see [EXAMPLES.md](EXAMPLES.md).*
*For configuration, see [CONFIGURATION.md](CONFIGURATION.md).*
*For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).*
