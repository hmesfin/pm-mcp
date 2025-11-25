// src/tools/planning/analyzeRequirements.ts
/**
 * Analyze requirements document for completeness, clarity, conflicts, gaps, and feasibility.
 *
 * This tool provides comprehensive analysis of requirements including:
 * - Completeness scoring
 * - Gap detection
 * - Conflict identification
 * - Ambiguity detection
 * - Risk assessment
 * - Improvement suggestions
 *
 * @module analyzeRequirements
 */

import type {
  AnalyzeRequirementsParams,
  RequirementsAnalysis,
  Gap,
  Conflict,
  Ambiguity,
} from '../../types/tools.js';
import type {
  ComplexityLevel,
  ProjectType,
  Suggestion,
  Risk,
} from '../../types/common.js';

// Vague terms that indicate ambiguous requirements
const VAGUE_TERMS = [
  'fast',
  'quick',
  'good',
  'better',
  'nice',
  'easy',
  'simple',
  'secure',
  'scalable',
  'robust',
  'efficient',
  'optimal',
  'appropriate',
  'reasonable',
  'adequate',
  'sufficient',
  'multiple',
  'various',
  'several',
  'many',
  'few',
  'some',
  'etc',
  'and so on',
  'as needed',
  'if necessary',
  'when appropriate',
];

// Key sections expected in well-formed requirements
const EXPECTED_SECTIONS = [
  { pattern: /##?\s*(functional|features)/i, name: 'Functional Requirements' },
  { pattern: /##?\s*(non-functional|nfr|performance)/i, name: 'Non-Functional Requirements' },
  { pattern: /##?\s*(security|auth)/i, name: 'Security Requirements' },
  { pattern: /##?\s*(tech|stack|architecture)/i, name: 'Technical Stack' },
  { pattern: /##?\s*(test|quality)/i, name: 'Testing Requirements' },
  { pattern: /##?\s*(data|model|database)/i, name: 'Data Model' },
  { pattern: /##?\s*(api|endpoint)/i, name: 'API Requirements' },
  { pattern: /##?\s*(ui|ux|interface|frontend)/i, name: 'UI/UX Requirements' },
];

// Project type specific required features
const PROJECT_TYPE_FEATURES: Record<ProjectType, string[]> = {
  blog: ['posts', 'comments', 'users', 'tags', 'categories', 'search'],
  ecommerce: ['products', 'cart', 'checkout', 'payment', 'inventory', 'orders', 'shipping'],
  saas: ['subscription', 'billing', 'multi-tenant', 'api', 'webhooks', 'authentication'],
  social: ['profiles', 'connections', 'feed', 'messaging', 'notifications', 'privacy'],
  projectmanagement: ['projects', 'tasks', 'teams', 'timeline', 'assignments', 'reports'],
  custom: [],
};

/**
 * Analyze requirements document for completeness, clarity, conflicts, gaps, and feasibility.
 *
 * @param params - Analysis parameters
 * @param params.requirements - Markdown content of requirements document
 * @param params.projectType - Optional project type for domain-specific analysis
 * @returns Requirements analysis with gaps, conflicts, ambiguities, suggestions, and risks
 */
export async function analyzeRequirements(
  params: AnalyzeRequirementsParams
): Promise<RequirementsAnalysis> {
  const { requirements, projectType } = params;

  // Handle empty or whitespace-only requirements
  const trimmed = requirements.trim();
  if (!trimmed) {
    return createEmptyAnalysis();
  }

  // Parse the requirements document
  const lines = trimmed.split('\n');
  const sections = parseSections(trimmed);
  const bulletPoints = extractBulletPoints(trimmed);

  // Detect gaps
  const gaps = detectGaps(trimmed, sections, projectType);

  // Detect conflicts
  const conflicts = detectConflicts(trimmed, lines);

  // Detect ambiguities
  const ambiguities = detectAmbiguities(trimmed, lines);

  // Calculate scores
  const completeness = calculateCompleteness(sections, bulletPoints, gaps);
  const clarity = calculateClarity(ambiguities, trimmed);
  const feasibility = calculateFeasibility(conflicts, gaps);

  // Generate suggestions
  const suggestions = generateSuggestions(gaps, sections, projectType);

  // Assess risks
  const risks = assessRisks(gaps, conflicts, trimmed);

  // Estimate complexity
  const estimatedComplexity = estimateComplexity(bulletPoints, sections, trimmed);

  // Determine validity
  const valid = completeness >= 40 && conflicts.length === 0;

  return {
    valid,
    completeness,
    clarity,
    feasibility,
    gaps,
    conflicts,
    ambiguities,
    suggestions,
    risks,
    estimatedComplexity,
  };
}

/**
 * Create an empty analysis for invalid requirements
 */
function createEmptyAnalysis(): RequirementsAnalysis {
  return {
    valid: false,
    completeness: 0,
    clarity: 0,
    feasibility: 0,
    gaps: [],
    conflicts: [],
    ambiguities: [],
    suggestions: [],
    risks: [],
    estimatedComplexity: 'basic',
  };
}

/**
 * Parse sections from requirements markdown
 */
function parseSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const sectionRegex = /^#{1,3}\s+(.+)$/gm;
  let match;
  const matches: { title: string; index: number }[] = [];

  while ((match = sectionRegex.exec(content)) !== null) {
    matches.push({ title: match[1], index: match.index });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : content.length;
    sections.set(matches[i].title.toLowerCase(), content.slice(start, end));
  }

  return sections;
}

/**
 * Extract bullet points from markdown
 */
function extractBulletPoints(content: string): string[] {
  const bulletRegex = /^[\s]*[-*+]\s+(.+)$/gm;
  const bullets: string[] = [];
  let match;

  while ((match = bulletRegex.exec(content)) !== null) {
    bullets.push(match[1]);
  }

  return bullets;
}

/**
 * Detect gaps in requirements
 */
function detectGaps(
  content: string,
  sections: Map<string, string>,
  projectType?: ProjectType
): Gap[] {
  const gaps: Gap[] = [];
  const contentLower = content.toLowerCase();

  // Check for missing expected sections
  for (const expected of EXPECTED_SECTIONS) {
    const hasSection = [...sections.keys()].some((key) =>
      expected.pattern.test(key)
    );
    const hasInContent = expected.pattern.test(contentLower);

    if (!hasSection && !hasInContent) {
      const category = getSectionCategory(expected.name);
      const severity = getSectionSeverity(expected.name);

      gaps.push({
        category,
        title: `Missing ${expected.name}`,
        description: `The requirements document does not include a ${expected.name} section.`,
        severity,
        recommendation: `Add a dedicated section for ${expected.name} with specific, measurable criteria.`,
      });
    }
  }

  // Check for project-type specific gaps
  if (projectType && projectType !== 'custom') {
    const requiredFeatures = PROJECT_TYPE_FEATURES[projectType];
    for (const feature of requiredFeatures) {
      if (!contentLower.includes(feature)) {
        gaps.push({
          category: 'workflow',
          title: `Missing ${feature} feature`,
          description: `For a ${projectType} project, ${feature} functionality is typically required but not mentioned.`,
          severity: 'major',
          recommendation: `Add requirements for ${feature} functionality appropriate for a ${projectType} application.`,
        });
      }
    }
  }

  return gaps;
}

/**
 * Get category for a section gap
 */
function getSectionCategory(sectionName: string): Gap['category'] {
  const name = sectionName.toLowerCase();
  if (name.includes('security')) return 'security';
  if (name.includes('test')) return 'testing';
  if (name.includes('data') || name.includes('model')) return 'data-model';
  if (name.includes('api')) return 'api';
  if (name.includes('ui') || name.includes('ux')) return 'ui';
  return 'workflow';
}

/**
 * Get severity for a missing section
 */
function getSectionSeverity(sectionName: string): Gap['severity'] {
  const name = sectionName.toLowerCase();
  if (name.includes('security')) return 'critical';
  if (name.includes('functional')) return 'critical';
  if (name.includes('test')) return 'major';
  return 'minor';
}

/**
 * Detect conflicts in requirements
 */
function detectConflicts(content: string, _lines: string[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const contentLower = content.toLowerCase();

  // Check for contradictory age requirements
  if (
    contentLower.includes('18+') &&
    contentLower.includes('any age')
  ) {
    conflicts.push({
      category: 'business',
      title: 'Contradictory age requirements',
      description: 'Requirements state both age restrictions and no age restrictions.',
      conflictingItems: [
        'Users must be 18+ to register',
        'Users of any age can register',
      ],
      recommendation: 'Clarify the target audience and legal requirements for user registration.',
    });
  }

  // Check for contradictory data retention
  if (
    (contentLower.includes('stored indefinitely') || contentLower.includes('never delete')) &&
    (contentLower.includes('deleted after') || contentLower.includes('delete after'))
  ) {
    conflicts.push({
      category: 'technical',
      title: 'Contradictory data retention policies',
      description: 'Requirements contain conflicting data retention rules.',
      conflictingItems: [
        'Data stored indefinitely',
        'Data deleted after period of inactivity',
      ],
      recommendation: 'Define a clear, consistent data retention policy that complies with regulations.',
    });
  }

  // Check for contradictory privacy settings
  if (
    contentLower.includes('private by default') &&
    contentLower.includes('public') &&
    contentLower.includes('visible to everyone')
  ) {
    conflicts.push({
      category: 'business',
      title: 'Contradictory privacy settings',
      description: 'Requirements specify both private-by-default and public-by-default behavior.',
      conflictingItems: [
        'Posts are private by default',
        'All posts are public and visible to everyone',
      ],
      recommendation: 'Decide on a default privacy setting and provide clear user controls.',
    });
  }

  // Check for real-time vs batch processing conflicts
  if (
    contentLower.includes('real-time') &&
    contentLower.includes('batch') &&
    contentLower.includes('no real-time')
  ) {
    conflicts.push({
      category: 'technical',
      title: 'Contradictory processing requirements',
      description: 'Requirements specify both real-time and batch-only processing.',
      conflictingItems: [
        'Real-time updates required',
        'Batch processing only, no real-time features',
      ],
      recommendation: 'Clarify which features need real-time processing and which can be batched.',
    });
  }

  return conflicts;
}

/**
 * Detect ambiguities in requirements
 */
function detectAmbiguities(content: string, lines: string[]): Ambiguity[] {
  const ambiguities: Ambiguity[] = [];

  for (const line of lines) {
    const lineLower = line.toLowerCase();

    for (const term of VAGUE_TERMS) {
      // Check for vague terms in context (not just substring matches)
      const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (wordBoundaryRegex.test(lineLower)) {
        // Find which section this line belongs to
        const location = findLineLocation(line, content);

        ambiguities.push({
          location,
          text: line.trim(),
          issue: `Contains vague term "${term}" without specific criteria`,
          clarificationNeeded: `Define specific, measurable criteria instead of "${term}"`,
        });
        break; // Only report once per line
      }
    }
  }

  return ambiguities;
}

/**
 * Find the section location of a line
 */
function findLineLocation(line: string, content: string): string {
  const lines = content.split('\n');
  const lineIndex = lines.findIndex((l) => l.includes(line.trim()));

  // Look backwards for the nearest section header
  for (let i = lineIndex; i >= 0; i--) {
    if (/^#{1,3}\s+/.test(lines[i])) {
      return lines[i].replace(/^#{1,3}\s+/, '').trim();
    }
  }

  return 'Document';
}

/**
 * Calculate completeness score
 */
function calculateCompleteness(
  sections: Map<string, string>,
  bulletPoints: string[],
  gaps: Gap[]
): number {
  let score = 0;

  // Base score from sections (up to 40 points)
  const sectionCount = sections.size;
  score += Math.min(sectionCount * 8, 40);

  // Score from detail (bullet points, up to 30 points)
  const bulletCount = bulletPoints.length;
  score += Math.min(bulletCount * 2, 30);

  // Deduct for gaps (up to 30 points deduction)
  const criticalGaps = gaps.filter((g) => g.severity === 'critical').length;
  const majorGaps = gaps.filter((g) => g.severity === 'major').length;
  const minorGaps = gaps.filter((g) => g.severity === 'minor').length;

  score -= criticalGaps * 15;
  score -= majorGaps * 8;
  score -= minorGaps * 3;

  // Add base points for having any content (up to 30 points)
  if (bulletPoints.length > 0) score += 15;
  if (sections.size > 0) score += 15;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate clarity score
 */
function calculateClarity(ambiguities: Ambiguity[], content: string): number {
  const lines = content.split('\n').filter((l) => l.trim());
  const totalLines = lines.length;

  if (totalLines === 0) return 0;

  // Start with perfect score
  let score = 100;

  // Deduct for ambiguities relative to document size
  const ambiguityRatio = ambiguities.length / Math.max(totalLines, 1);
  score -= ambiguityRatio * 200; // Heavy penalty for high ambiguity ratio

  // Deduct for each ambiguity (up to 50 points)
  score -= Math.min(ambiguities.length * 5, 50);

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Calculate feasibility score
 */
function calculateFeasibility(conflicts: Conflict[], gaps: Gap[]): number {
  let score = 100;

  // Heavy penalty for conflicts
  score -= conflicts.length * 25;

  // Moderate penalty for critical gaps
  const criticalGaps = gaps.filter((g) => g.severity === 'critical').length;
  score -= criticalGaps * 10;

  // Light penalty for major gaps
  const majorGaps = gaps.filter((g) => g.severity === 'major').length;
  score -= majorGaps * 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(
  gaps: Gap[],
  sections: Map<string, string>,
  _projectType?: ProjectType
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Suggest adding missing sections
  for (const gap of gaps) {
    if (gap.title.startsWith('Missing')) {
      suggestions.push({
        category: 'workflow',
        title: `Add ${gap.title.replace('Missing ', '')}`,
        description: gap.recommendation,
        benefit: 'Improves requirements completeness and reduces implementation ambiguity',
        effort: 'low',
      });
    }
  }

  // Architecture suggestions based on complexity
  if (sections.size > 5) {
    suggestions.push({
      category: 'architecture',
      title: 'Consider modular architecture',
      description: 'With multiple feature areas, a modular architecture will improve maintainability.',
      benefit: 'Better code organization and easier testing',
      effort: 'medium',
    });
  }

  // Tooling suggestions
  if (!sections.has('testing') && !sections.has('test')) {
    suggestions.push({
      category: 'tooling',
      title: 'Define testing strategy',
      description: 'Add unit, integration, and E2E testing requirements.',
      benefit: 'Ensures quality and prevents regressions',
      effort: 'medium',
    });
  }

  return suggestions;
}

/**
 * Assess risks from requirements analysis
 */
function assessRisks(
  gaps: Gap[],
  conflicts: Conflict[],
  content: string
): Risk[] {
  const risks: Risk[] = [];
  const contentLower = content.toLowerCase();

  // Risk from security gaps
  const securityGaps = gaps.filter((g) => g.category === 'security');
  if (securityGaps.length > 0) {
    risks.push({
      severity: 'high',
      category: 'compliance',
      title: 'Security requirements undefined',
      description: 'Missing security requirements may lead to vulnerabilities.',
      mitigation: 'Define authentication, authorization, data encryption, and audit requirements.',
      probability: 'high',
      impact: 'high',
    });
  }

  // Risk from conflicts
  if (conflicts.length > 0) {
    risks.push({
      severity: 'critical',
      category: 'scope',
      title: 'Conflicting requirements',
      description: 'Contradictory requirements will cause implementation issues.',
      mitigation: 'Resolve all conflicts before starting development.',
      probability: 'high',
      impact: 'high',
    });
  }

  // Risk from incomplete testing
  const testingGaps = gaps.filter((g) => g.category === 'testing');
  if (testingGaps.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'technical',
      title: 'Testing strategy undefined',
      description: 'Lack of testing requirements may result in poor quality.',
      mitigation: 'Define test coverage targets and testing methodology.',
      probability: 'medium',
      impact: 'medium',
    });
  }

  // Risk from vague performance requirements
  if (
    !contentLower.includes('second') &&
    !contentLower.includes('ms') &&
    !contentLower.includes('concurrent')
  ) {
    risks.push({
      severity: 'medium',
      category: 'technical',
      title: 'Performance criteria undefined',
      description: 'No specific performance targets defined.',
      mitigation: 'Add measurable performance requirements (response times, throughput, etc.).',
      probability: 'medium',
      impact: 'medium',
    });
  }

  return risks;
}

/**
 * Estimate project complexity
 */
function estimateComplexity(
  bulletPoints: string[],
  sections: Map<string, string>,
  content: string
): ComplexityLevel {
  const bulletCount = bulletPoints.length;
  const sectionCount = sections.size;
  const wordCount = content.split(/\s+/).length;

  // Simple heuristics for complexity
  if (bulletCount < 5 && sectionCount < 3 && wordCount < 100) {
    return 'basic';
  }

  if (bulletCount > 20 || sectionCount > 6 || wordCount > 500) {
    return 'advanced';
  }

  return 'intermediate';
}
