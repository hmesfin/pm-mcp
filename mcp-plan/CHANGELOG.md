# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

#### MCP Tools (11 total)

**Planning Tools:**
- `conductDiscovery` - Interactive Q&A for gathering requirements
- `generateProjectPlan` - Generate TDD-driven project plans from requirements
- `analyzeRequirements` - Parse and validate REQUIREMENTS.md for completeness, clarity, and feasibility
- `critiquePlan` - Review plan quality with dependency analysis and parallelization detection

**GitHub Tools:**
- `setupGitHubProject` - Create issues, milestones, and labels from project plans
- `trackProgress` - Query GitHub for progress metrics and velocity
- `syncWithGitHub` - Bidirectional sync between local state and GitHub
- `findNextSession` - Get next available session with objectives and dependencies
- `updateSessionStatus` - Mark sessions as started/completed

**Intelligence Tools:**
- `reviewArchitecture` - Technical feasibility analysis (patterns, security, scalability, testability)
- `estimateEffort` - Data-driven effort estimation with confidence levels

#### MCP Resources (4 total)

- `project://current/status` - Current project status and progress
- `project://current/sessions` - All sessions with status
- `project://templates` - Available project templates
- `template://{name}` - Get specific template details

#### MCP Prompts (6 total)

- `plan-project` - Generate project plan from requirements
- `setup-github` - Setup GitHub integration
- `get-next-session` - Get next available session
- `track-progress` - Get progress report
- `review-architecture` - Architecture review prompt
- `estimate-effort` - Effort estimation prompt

#### Core Features

- **TDD-Driven Planning**: Every session follows RED-GREEN-REFACTOR workflow
- **Session-Based Architecture**: Projects broken into manageable 3-4 hour sessions
- **GitHub Integration**: Full issue/milestone/label management
- **Dependency Tracking**: Circular dependency detection and validation
- **Parallelization Detection**: Identifies sessions that can run concurrently
- **Architecture Review**: Patterns, anti-patterns, security, scalability analysis
- **Effort Estimation**: Data-driven estimates with confidence levels and risk factors

#### Services

- `planParser` - Parse PROJECT_PLAN.md into structured data
- `resourceHandlers` - MCP resource implementation
- `promptHandlers` - MCP prompt implementation

#### Performance

- Template caching with TTL and LRU eviction
- Memoization utilities for expensive operations
- Benchmark tracking for performance monitoring

#### Validation & Error Handling

- Zod schema validation for all tool inputs
- Comprehensive error types with categories and codes
- Graceful degradation for missing data

#### Documentation

- API Reference with all tools, resources, and prompts
- Usage examples for common workflows
- Configuration guide for MCP setup
- Troubleshooting guide for common issues

### Technical Details

- Built with TypeScript in strict mode
- MCP SDK 0.5.0 compatibility
- Node.js 18+ required
- Vitest for testing (590+ tests)
- Full type definitions exported

### Project Templates

Included templates for:
- Blog platforms
- E-commerce applications
- SaaS products
- Social networks
- Project management tools

---

## Development History

The project was built following its own TDD methodology across 15 sessions:

### Phase 1: Foundation (Sessions 1-3)
- Project setup and MCP infrastructure
- Type system and validation
- Plan parser service

### Phase 2: Core Features (Sessions 4-6)
- generateProjectPlan tool
- setupGitHubProject tool
- trackProgress tool

### Phase 3: Enhanced Features (Sessions 7-9)
- syncWithGitHub tool
- conductDiscovery tool
- findNextSession tool

### Phase 4: Intelligence (Sessions 10-11)
- MCP resources implementation
- reviewArchitecture and estimateEffort tools

### Phase 5: Polish (Sessions 12-15)
- Comprehensive validation and error handling
- Performance optimizations (caching, memoization)
- Documentation suite
- E2E testing and release preparation

---

[1.0.0]: https://github.com/hmesfin/pm-mcp/releases/tag/v1.0.0
