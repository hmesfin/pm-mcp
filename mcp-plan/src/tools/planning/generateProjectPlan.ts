// src/tools/planning/generateProjectPlan.ts

import * as fs from "fs/promises";
import * as path from "path";
import {
  GenerateProjectPlanParams,
  GenerateProjectPlanResult,
} from "../../types/tools.js";
import { ProjectPlan, ComplexityLevel } from "../../types/common.js";

export async function generateProjectPlan(
  params: GenerateProjectPlanParams
): Promise<GenerateProjectPlanResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const filesCreated: string[] = [];

  try {
    // 1. Get requirements content
    let requirements: string;
    if (params.requirementsPath) {
      requirements = await fs.readFile(params.requirementsPath, "utf-8");
    } else if (params.requirements) {
      requirements = params.requirements;
    } else {
      errors.push("Either requirementsPath or requirements must be provided");
      return {
        success: false,
        projectPlan: {} as ProjectPlan,
        filesCreated: [],
        warnings: [],
        errors,
      };
    }

    // 2. Extract metadata from requirements
    const metadata = extractMetadata(requirements);

    // 3. Determine complexity
    const complexity = params.discoverySummary?.complexity ||
                       estimateComplexity(requirements);

    // 4. Create output directory
    await fs.mkdir(params.outputPath, { recursive: true });

    // 5. Generate PROJECT_PLAN.md
    const projectPlan = await generateProjectPlanMd(
      metadata,
      complexity,
      params.templateType || "custom"
    );

    const projectPlanPath = path.join(params.outputPath, "PROJECT_PLAN.md");
    await fs.writeFile(projectPlanPath, projectPlan.content, "utf-8");
    filesCreated.push(projectPlanPath);

    // 6. Write/update REQUIREMENTS.md
    const requirementsPath = path.join(params.outputPath, "REQUIREMENTS.md");
    await fs.writeFile(requirementsPath, requirements, "utf-8");
    filesCreated.push(requirementsPath);

    // 7. Create .agent-state.json
    const agentState = {
      projectName: metadata.name,
      currentPhase: 0,
      currentSession: 0,
      completedSessions: [],
      blockedSessions: [],
      lastCheckpoint: new Date().toISOString(),
      status: "not_started",
      metrics: {
        totalTests: 0,
        avgCoverage: 0,
        timeSpent: "0h",
        velocity: 0,
      },
    };

    const statePath = path.join(params.outputPath, ".agent-state.json");
    await fs.writeFile(statePath, JSON.stringify(agentState, null, 2), "utf-8");
    filesCreated.push(statePath);

    return {
      success: true,
      projectPlan: projectPlan.plan,
      filesCreated,
      warnings,
      errors: [],
    };
  } catch (error) {
    errors.push(`Failed to generate project plan: ${error}`);
    return {
      success: false,
      projectPlan: {} as ProjectPlan,
      filesCreated,
      warnings,
      errors,
    };
  }
}

interface ProjectMetadata {
  name: string;
  description: string;
  type: string;
  features: string[];
  entities: string[];
  integrations: string[];
}

function extractMetadata(requirements: string): ProjectMetadata {
  // Parse requirements markdown to extract metadata

  let name = "Unnamed Project";
  let description = "";
  const features: string[] = [];
  const entities: string[] = [];
  const integrations: string[] = [];

  // Extract from first heading
  const titleMatch = requirements.match(/^#\s+(?:Requirements:\s+)?(.+)/m);
  if (titleMatch) {
    name = titleMatch[1].trim();
  }

  // Extract description from ## Overview
  const overviewMatch = requirements.match(/##\s+Overview\s+([\s\S]+?)(?=##|$)/);
  if (overviewMatch) {
    description = overviewMatch[1].trim().split("\n")[0];
  }

  // Extract entities from ## Core Entities or ### entities section
  const entitiesMatch = requirements.match(/##\s+(?:Core\s+)?Entities([\s\S]+?)(?=##|$)/i);
  if (entitiesMatch) {
    const entitySection = entitiesMatch[1];
    const entityMatches = entitySection.matchAll(/###\s+\d+\.\s+(.+)|###\s+(.+)/g);
    for (const match of entityMatches) {
      const entity = (match[1] || match[2]).trim();
      entities.push(entity);
    }
  }

  // Extract features from various sections
  const featurePatterns = [
    /##\s+(?:MCP\s+)?Tools\s+\((\d+)\s+Total\)/i,
    /##\s+Features/i,
    /##\s+Core\s+Features/i,
  ];

  for (const pattern of featurePatterns) {
    const match = requirements.match(pattern);
    if (match) {
      const section = requirements.substring(match.index!);
      const nextHeading = section.indexOf("\n##", 1);
      const sectionContent = nextHeading > 0 ? section.substring(0, nextHeading) : section;

      // Extract bullet points or numbered lists
      const bullets = sectionContent.matchAll(/^[\s-]*[\*\-\d+\.]\s+(.+)/gm);
      for (const bullet of bullets) {
        const feature = bullet[1].trim();
        if (feature && !features.includes(feature)) {
          features.push(feature);
        }
      }
    }
  }

  return {
    name,
    description,
    type: "custom",
    features: features.slice(0, 10), // Limit to top 10
    entities,
    integrations,
  };
}

function estimateComplexity(requirements: string): ComplexityLevel {
  const wordCount = requirements.split(/\s+/).length;
  const entityCount = (requirements.match(/###\s+\d+\./g) || []).length;
  const toolCount = (requirements.match(/####\s+\d+\./g) || []).length;

  // Simple heuristic
  if (wordCount > 5000 || entityCount > 10 || toolCount > 15) {
    return "advanced";
  } else if (wordCount > 2000 || entityCount > 5 || toolCount > 8) {
    return "intermediate";
  } else {
    return "basic";
  }
}

async function generateProjectPlanMd(
  metadata: ProjectMetadata,
  complexity: ComplexityLevel,
  _templateType: string
): Promise<{ content: string; plan: ProjectPlan }> {
  // For now, generate a simple plan
  // In full implementation, this would read templates and replace variables

  const sessionsEstimate = complexity === "advanced" ? 15 :
                          complexity === "intermediate" ? 10 : 5;

  const timeEstimate = complexity === "advanced" ? "40-50h" :
                      complexity === "intermediate" ? "25-35h" : "15-20h";

  const content = `# Project Plan: ${metadata.name}

## Overview

${metadata.description}

## Technical Stack

- **Backend**: TypeScript + Node.js
- **MCP**: Model Context Protocol SDK
- **Database**: SQLite (better-sqlite3)
- **Integration**: GitHub API (Octokit)

## Scope & Complexity

**Complexity Level**: ${complexity}

**Core Features**:
${metadata.features.map(f => `- ${f}`).join("\n")}

**Core Entities**:
${metadata.entities.map(e => `- ${e}`).join("\n")}

## Phases

### Phase 1: Core Infrastructure
**Goal**: Set up foundation and basic tools

**Sessions**:
1. **Session 1: Project Setup & Type Definitions** (3h)
   - Set up TypeScript project structure
   - Define all type interfaces
   - Set up database schema
   - Write tests for database operations

2. **Session 2: Template Engine & File Operations** (3h)
   - Implement template variable replacement
   - File I/O utilities
   - Template discovery
   - Write tests for template engine

### Phase 2: Planning Tools
**Goal**: Implement core planning capabilities

**Sessions**:
3. **Session 3: generateProjectPlan Tool** (4h)
   - Parse requirements
   - Template processing
   - Session breakdown logic
   - Write comprehensive tests

4. **Session 4: analyzeRequirements Tool** (3h)
   - Requirement parsing
   - Gap detection
   - Conflict identification
   - Write tests for analysis

5. **Session 5: critiquePlan Tool** (3h)
   - Plan parsing
   - Dependency graph analysis
   - Parallelization opportunities
   - Write tests for critique

### Phase 3: GitHub Integration
**Goal**: Full GitHub orchestration

**Sessions**:
6. **Session 6: setupGitHubProject Tool** (4h)
   - GitHub API integration
   - Issue creation
   - Project board setup
   - Milestone creation
   - Write integration tests

7. **Session 7: trackProgress Tool** (3h)
   - GitHub querying
   - Metrics calculation
   - Progress reporting
   - Write tests for tracking

8. **Session 8: syncWithGitHub Tool** (3h)
   - Bidirectional sync logic
   - Conflict resolution
   - State management
   - Write sync tests

### Phase 4: Intelligence & Resources
**Goal**: Smart features and resource endpoints

**Sessions**:
9. **Session 9: Intelligence Tools** (4h)
   - reviewArchitecture implementation
   - estimateEffort with historical data
   - Pattern recognition
   - Write intelligence tests

10. **Session 10: Resource Handlers** (3h)
    - Project resources
    - Template resources
    - Pattern resources
    - Metrics resources
    - Write resource tests

11. **Session 11: Prompt Handlers** (2h)
    - Discovery questions prompt
    - Architecture review prompt
    - Estimation prompt
    - Write prompt tests

### Phase 5: Polish & Documentation
**Goal**: Production-ready MCP server

**Sessions**:
12. **Session 12: Error Handling & Validation** (3h)
    - Input validation
    - Error messages
    - Graceful degradation
    - Write error handling tests

13. **Session 13: Performance & Optimization** (2h)
    - Template caching
    - Database optimization
    - Response time tuning
    - Write performance tests

14. **Session 14: Documentation & Examples** (3h)
    - API documentation
    - Usage examples
    - Configuration guide
    - Troubleshooting guide

15. **Session 15: E2E Testing & Release** (3h)
    - End-to-end workflows
    - Integration testing
    - Package for distribution
    - Write release notes

## Total Estimates

- **Total Sessions**: ${sessionsEstimate}
- **Estimated Time**: ${timeEstimate}
- **Phases**: 5

## Success Criteria

- ✅ All 11 tools implemented and tested
- ✅ GitHub integration working end-to-end
- ✅ Database operations reliable
- ✅ Type safety enforced (strict mode)
- ✅ >85% test coverage
- ✅ Documentation complete
- ✅ Successfully dogfooded (used to build itself)

## Testing Strategy

- **Unit Tests**: Jest for all tools and utilities
- **Integration Tests**: GitHub API mocked
- **E2E Tests**: Real MCP server interaction
- **Dogfooding**: Use MCP to track its own development
`;

  const plan: ProjectPlan = {
    name: metadata.name,
    description: metadata.description,
    projectType: "custom",
    complexity,
    techStack: {
      backend: "TypeScript + Node.js + MCP SDK",
      frontend: "N/A",
      mobile: "N/A",
      infrastructure: ["SQLite", "GitHub API"],
    },
    features: metadata.features,
    integrations: metadata.integrations,
    phases: [], // Would be fully populated in real implementation
    totalSessions: sessionsEstimate,
    totalEstimatedTime: timeEstimate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return { content, plan };
}
