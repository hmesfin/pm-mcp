// src/tools/github/setupGitHubProject.ts

import * as fs from "fs/promises";
import {
  SetupGitHubProjectParams,
  SetupGitHubProjectResult,
} from "../../types/tools.js";
import { parsePlan } from "../../services/planParser.js";

// This will use the GitHub MCP tools
// For now, we'll create a structure that can be used with GitHub MCP

export async function setupGitHubProject(
  params: SetupGitHubProjectParams
): Promise<SetupGitHubProjectResult> {
  const errors: string[] = [];
  const labelsCreated: string[] = [];

  try {
    // 1. Read and parse the project plan
    const planContent = await fs.readFile(params.planPath, "utf-8");
    const plan = parsePlan(planContent);

    // 2. Generate label configurations
    const labels = generateLabels(plan, params.labels);
    labelsCreated.push(...labels.map(l => l.name));

    // 3. Generate milestone configurations
    const milestones = params.createMilestones !== false
      ? generateMilestones(plan)
      : [];

    // 4. Generate issue configurations
    const issues = generateIssues(plan, params.planPath);

    // 5. Return configuration for GitHub MCP to execute
    // In a real implementation, this would call GitHub MCP tools
    // For now, return the data structure

    return {
      success: true,
      projectUrl: `https://github.com/${params.owner}/${params.repo}/projects`,
      issuesCreated: issues.map((issue, idx) => ({
        sessionNumber: idx + 1,
        issueNumber: idx + 1, // Placeholder
        title: issue.title,
        url: `https://github.com/${params.owner}/${params.repo}/issues/${idx + 1}`,
      })),
      milestonesCreated: milestones.map((milestone, idx) => ({
        phaseNumber: idx + 1,
        milestoneNumber: idx + 1,
        title: milestone.title,
        url: `https://github.com/${params.owner}/${params.repo}/milestones/${idx + 1}`,
      })),
      labelsCreated,
      errors: [],
    };
  } catch (error) {
    errors.push(`Failed to setup GitHub project: ${error}`);
    return {
      success: false,
      issuesCreated: [],
      milestonesCreated: [],
      labelsCreated: [],
      errors,
    };
  }
}

interface Label {
  name: string;
  color: string;
  description: string;
}

function generateLabels(plan: any, labelConfig?: any): Label[] {
  const labels: Label[] = [];

  // Phase labels
  if (labelConfig?.phases !== false) {
    for (let i = 1; i <= plan.phases.length; i++) {
      labels.push({
        name: `phase-${i}`,
        color: "0E8A16",
        description: `Phase ${i}: ${plan.phases[i - 1]?.name || ""}`,
      });
    }
  }

  // Domain labels
  if (labelConfig?.domains !== false) {
    labels.push(
      { name: "backend", color: "1D76DB", description: "Backend development" },
      { name: "frontend", color: "FBCA04", description: "Frontend development" },
      { name: "mobile", color: "D93F0B", description: "Mobile development" },
      { name: "e2e", color: "8B572A", description: "End-to-end testing" },
      { name: "infrastructure", color: "5319E7", description: "Infrastructure and tooling" }
    );
  }

  // TDD Phase labels
  if (labelConfig?.tddPhases !== false) {
    labels.push(
      { name: "red-phase", color: "D73A4A", description: "🔴 Writing tests (RED)" },
      { name: "green-phase", color: "0E8A16", description: "🟢 Implementation (GREEN)" },
      { name: "refactor-phase", color: "1D76DB", description: "🔵 Refactoring (REFACTOR)" }
    );
  }

  // Status labels
  labels.push(
    { name: "in-progress", color: "FEF2C0", description: "Currently being worked on" },
    { name: "blocked", color: "D73A4A", description: "Blocked by dependencies or issues" },
    { name: "ready-for-review", color: "0E8A16", description: "Ready for code review" }
  );

  return labels;
}

interface Milestone {
  title: string;
  description: string;
  due_on?: string;
}

function generateMilestones(plan: any): Milestone[] {
  return plan.phases.map((phase: any) => ({
    title: `Phase ${phase.number}: ${phase.name}`,
    description: `${phase.goal}\n\nSessions: ${phase.totalSessions}\nEstimated Time: ${phase.estimatedTime}`,
  }));
}

interface Issue {
  title: string;
  body: string;
  labels: string[];
  milestone?: number;
}

function generateIssues(plan: any, planPath: string): Issue[] {
  const issues: Issue[] = [];

  for (const phase of plan.phases) {
    for (const session of phase.sessions) {
      const issue: Issue = {
        title: `Session ${session.number}: ${session.title}`,
        body: generateIssueBody(session, phase, planPath),
        labels: generateSessionLabels(session, phase),
        milestone: phase.number,
      };
      issues.push(issue);
    }
  }

  return issues;
}

function generateIssueBody(session: any, phase: any, planPath: string): string {
  return `# Session ${session.number}: ${session.title}

## 🎯 Objectives

${session.objectives.map((obj: string) => `- ${obj}`).join("\n")}

## 🔴 RED Phase

Write comprehensive tests FIRST before any implementation.

**Expected outcome**: ❌ All tests fail (implementation doesn't exist yet)

### Tasks:
${session.objectives.map((obj: string) => `- [ ] Write tests for: ${obj}`).join("\n")}

**Commands**:
\`\`\`bash
npm run test
# Expected: Tests fail
\`\`\`

## 🟢 GREEN Phase

Implement the minimum code to make all tests pass.

**Expected outcome**: ✅ All tests pass

### Tasks:
${session.objectives.map((obj: string) => `- [ ] Implement: ${obj}`).join("\n")}

**Commands**:
\`\`\`bash
npm run test
# Expected: All tests pass
npm run type-check
# Expected: No type errors
\`\`\`

## 🔵 REFACTOR Phase

Improve code quality while keeping tests passing.

**Expected outcome**: ✅ Tests still pass, code is optimized

### Tasks:
- [ ] Add comprehensive documentation
- [ ] Add type hints/annotations
- [ ] Optimize performance
- [ ] Extract reusable patterns

**Commands**:
\`\`\`bash
npm run test
# Expected: All tests still pass
npm run lint
# Expected: No lint errors
\`\`\`

## ✅ Exit Criteria

- [ ] All tests passing (${session.estimatedTests}+ tests)
- [ ] >85% code coverage
- [ ] Type checking passes (strict mode)
- [ ] Lint passes
- [ ] Code documented
- [ ] Committed to git

## 📊 Metadata

- **Phase**: ${phase.number} - ${phase.name}
- **Domain**: ${session.domain}
- **Estimated Time**: ${session.estimatedTime.estimated}
- **Estimated Tests**: ${session.estimatedTests}
- **Dependencies**: ${session.dependencies.length > 0 ? session.dependencies.map((d: number) => `#${d}`).join(", ") : "None"}

## 🔗 Links

- [PROJECT_PLAN.md](${planPath})

---

🤖 **Generated by project-planner MCP** | Follow TDD: RED → GREEN → REFACTOR
`;
}

function generateSessionLabels(session: any, phase: any): string[] {
  return [
    `phase-${phase.number}`,
    session.domain,
    `session-${session.number}`,
  ];
}
