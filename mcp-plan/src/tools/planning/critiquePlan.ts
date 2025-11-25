// src/tools/planning/critiquePlan.ts
/**
 * Review and critique an existing project plan for issues, opportunities, and improvements.
 *
 * This tool provides comprehensive plan analysis including:
 * - Dependency graph validation
 * - Circular dependency detection
 * - Parallelization opportunities
 * - Session scope analysis
 * - Risk assessment
 *
 * @module critiquePlan
 */

import * as fs from 'fs/promises';
import type {
  CritiquePlanParams,
  PlanCritique,
  SessionCritique,
  ParallelizationOpportunity,
} from '../../types/tools.js';
import type { Risk } from '../../types/common.js';

interface ParsedSession {
  number: number;
  title: string;
  estimatedTime?: string;
  domain?: string;
  dependencies: number[];
  objectives: string[];
}

/**
 * Review and critique an existing project plan for issues, opportunities, and improvements.
 *
 * @param params - Critique parameters
 * @param params.planPath - Path to PROJECT_PLAN.md file
 * @returns Plan critique with scores, issues, and recommendations
 */
export async function critiquePlan(
  params: CritiquePlanParams
): Promise<PlanCritique> {
  const { planPath } = params;

  // Read the plan file
  const content = await fs.readFile(planPath, 'utf-8');

  // Handle empty content
  if (!content.trim()) {
    return createEmptyCritique();
  }

  // Parse sessions from the plan
  const sessions = parseSessions(content);

  // Analyze dependencies
  const dependencyAnalysis = analyzeDependencies(sessions);

  // Find parallelization opportunities
  const parallelization = findParallelization(sessions);

  // Critique each session
  const sessionCritiques = critiqueSessions(sessions);

  // Assess risks
  const risks = assessRisks(sessions, dependencyAnalysis);

  // Generate recommendations
  const recommendations = generateRecommendations(
    sessions,
    dependencyAnalysis,
    sessionCritiques,
    parallelization
  );

  // Calculate overall score and identify strengths/weaknesses
  const overall = calculateOverallScore(
    sessions,
    dependencyAnalysis,
    sessionCritiques
  );

  return {
    overall,
    sessions: sessionCritiques,
    dependencies: dependencyAnalysis,
    parallelization,
    risks,
    recommendations,
  };
}

/**
 * Create an empty critique for invalid plans
 */
function createEmptyCritique(): PlanCritique {
  return {
    overall: {
      score: 0,
      strengths: [],
      weaknesses: ['Plan is empty or invalid'],
    },
    sessions: [],
    dependencies: {
      valid: false,
      circularDependencies: [],
      missingDependencies: [],
    },
    parallelization: {
      opportunities: [],
      estimatedTimeSavings: '0h',
    },
    risks: [],
    recommendations: ['Add sessions to the project plan'],
  };
}

/**
 * Parse sessions from plan content
 */
function parseSessions(content: string): ParsedSession[] {
  const sessions: ParsedSession[] = [];

  // Support multiple session formats:
  // 1. ### Session 1: Title (H3 heading)
  // 2. **Session 1: Title** (3h) (bold inline, numbered list)
  const sessionPatterns = [
    /###\s*Session\s*#?(\d+)[:\s-]+([^\n]+)/gi,
    /\*\*Session\s*(\d+):\s*([^*]+)\*\*\s*\((\d+)h?\)/gi,
    /^\d+\.\s*\*\*Session\s*(\d+):\s*([^*]+)\*\*\s*\((\d+)h?\)/gim,
  ];

  for (const sessionRegex of sessionPatterns) {
    let match;
    sessionRegex.lastIndex = 0; // Reset regex state

    while ((match = sessionRegex.exec(content)) !== null) {
      const sessionNumber = parseInt(match[1], 10);

      // Skip if we already have this session
      if (sessions.some(s => s.number === sessionNumber)) {
        continue;
      }

      const title = match[2].trim();

      // Find section content (until next session or end)
      const startIndex = match.index;
      const remainingContent = content.slice(startIndex + match[0].length);
      const nextSessionMatch = remainingContent.search(/(?:###\s*Session|\*\*Session\s*\d+:)/i);
      const endIndex = nextSessionMatch === -1
        ? content.length
        : startIndex + match[0].length + nextSessionMatch;
      const sectionContent = content.slice(startIndex, endIndex);

      // Parse dependencies
      const dependencies = parseDependencies(sectionContent);

      // Parse estimated time - check capture group first, then search content
      let estimatedTime: string | undefined;
      if (match[3]) {
        estimatedTime = match[3] + 'h';
      } else {
        const timeMatch = sectionContent.match(/\*\*Estimated Time\*\*:\s*(\d+h?)/i);
        estimatedTime = timeMatch ? timeMatch[1] : undefined;
      }

      // Parse domain
      const domainMatch = sectionContent.match(/\*\*Domain\*\*:\s*(\w+)/i);
      const domain = domainMatch ? domainMatch[1] : undefined;

      // Parse objectives
      const objectives = parseObjectives(sectionContent);

      sessions.push({
        number: sessionNumber,
        title,
        estimatedTime,
        domain,
        dependencies,
        objectives,
      });
    }
  }

  return sessions.sort((a, b) => a.number - b.number);
}

/**
 * Parse dependencies from session content
 */
function parseDependencies(content: string): number[] {
  const dependencies: number[] = [];
  const depMatch = content.match(/\*\*Dependencies\*\*:\s*([^\n]+)/i);

  if (depMatch) {
    const depText = depMatch[1];
    if (depText.toLowerCase().includes('none')) {
      return [];
    }

    // Extract session numbers
    const sessionRefs = depText.match(/Session\s*#?(\d+)/gi) || [];
    for (const ref of sessionRefs) {
      const numMatch = ref.match(/(\d+)/);
      if (numMatch) {
        dependencies.push(parseInt(numMatch[1], 10));
      }
    }
  }

  return dependencies;
}

/**
 * Parse objectives from session content
 */
function parseObjectives(content: string): string[] {
  const objectives: string[] = [];
  const objectivesSection = content.match(/####\s*Objectives[\s\S]*?(?=####|$)/i);

  if (objectivesSection) {
    const bulletRegex = /^[\s]*[-*]\s+(.+)$/gm;
    let match;
    while ((match = bulletRegex.exec(objectivesSection[0])) !== null) {
      objectives.push(match[1].trim());
    }
  }

  return objectives;
}

/**
 * Analyze dependencies for validity, circular deps, and missing deps
 */
function analyzeDependencies(sessions: ParsedSession[]): PlanCritique['dependencies'] {
  const sessionNumbers = new Set(sessions.map((s) => s.number));
  const missingDependencies: { session: number; requires: number }[] = [];
  const circularDependencies: number[][] = [];

  // Check for missing dependencies
  for (const session of sessions) {
    for (const dep of session.dependencies) {
      if (!sessionNumbers.has(dep)) {
        missingDependencies.push({ session: session.number, requires: dep });
      }
    }
  }

  // Build adjacency list for cycle detection
  const graph = new Map<number, number[]>();
  for (const session of sessions) {
    graph.set(session.number, session.dependencies);
  }

  // Detect cycles using DFS
  const visited = new Set<number>();
  const recStack = new Set<number>();

  function findCycle(node: number, path: number[]): number[] | null {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const deps = graph.get(node) || [];
    for (const dep of deps) {
      if (!visited.has(dep)) {
        const cycle = findCycle(dep, [...path]);
        if (cycle) return cycle;
      } else if (recStack.has(dep)) {
        // Found cycle - return path from dep to current
        const cycleStart = path.indexOf(dep);
        return path.slice(cycleStart);
      }
    }

    recStack.delete(node);
    return null;
  }

  for (const session of sessions) {
    if (!visited.has(session.number)) {
      const cycle = findCycle(session.number, []);
      if (cycle && cycle.length >= 2) {
        // Avoid duplicates
        const cycleKey = [...cycle].sort().join(',');
        const existing = circularDependencies.some(
          (c) => [...c].sort().join(',') === cycleKey
        );
        if (!existing) {
          circularDependencies.push(cycle);
        }
      }
    }
  }

  const valid =
    missingDependencies.length === 0 && circularDependencies.length === 0;

  return {
    valid,
    circularDependencies,
    missingDependencies,
  };
}

/**
 * Find parallelization opportunities
 */
function findParallelization(sessions: ParsedSession[]): PlanCritique['parallelization'] {
  const opportunities: ParallelizationOpportunity[] = [];

  // Group sessions by their dependencies
  const depGroups = new Map<string, ParsedSession[]>();
  for (const session of sessions) {
    const depKey = session.dependencies.sort().join(',') || 'none';
    if (!depGroups.has(depKey)) {
      depGroups.set(depKey, []);
    }
    depGroups.get(depKey)!.push(session);
  }

  // Sessions with same dependencies can run in parallel
  for (const [_depKey, group] of depGroups) {
    if (group.length >= 2) {
      const sessionNumbers = group.map((s) => s.number);
      const domains = [...new Set(group.map((s) => s.domain).filter(Boolean))];
      const totalTime = group.reduce((sum, s) => {
        const hours = parseInt(s.estimatedTime || '3', 10);
        return sum + hours;
      }, 0);
      const parallelTime = Math.max(
        ...group.map((s) => parseInt(s.estimatedTime || '3', 10))
      );
      const savings = totalTime - parallelTime;

      opportunities.push({
        sessions: sessionNumbers,
        reason:
          domains.length > 1
            ? `Sessions work on different domains (${domains.join(', ')}) with same dependencies`
            : `Sessions have identical dependencies and can run concurrently`,
        timeSavings: `${savings}h`,
      });
    }
  }

  // Calculate total time savings
  const totalSavings = opportunities.reduce((sum, opp) => {
    return sum + parseInt(opp.timeSavings, 10);
  }, 0);

  return {
    opportunities,
    estimatedTimeSavings: `${totalSavings}h`,
  };
}

/**
 * Critique individual sessions
 */
function critiqueSessions(sessions: ParsedSession[]): SessionCritique[] {
  return sessions.map((session) => {
    const issues: SessionCritique['issues'] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check estimated time (scope issues)
    const hours = parseInt(session.estimatedTime || '3', 10);
    if (hours > 8) {
      issues.push({
        severity: 'high',
        category: 'scope',
        description: `Session estimated at ${hours}h exceeds recommended 4-6 hour limit`,
      });
      score -= 20;
      suggestions.push('Consider splitting into smaller sessions');
    } else if (hours > 6) {
      issues.push({
        severity: 'medium',
        category: 'scope',
        description: `Session estimated at ${hours}h is on the higher end`,
      });
      score -= 10;
    }

    // Check objectives count
    if (session.objectives.length > 8) {
      issues.push({
        severity: 'medium',
        category: 'scope',
        description: `Too many objectives (${session.objectives.length}) may indicate scope creep`,
      });
      score -= 10;
      suggestions.push('Focus on 3-5 key objectives per session');
    } else if (session.objectives.length === 0) {
      issues.push({
        severity: 'medium',
        category: 'scope',
        description: 'No objectives defined for session',
      });
      score -= 15;
      suggestions.push('Add clear, measurable objectives');
    }

    // Check for missing domain
    if (!session.domain) {
      issues.push({
        severity: 'low',
        category: 'scope',
        description: 'No domain specified for session',
      });
      score -= 5;
      suggestions.push('Specify domain (backend, frontend, mobile, etc.)');
    }

    // Check for missing time estimate
    if (!session.estimatedTime) {
      issues.push({
        severity: 'low',
        category: 'timeline',
        description: 'No time estimate provided',
      });
      score -= 5;
      suggestions.push('Add time estimate for better planning');
    }

    return {
      sessionNumber: session.number,
      score: Math.max(0, score),
      issues,
      suggestions,
    };
  });
}

/**
 * Assess risks based on analysis
 */
function assessRisks(
  sessions: ParsedSession[],
  dependencyAnalysis: PlanCritique['dependencies']
): Risk[] {
  const risks: Risk[] = [];

  // Risk from circular dependencies
  if (dependencyAnalysis.circularDependencies.length > 0) {
    risks.push({
      severity: 'critical',
      category: 'dependency',
      title: 'Circular dependencies detected',
      description: `Found ${dependencyAnalysis.circularDependencies.length} circular dependency chain(s) that will block execution`,
      mitigation: 'Refactor sessions to break circular dependency chains',
      probability: 'high',
      impact: 'high',
    });
  }

  // Risk from missing dependencies
  if (dependencyAnalysis.missingDependencies.length > 0) {
    risks.push({
      severity: 'high',
      category: 'dependency',
      title: 'Missing dependencies',
      description: `${dependencyAnalysis.missingDependencies.length} session(s) reference non-existent dependencies`,
      mitigation: 'Add missing sessions or correct dependency references',
      probability: 'high',
      impact: 'high',
    });
  }

  // Risk from large sessions
  const largeSessions = sessions.filter((s) => {
    const hours = parseInt(s.estimatedTime || '3', 10);
    return hours > 8;
  });
  if (largeSessions.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'scope',
      title: 'Oversized sessions',
      description: `${largeSessions.length} session(s) exceed 8 hours and risk incomplete delivery`,
      mitigation: 'Split large sessions into smaller, focused units',
      probability: 'medium',
      impact: 'medium',
    });
  }

  // Risk from no testing
  const hasTestingSession = sessions.some(
    (s) => s.title.toLowerCase().includes('test') || s.domain === 'e2e'
  );
  if (!hasTestingSession && sessions.length > 3) {
    risks.push({
      severity: 'medium',
      category: 'technical',
      title: 'No dedicated testing session',
      description: 'Plan lacks explicit testing/QA sessions',
      mitigation: 'Add dedicated E2E testing and QA sessions',
      probability: 'medium',
      impact: 'medium',
    });
  }

  return risks;
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  sessions: ParsedSession[],
  dependencyAnalysis: PlanCritique['dependencies'],
  sessionCritiques: SessionCritique[],
  parallelization: PlanCritique['parallelization']
): string[] {
  const recommendations: string[] = [];

  // Dependency recommendations
  if (dependencyAnalysis.circularDependencies.length > 0) {
    recommendations.push(
      'CRITICAL: Break circular dependencies before starting execution'
    );
  }
  if (dependencyAnalysis.missingDependencies.length > 0) {
    recommendations.push(
      'Add missing sessions or correct invalid dependency references'
    );
  }

  // Parallelization recommendations
  if (parallelization.opportunities.length > 0) {
    recommendations.push(
      `Consider parallel execution of independent sessions to save ${parallelization.estimatedTimeSavings}`
    );
  }

  // Session-specific recommendations
  const highIssueCount = sessionCritiques.filter(
    (s) => s.issues.some((i) => i.severity === 'high')
  ).length;
  if (highIssueCount > 0) {
    recommendations.push(
      `Review and address high-severity issues in ${highIssueCount} session(s)`
    );
  }

  // General best practices
  if (sessions.length > 0 && sessions.every((s) => !s.domain)) {
    recommendations.push('Add domain labels to sessions for better organization');
  }

  // Always provide at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push('Plan structure looks good - consider adding more detail to objectives');
  }

  return recommendations;
}

/**
 * Calculate overall score and identify strengths/weaknesses
 */
function calculateOverallScore(
  sessions: ParsedSession[],
  dependencyAnalysis: PlanCritique['dependencies'],
  sessionCritiques: SessionCritique[]
): PlanCritique['overall'] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  let score = 100;

  // Dependency scoring
  if (dependencyAnalysis.valid) {
    strengths.push('Clean dependency graph with no cycles or missing references');
  } else {
    if (dependencyAnalysis.circularDependencies.length > 0) {
      weaknesses.push('Contains circular dependencies');
      score -= 30;
    }
    if (dependencyAnalysis.missingDependencies.length > 0) {
      weaknesses.push('References non-existent sessions');
      score -= 20;
    }
  }

  // Session quality scoring
  const avgSessionScore =
    sessionCritiques.length > 0
      ? sessionCritiques.reduce((sum, s) => sum + s.score, 0) /
        sessionCritiques.length
      : 0;

  if (avgSessionScore >= 90) {
    strengths.push('Well-scoped sessions with clear objectives');
  } else if (avgSessionScore < 70) {
    weaknesses.push('Sessions have scope or definition issues');
    score -= 15;
  }

  // Penalize based on average session score - significant penalty for low quality sessions
  if (avgSessionScore < 100) {
    score -= Math.round((100 - avgSessionScore) * 0.5);
  }

  // Structure scoring
  if (sessions.length > 0) {
    const hasDomains = sessions.some((s) => s.domain);
    const hasEstimates = sessions.some((s) => s.estimatedTime);

    if (hasDomains) {
      strengths.push('Sessions organized by domain');
    }
    if (hasEstimates) {
      strengths.push('Time estimates provided for planning');
    }
    if (!hasDomains) {
      weaknesses.push('Missing domain categorization');
      score -= 5;
    }
    if (!hasEstimates) {
      weaknesses.push('Missing time estimates');
      score -= 5;
    }
  } else {
    weaknesses.push('No sessions defined in plan');
    score = 0;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    strengths,
    weaknesses,
  };
}
