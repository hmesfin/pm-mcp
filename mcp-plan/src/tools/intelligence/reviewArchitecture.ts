// src/tools/intelligence/reviewArchitecture.ts
// Reviews project architecture for patterns, anti-patterns, scalability, security, and testability

import * as fs from 'fs/promises';
import type {
  ReviewArchitectureParams,
  ArchitectureReview,
  RecognizedPattern,
  RecommendedPattern,
  AntiPattern,
  TechRecommendation,
  SecurityConcern,
} from '../../types/tools.js';

// Known patterns to detect
const RECOGNIZED_PATTERNS: {
  name: string;
  category: 'architecture' | 'design' | 'data' | 'api';
  keywords: string[];
  benefits: string[];
}[] = [
  {
    name: 'RESTful API',
    category: 'api',
    keywords: ['rest', 'restful', 'crud', 'http methods'],
    benefits: ['Standardized interface', 'Cacheable', 'Stateless', 'Well-documented patterns'],
  },
  {
    name: 'Repository Pattern',
    category: 'design',
    keywords: ['repository', 'data access', 'repository pattern'],
    benefits: ['Decouples business logic from data access', 'Easier testing', 'Swappable data sources'],
  },
  {
    name: 'Service Layer',
    category: 'architecture',
    keywords: ['service layer', 'business logic', 'service class'],
    benefits: ['Separation of concerns', 'Reusable business logic', 'Easier testing'],
  },
  {
    name: 'Component-Based Architecture',
    category: 'architecture',
    keywords: ['component', 'vue', 'react', 'angular', 'component-based'],
    benefits: ['Reusability', 'Maintainability', 'Isolation', 'Testability'],
  },
  {
    name: 'MVC/MVT Pattern',
    category: 'architecture',
    keywords: ['mvc', 'mvt', 'model view', 'django', 'controller'],
    benefits: ['Clear separation of concerns', 'Organized codebase', 'Well-understood pattern'],
  },
  {
    name: 'JWT Authentication',
    category: 'design',
    keywords: ['jwt', 'json web token', 'bearer token'],
    benefits: ['Stateless authentication', 'Scalable', 'Cross-domain support'],
  },
  {
    name: 'Caching Strategy',
    category: 'data',
    keywords: ['cache', 'redis', 'memcached', 'caching'],
    benefits: ['Improved performance', 'Reduced database load', 'Lower latency'],
  },
  {
    name: 'Message Queue',
    category: 'architecture',
    keywords: ['queue', 'celery', 'rabbitmq', 'kafka', 'async task'],
    benefits: ['Decoupled processing', 'Scalability', 'Resilience', 'Load leveling'],
  },
  {
    name: 'Lazy Loading',
    category: 'design',
    keywords: ['lazy load', 'lazy loading', 'dynamic import'],
    benefits: ['Faster initial load', 'Reduced memory usage', 'Better performance'],
  },
  {
    name: 'State Management',
    category: 'design',
    keywords: ['pinia', 'vuex', 'redux', 'state management', 'store'],
    benefits: ['Centralized state', 'Predictable data flow', 'DevTools support', 'Easier debugging'],
  },
];

// Known anti-patterns
const ANTI_PATTERNS: {
  name: string;
  category: 'architecture' | 'design' | 'data' | 'api';
  keywords: string[];
  risks: string[];
  alternative: string;
}[] = [
  {
    name: 'Fat Controllers',
    category: 'architecture',
    keywords: ['all logic in controller', 'fat controller', 'god controller'],
    risks: ['Hard to test', 'Poor separation of concerns', 'Difficult to maintain'],
    alternative: 'Move business logic to service layer, keep controllers thin',
  },
  {
    name: 'Global State',
    category: 'design',
    keywords: ['global variable', 'global state', 'singleton abuse'],
    risks: ['Unpredictable behavior', 'Hard to test', 'Race conditions'],
    alternative: 'Use dependency injection or proper state management',
  },
  {
    name: 'No Framework',
    category: 'architecture',
    keywords: ['no framework', 'raw php', 'vanilla without structure'],
    risks: ['Security vulnerabilities', 'Reinventing the wheel', 'Maintenance burden'],
    alternative: 'Use established frameworks with security features built-in',
  },
  {
    name: 'Monolithic File Structure',
    category: 'architecture',
    keywords: ['single file', 'monolithic file', 'one file'],
    risks: ['Hard to navigate', 'Merge conflicts', 'Poor organization'],
    alternative: 'Split into modules by feature or domain',
  },
  {
    name: 'No Testing Strategy',
    category: 'design',
    keywords: ['no test', 'skip test', 'no testing'],
    risks: ['Regression bugs', 'Fear of refactoring', 'Low confidence in changes'],
    alternative: 'Implement TDD with unit, integration, and E2E tests',
  },
  {
    name: 'Direct Production Deployment',
    category: 'architecture',
    keywords: ['deploy directly', 'no staging', 'production only'],
    risks: ['Untested changes in production', 'No rollback strategy', 'User-facing bugs'],
    alternative: 'Use staging environment and CI/CD pipeline',
  },
  {
    name: 'Raw SQL Queries',
    category: 'data',
    keywords: ['raw query', 'string concatenation', 'raw sql'],
    risks: ['SQL injection vulnerabilities', 'No query optimization', 'Database coupling'],
    alternative: 'Use ORM with parameterized queries',
  },
];

// Security vulnerability patterns
const SECURITY_VULNERABILITIES: {
  keywords: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'authorization' | 'data' | 'api' | 'infrastructure';
  title: string;
  description: string;
  mitigation: string;
}[] = [
  {
    keywords: ['plain text password', 'password in plain', 'passwords in plain', 'no encryption', 'store password'],
    severity: 'critical',
    category: 'data',
    title: 'Plain Text Password Storage',
    description: 'Passwords stored without hashing expose users to credential theft',
    mitigation: 'Use bcrypt, argon2, or PBKDF2 for password hashing',
  },
  {
    keywords: ['no input validation', 'no validation', 'trust user input'],
    severity: 'high',
    category: 'api',
    title: 'Missing Input Validation',
    description: 'Unvalidated input can lead to injection attacks and data corruption',
    mitigation: 'Implement server-side validation for all user inputs',
  },
  {
    keywords: ['admin without auth', 'no authentication', 'public admin'],
    severity: 'critical',
    category: 'authentication',
    title: 'Unauthenticated Admin Access',
    description: 'Admin functionality without authentication allows unauthorized access',
    mitigation: 'Require strong authentication and authorization for admin features',
  },
  {
    keywords: ['api key in frontend', 'secret in client', 'key in frontend'],
    severity: 'high',
    category: 'api',
    title: 'API Keys Exposed in Frontend',
    description: 'Client-side secrets can be extracted and misused',
    mitigation: 'Use backend proxy for API calls, never expose secrets in frontend',
  },
  {
    keywords: ['no rate limit', 'unlimited request', 'no throttling'],
    severity: 'medium',
    category: 'api',
    title: 'Missing Rate Limiting',
    description: 'APIs without rate limiting are vulnerable to abuse and DoS attacks',
    mitigation: 'Implement rate limiting per IP/user with appropriate thresholds',
  },
  {
    keywords: ['sql concatenation', 'string query', 'dynamic sql'],
    severity: 'critical',
    category: 'data',
    title: 'SQL Injection Risk',
    description: 'Building SQL queries with string concatenation enables injection attacks',
    mitigation: 'Use parameterized queries or ORM with proper escaping',
  },
  {
    keywords: ['no https', 'http only', 'unencrypted'],
    severity: 'high',
    category: 'infrastructure',
    title: 'Missing HTTPS',
    description: 'Unencrypted traffic exposes data to interception',
    mitigation: 'Enforce HTTPS with valid certificates, use HSTS',
  },
  {
    keywords: ['no csrf', 'csrf disabled', 'cross-site request'],
    severity: 'medium',
    category: 'api',
    title: 'CSRF Protection Missing',
    description: 'Without CSRF protection, attackers can forge requests on behalf of users',
    mitigation: 'Implement CSRF tokens for state-changing operations',
  },
];

// Scalability concern patterns
const SCALABILITY_CONCERNS: {
  keywords: string[];
  concern: string;
  recommendation: string;
}[] = [
  {
    keywords: ['sqlite', 'sqlite3'],
    concern: 'SQLite is not suitable for high-concurrency production workloads',
    recommendation: 'Use PostgreSQL or MySQL for production environments',
  },
  {
    keywords: ['single server', 'one server', 'no load balancer'],
    concern: 'Single server deployment creates a single point of failure',
    recommendation: 'Implement load balancing and horizontal scaling',
  },
  {
    keywords: ['session in memory', 'memory session', 'in-memory session'],
    concern: 'In-memory sessions do not scale across multiple servers',
    recommendation: 'Use Redis or database-backed sessions',
  },
  {
    keywords: ['no index', 'no database index', 'unindexed'],
    concern: 'Missing database indexes cause slow queries at scale',
    recommendation: 'Add indexes for frequently queried columns',
  },
  {
    keywords: ['synchronous file', 'sync processing', 'blocking operation'],
    concern: 'Synchronous file processing blocks request handling',
    recommendation: 'Use async processing or background workers for heavy operations',
  },
  {
    keywords: ['no cdn', 'static assets local', 'no content delivery'],
    concern: 'Serving static assets without CDN increases latency',
    recommendation: 'Use CDN for static assets and media files',
  },
  {
    keywords: ['no cache', 'no caching', 'cache disabled'],
    concern: 'Missing caching increases database load and response times',
    recommendation: 'Implement Redis or Memcached for caching hot data',
  },
];

// Tech stack recommendations
const TECH_RECOMMENDATIONS: {
  tech: string;
  category: 'backend' | 'frontend' | 'mobile' | 'infrastructure' | 'tooling';
  flags: string[];
  recommendation: string;
  reason: string;
}[] = [
  {
    tech: 'php',
    category: 'backend',
    flags: ['no framework', 'raw php'],
    recommendation: 'Laravel or Symfony',
    reason: 'Provides security features, routing, ORM, and modern PHP practices',
  },
  {
    tech: 'mysql',
    category: 'infrastructure',
    flags: ['raw queries'],
    recommendation: 'Use ORM like SQLAlchemy, Django ORM, or Prisma',
    reason: 'Prevents SQL injection and provides type safety',
  },
];

/**
 * Review project architecture for patterns, scalability, security, and testability
 */
export async function reviewArchitecture(
  params: ReviewArchitectureParams
): Promise<ArchitectureReview> {
  // Load content from files or use provided content
  let planContent = params.plan || '';
  let requirementsContent = params.requirements || '';

  if (params.planPath) {
    planContent = await fs.readFile(params.planPath, 'utf-8');
  }

  if (params.requirementsPath) {
    requirementsContent = await fs.readFile(params.requirementsPath, 'utf-8');
  }

  const content = `${planContent}\n${requirementsContent}`.toLowerCase();

  // Handle empty content
  if (!content.trim()) {
    return createEmptyReview();
  }

  const focus = params.focus || 'all';

  // Analyze patterns
  const recognizedPatterns = detectPatterns(content);
  const antiPatterns = detectAntiPatterns(content);
  const recommendedPatterns = generatePatternRecommendations(content, recognizedPatterns);

  // Analyze tech stack
  const techStack = analyzeTechStack(content);

  // Analyze scalability
  const scalability = analyzeScalability(content);

  // Analyze security
  const security = analyzeSecurity(content);

  // Analyze testability
  const testability = analyzeTestability(content, antiPatterns);

  // Calculate overall score
  const overall = calculateOverallScore(
    recognizedPatterns,
    antiPatterns,
    techStack,
    scalability,
    security,
    testability,
    focus
  );

  return {
    overall,
    patterns: {
      recognized: recognizedPatterns,
      recommended: recommendedPatterns,
      antiPatterns,
    },
    techStack,
    scalability,
    security,
    testability,
  };
}

/**
 * Create empty review for missing content
 */
function createEmptyReview(): ArchitectureReview {
  return {
    overall: {
      score: 0,
      strengths: [],
      concerns: ['No plan or requirements content provided'],
    },
    patterns: {
      recognized: [],
      recommended: [],
      antiPatterns: [],
    },
    techStack: {
      appropriate: false,
      recommendations: [],
    },
    scalability: {
      score: 0,
      concerns: [],
      recommendations: [],
    },
    security: {
      score: 0,
      vulnerabilities: [],
      recommendations: [],
    },
    testability: {
      score: 0,
      concerns: [],
      recommendations: [],
    },
  };
}

/**
 * Detect recognized patterns in content
 */
function detectPatterns(content: string): RecognizedPattern[] {
  const patterns: RecognizedPattern[] = [];

  for (const pattern of RECOGNIZED_PATTERNS) {
    const found = pattern.keywords.some((kw) => content.includes(kw.toLowerCase()));
    if (found) {
      patterns.push({
        name: pattern.name,
        category: pattern.category,
        description: `Detected ${pattern.name} pattern in the architecture`,
        benefits: pattern.benefits,
        location: 'Architecture section',
      });
    }
  }

  return patterns;
}

/**
 * Detect anti-patterns in content
 */
function detectAntiPatterns(content: string): AntiPattern[] {
  const antiPatterns: AntiPattern[] = [];

  for (const ap of ANTI_PATTERNS) {
    const found = ap.keywords.some((kw) => content.includes(kw.toLowerCase()));
    if (found) {
      antiPatterns.push({
        name: ap.name,
        category: ap.category,
        description: `Detected ${ap.name} anti-pattern`,
        risks: ap.risks,
        alternative: ap.alternative,
        location: 'Plan content',
      });
    }
  }

  return antiPatterns;
}

/**
 * Generate pattern recommendations based on content
 */
function generatePatternRecommendations(
  content: string,
  recognized: RecognizedPattern[]
): RecommendedPattern[] {
  const recommendations: RecommendedPattern[] = [];
  const recognizedNames = recognized.map((p) => p.name);

  // Recommend caching if not present
  if (!recognizedNames.includes('Caching Strategy') && content.includes('database')) {
    recommendations.push({
      name: 'Caching Strategy',
      category: 'data',
      reason: 'Database-heavy applications benefit from caching',
      benefits: ['Improved performance', 'Reduced database load', 'Lower latency'],
      tradeoffs: ['Cache invalidation complexity', 'Additional infrastructure'],
      effort: 'medium',
    });
  }

  // Recommend message queue for async operations
  if (!recognizedNames.includes('Message Queue') &&
      (content.includes('email') || content.includes('notification') || content.includes('background'))) {
    recommendations.push({
      name: 'Message Queue',
      category: 'architecture',
      reason: 'Background tasks like emails/notifications benefit from async processing',
      benefits: ['Non-blocking operations', 'Retry capabilities', 'Scalability'],
      tradeoffs: ['Additional complexity', 'Infrastructure overhead'],
      effort: 'medium',
    });
  }

  // Recommend state management for complex frontend
  if (!recognizedNames.includes('State Management') &&
      (content.includes('vue') || content.includes('react')) &&
      (content.includes('dashboard') || content.includes('complex'))) {
    recommendations.push({
      name: 'State Management',
      category: 'design',
      reason: 'Complex frontends benefit from centralized state management',
      benefits: ['Predictable state', 'DevTools support', 'Easier debugging'],
      tradeoffs: ['Learning curve', 'Boilerplate code'],
      effort: 'low',
    });
  }

  return recommendations;
}

/**
 * Analyze tech stack appropriateness
 */
function analyzeTechStack(content: string): {
  appropriate: boolean;
  recommendations: TechRecommendation[];
} {
  const recommendations: TechRecommendation[] = [];
  let appropriate = true;

  // Check for concerning patterns
  for (const rec of TECH_RECOMMENDATIONS) {
    if (content.includes(rec.tech.toLowerCase())) {
      const hasConcern = rec.flags.some((f) => content.includes(f.toLowerCase()));
      if (hasConcern) {
        appropriate = false;
        recommendations.push({
          current: rec.tech,
          category: rec.category,
          recommendation: rec.recommendation,
          reason: rec.reason,
        });
      }
    }
  }

  // Extract detected tech and add as recommendations for visibility
  const detectedTech: { tech: string; category: TechRecommendation['category'] }[] = [
    { tech: 'django', category: 'backend' },
    { tech: 'fastapi', category: 'backend' },
    { tech: 'flask', category: 'backend' },
    { tech: 'express', category: 'backend' },
    { tech: 'vue', category: 'frontend' },
    { tech: 'react', category: 'frontend' },
    { tech: 'angular', category: 'frontend' },
    { tech: 'postgresql', category: 'infrastructure' },
    { tech: 'mysql', category: 'infrastructure' },
    { tech: 'mongodb', category: 'infrastructure' },
    { tech: 'redis', category: 'infrastructure' },
    { tech: 'docker', category: 'infrastructure' },
  ];

  for (const { tech, category } of detectedTech) {
    if (content.includes(tech)) {
      // Only add if not already in recommendations
      if (!recommendations.some((r) => r.current.toLowerCase() === tech)) {
        recommendations.push({
          current: tech.charAt(0).toUpperCase() + tech.slice(1),
          category,
          reason: 'Detected in tech stack',
        });
      }
    }
  }

  // If php without framework, mark inappropriate
  if (content.includes('php') && content.includes('no framework')) {
    appropriate = false;
  }

  return { appropriate, recommendations };
}

/**
 * Analyze scalability concerns
 */
function analyzeScalability(content: string): {
  score: number;
  concerns: string[];
  recommendations: string[];
} {
  const concerns: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  for (const sc of SCALABILITY_CONCERNS) {
    const found = sc.keywords.some((kw) => content.includes(kw.toLowerCase()));
    if (found) {
      concerns.push(sc.concern);
      recommendations.push(sc.recommendation);
      score -= 15;
    }
  }

  // Bonus for good practices
  if (content.includes('redis') || content.includes('cache')) {
    score += 5;
  }
  if (content.includes('load balancer') || content.includes('horizontal scaling')) {
    score += 5;
  }
  if (content.includes('cdn')) {
    score += 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    concerns,
    recommendations,
  };
}

/**
 * Analyze security concerns
 */
function analyzeSecurity(content: string): {
  score: number;
  vulnerabilities: SecurityConcern[];
  recommendations: string[];
} {
  const vulnerabilities: SecurityConcern[] = [];
  const recommendations: string[] = [];
  let score = 100;

  for (const vuln of SECURITY_VULNERABILITIES) {
    const found = vuln.keywords.some((kw) => content.includes(kw.toLowerCase()));
    if (found) {
      vulnerabilities.push({
        severity: vuln.severity,
        category: vuln.category,
        title: vuln.title,
        description: vuln.description,
        mitigation: vuln.mitigation,
      });
      recommendations.push(vuln.mitigation);

      // Deduct score based on severity
      switch (vuln.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    }
  }

  // Bonus for good security practices
  if (content.includes('https') || content.includes('ssl') || content.includes('tls')) {
    score += 5;
  }
  if (content.includes('bcrypt') || content.includes('argon2') || content.includes('password hash')) {
    score += 5;
  }
  if (content.includes('jwt') || content.includes('oauth')) {
    score += 5;
  }
  if (content.includes('rate limit') || content.includes('throttle')) {
    score += 5;
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    vulnerabilities,
    recommendations,
  };
}

/**
 * Analyze testability
 */
function analyzeTestability(
  content: string,
  antiPatterns: AntiPattern[]
): {
  score: number;
  concerns: string[];
  recommendations: string[];
} {
  const concerns: string[] = [];
  const recommendations: string[] = [];
  let score = 80; // Start at 80, adjust based on findings

  // Check for anti-patterns that hurt testability
  const testabilityAPs = antiPatterns.filter((ap) =>
    ['Fat Controllers', 'Global State', 'Monolithic File Structure'].includes(ap.name)
  );

  for (const ap of testabilityAPs) {
    concerns.push(`${ap.name} pattern makes testing difficult`);
    score -= 15;
  }

  // Check for no testing mention
  if (content.includes('no test') || content.includes('skip test')) {
    concerns.push('Testing explicitly excluded or skipped');
    score -= 30;
  }

  // Bonus for good testing practices
  if (content.includes('tdd') || content.includes('test-driven') || content.includes('test driven')) {
    score += 15;
    recommendations.push('TDD approach detected - maintain test-first development');
  }

  if (content.includes('unit test') || content.includes('integration test')) {
    score += 10;
  }

  if (content.includes('coverage') || content.includes('code coverage')) {
    score += 5;
  }

  // Add general recommendations
  if (score < 70) {
    recommendations.push('Implement unit tests for business logic');
    recommendations.push('Add integration tests for API endpoints');
    recommendations.push('Consider E2E tests for critical user flows');
  }

  if (!content.includes('mock') && !content.includes('stub')) {
    recommendations.push('Use mocking for external dependencies');
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    concerns,
    recommendations,
  };
}

/**
 * Calculate overall architecture score
 */
function calculateOverallScore(
  patterns: RecognizedPattern[],
  antiPatterns: AntiPattern[],
  techStack: { appropriate: boolean; recommendations: TechRecommendation[] },
  scalability: { score: number; concerns: string[]; recommendations: string[] },
  security: { score: number; vulnerabilities: SecurityConcern[]; recommendations: string[] },
  testability: { score: number; concerns: string[]; recommendations: string[] },
  _focus: string
): {
  score: number;
  strengths: string[];
  concerns: string[];
} {
  const strengths: string[] = [];
  const concerns: string[] = [];

  // Base score from subscores
  let score = (scalability.score + security.score + testability.score) / 3;

  // Adjust for patterns
  score += patterns.length * 3; // +3 per recognized pattern
  score -= antiPatterns.length * 10; // -10 per anti-pattern

  // Tech stack adjustment
  if (!techStack.appropriate) {
    score -= 15;
    concerns.push('Tech stack has concerning choices');
  }

  // Generate strengths
  if (patterns.length > 0) {
    strengths.push(`Recognized ${patterns.length} good architectural pattern(s)`);
  }

  if (scalability.score >= 80) {
    strengths.push('Good scalability considerations');
  }

  if (security.score >= 80) {
    strengths.push('Security best practices followed');
  }

  if (testability.score >= 80) {
    strengths.push('Architecture supports testability');
  }

  if (techStack.appropriate) {
    strengths.push('Appropriate tech stack choices');
  }

  // Generate concerns
  if (antiPatterns.length > 0) {
    concerns.push(`Detected ${antiPatterns.length} anti-pattern(s)`);
  }

  if (scalability.score < 60) {
    concerns.push('Scalability concerns need attention');
  }

  if (security.score < 60) {
    concerns.push('Critical security issues detected');
  }

  if (testability.score < 60) {
    concerns.push('Architecture may be difficult to test');
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    strengths,
    concerns,
  };
}
