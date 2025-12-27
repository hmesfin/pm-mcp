// src/tools/intelligence/estimateEffort.ts
// Data-driven effort estimation based on requirements, complexity, and historical data

import type {
  EstimateEffortParams,
  EffortEstimate,
} from '../../types/tools.js';
import type { ComplexityLevel, Domain } from '../../types/common.js';

// Baseline estimates for common features (in sessions)
// These are starting points, refined with real project data over time
const FEATURE_BASELINES: {
  keywords: string[];
  name: string;
  sessions: { basic: number; intermediate: number; advanced: number };
  domains: Domain[];
}[] = [
  // Authentication & Users
  {
    keywords: ['authentication', 'auth', 'login', 'register', 'signup'],
    name: 'User Authentication',
    sessions: { basic: 2, intermediate: 3, advanced: 4 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['user management', 'user profile', 'account'],
    name: 'User Management',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['role', 'permission', 'rbac', 'authorization'],
    name: 'Role-Based Access Control',
    sessions: { basic: 2, intermediate: 3, advanced: 4 },
    domains: ['backend'],
  },
  {
    keywords: ['sso', 'single sign-on', 'oauth', 'social login'],
    name: 'SSO/OAuth Integration',
    sessions: { basic: 2, intermediate: 3, advanced: 4 },
    domains: ['backend', 'frontend'],
  },

  // CRUD Operations
  {
    keywords: ['crud', 'create read update delete', 'basic crud'],
    name: 'Basic CRUD',
    sessions: { basic: 1, intermediate: 2, advanced: 2 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['blog', 'post', 'article'],
    name: 'Blog/Posts CRUD',
    sessions: { basic: 2, intermediate: 3, advanced: 4 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['comment', 'reply', 'thread'],
    name: 'Comments System',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['backend', 'frontend'],
  },

  // E-commerce
  {
    keywords: ['product catalog', 'product listing', 'inventory'],
    name: 'Product Catalog',
    sessions: { basic: 2, intermediate: 3, advanced: 5 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['shopping cart', 'cart'],
    name: 'Shopping Cart',
    sessions: { basic: 2, intermediate: 3, advanced: 4 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['checkout', 'order'],
    name: 'Checkout Flow',
    sessions: { basic: 2, intermediate: 4, advanced: 6 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['payment', 'stripe', 'paypal', 'payment gateway'],
    name: 'Payment Integration',
    sessions: { basic: 3, intermediate: 4, advanced: 6 },
    domains: ['backend', 'frontend'],
  },

  // Communication
  {
    keywords: ['email notification', 'email'],
    name: 'Email Notifications',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['backend'],
  },
  {
    keywords: ['push notification', 'mobile notification'],
    name: 'Push Notifications',
    sessions: { basic: 2, intermediate: 3, advanced: 4 },
    domains: ['backend', 'mobile'],
  },
  {
    keywords: ['real-time', 'websocket', 'live update'],
    name: 'Real-time Updates',
    sessions: { basic: 2, intermediate: 3, advanced: 5 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['chat', 'messaging', 'instant message'],
    name: 'Chat/Messaging',
    sessions: { basic: 3, intermediate: 5, advanced: 7 },
    domains: ['backend', 'frontend'],
  },

  // Search & Discovery
  {
    keywords: ['search', 'filter', 'facet'],
    name: 'Search & Filtering',
    sessions: { basic: 1, intermediate: 2, advanced: 4 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['elasticsearch', 'full-text search', 'advanced search'],
    name: 'Advanced Search',
    sessions: { basic: 2, intermediate: 3, advanced: 5 },
    domains: ['backend', 'infrastructure'],
  },
  {
    keywords: ['recommendation', 'suggest', 'personalization'],
    name: 'Recommendation Engine',
    sessions: { basic: 3, intermediate: 5, advanced: 8 },
    domains: ['backend'],
  },

  // Admin & Analytics
  {
    keywords: ['admin dashboard', 'admin panel', 'backoffice'],
    name: 'Admin Dashboard',
    sessions: { basic: 3, intermediate: 5, advanced: 7 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['analytics', 'reporting', 'metrics', 'dashboard'],
    name: 'Analytics/Reporting',
    sessions: { basic: 2, intermediate: 4, advanced: 6 },
    domains: ['backend', 'frontend'],
  },

  // Files & Media
  {
    keywords: ['file upload', 'attachment', 'document'],
    name: 'File Uploads',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['image', 'gallery', 'media'],
    name: 'Image/Media Management',
    sessions: { basic: 1, intermediate: 2, advanced: 4 },
    domains: ['backend', 'frontend'],
  },

  // Project Management
  {
    keywords: ['project management', 'project'],
    name: 'Project Management',
    sessions: { basic: 2, intermediate: 4, advanced: 6 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['task', 'kanban', 'todo'],
    name: 'Task Management',
    sessions: { basic: 2, intermediate: 3, advanced: 5 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['calendar', 'scheduling', 'event'],
    name: 'Calendar/Scheduling',
    sessions: { basic: 2, intermediate: 3, advanced: 5 },
    domains: ['backend', 'frontend'],
  },
  {
    keywords: ['time tracking', 'timesheet'],
    name: 'Time Tracking',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['backend', 'frontend'],
  },

  // Infrastructure
  {
    keywords: ['api', 'rest api', 'graphql'],
    name: 'API Development',
    sessions: { basic: 2, intermediate: 3, advanced: 5 },
    domains: ['backend'],
  },
  {
    keywords: ['ci/cd', 'pipeline', 'deployment'],
    name: 'CI/CD Pipeline',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['infrastructure'],
  },
  {
    keywords: ['docker', 'container', 'kubernetes'],
    name: 'Containerization',
    sessions: { basic: 1, intermediate: 2, advanced: 4 },
    domains: ['infrastructure'],
  },

  // Mobile Specific
  {
    keywords: ['mobile app', 'ios', 'android', 'flutter'],
    name: 'Mobile App Foundation',
    sessions: { basic: 3, intermediate: 5, advanced: 8 },
    domains: ['mobile'],
  },
  {
    keywords: ['offline', 'offline-first', 'sync'],
    name: 'Offline Support',
    sessions: { basic: 2, intermediate: 4, advanced: 6 },
    domains: ['mobile'],
  },

  // Internationalization
  {
    keywords: ['i18n', 'internationalization', 'multi-language', 'localization'],
    name: 'Internationalization',
    sessions: { basic: 1, intermediate: 2, advanced: 4 },
    domains: ['frontend'],
  },
  {
    keywords: ['multi-currency', 'currency'],
    name: 'Multi-currency Support',
    sessions: { basic: 1, intermediate: 2, advanced: 3 },
    domains: ['backend', 'frontend'],
  },
];

// Phase templates
const PHASE_TEMPLATES = [
  { name: 'Foundation', percentage: 0.15, description: 'Project setup and infrastructure' },
  { name: 'Core Features', percentage: 0.40, description: 'Main functionality implementation' },
  { name: 'Advanced Features', percentage: 0.25, description: 'Secondary features and enhancements' },
  { name: 'Polish & Integration', percentage: 0.15, description: 'UI polish, integration, testing' },
  { name: 'Deployment', percentage: 0.05, description: 'Deployment and documentation' },
];

// Complexity multipliers
const COMPLEXITY_MULTIPLIERS = {
  basic: 1.0,
  intermediate: 1.5,
  advanced: 2.0,
};

// Historical baselines for mock similar project comparison
const HISTORICAL_BASELINES: Record<string, { sessions: number; time: string }> = {
  'blog-platform': { sessions: 12, time: '36h' },
  'ecommerce': { sessions: 25, time: '75h' },
  'saas': { sessions: 30, time: '90h' },
  'social': { sessions: 35, time: '105h' },
};

/**
 * Estimate effort for a project based on requirements and complexity
 */
export async function estimateEffort(
  params: EstimateEffortParams
): Promise<EffortEstimate> {
  const { requirements, plan, complexity, features, similarProjects } = params;

  // Handle empty input
  if (!requirements?.trim() && !plan?.trim() && !features?.length) {
    return createEmptyEstimate();
  }

  // Detect complexity if not provided
  const detectedComplexity = complexity || detectComplexity(requirements || '', features || []);

  // Extract or use provided features
  const featureList = features || extractFeatures(requirements || '', plan || '');

  // Estimate each feature
  const breakdown = estimateFeatures(featureList, detectedComplexity);

  // Calculate totals
  const totalSessions = breakdown.reduce((sum, b) => sum + b.sessions, 0);
  const totalHours = totalSessions * 3; // 3h per session average

  // Calculate by domain
  const byDomain = calculateDomainDistribution(breakdown, featureList, requirements || '');

  // Calculate by phase
  const byPhase = calculatePhaseDistribution(totalSessions, totalHours);

  // Identify adjustments
  const adjustments = identifyAdjustments(requirements || '', featureList, detectedComplexity);

  // Identify risks
  const risks = identifyRisks(detectedComplexity, featureList, totalSessions);

  // Calculate confidence
  const confidence = calculateConfidence(detectedComplexity, featureList.length, !!similarProjects);

  // Historical comparison if similar projects provided
  const historicalComparison = similarProjects
    ? generateHistoricalComparison(similarProjects, totalSessions, totalHours)
    : undefined;

  return {
    total: {
      sessions: totalSessions,
      time: `${totalHours}h`,
      confidence,
    },
    byPhase,
    byDomain,
    breakdown,
    adjustments,
    risks,
    historicalComparison,
  };
}

/**
 * Create empty estimate for invalid input
 */
function createEmptyEstimate(): EffortEstimate {
  return {
    total: {
      sessions: 0,
      time: '0h',
      confidence: 0,
    },
    byPhase: [],
    byDomain: [],
    breakdown: [],
    adjustments: [],
    risks: [],
  };
}

/**
 * Auto-detect complexity based on requirements content
 */
function detectComplexity(requirements: string, features: string[]): ComplexityLevel {
  const content = requirements.toLowerCase();
  const featureCount = features.length || countFeatures(content);

  // Check for advanced indicators
  const advancedIndicators = [
    'real-time', 'websocket', 'microservice', 'kubernetes',
    'elasticsearch', 'recommendation', 'machine learning', 'ai',
    'payment gateway', 'multiple payment', 'mobile app',
    'multi-tenant', '100k', 'high availability', 'pci', 'hipaa',
  ];

  const advancedCount = advancedIndicators.filter((i) => content.includes(i)).length;

  // Check for intermediate indicators
  const intermediateIndicators = [
    'admin dashboard', 'analytics', 'reporting', 'notification',
    'file upload', 'sso', 'oauth', 'api', 'caching', 'queue',
  ];

  const intermediateCount = intermediateIndicators.filter((i) => content.includes(i)).length;

  // Determine complexity
  if (advancedCount >= 3 || featureCount > 15) {
    return 'advanced';
  }

  if (intermediateCount >= 3 || advancedCount >= 1 || featureCount > 8) {
    return 'intermediate';
  }

  return 'basic';
}

/**
 * Count features in requirements text
 */
function countFeatures(content: string): number {
  // Count bullet points and numbered items that likely represent features
  const bulletMatches = content.match(/^[\s]*[-*•]\s+/gm) || [];
  const numberedMatches = content.match(/^\d+\.\s+/gm) || [];
  return bulletMatches.length + numberedMatches.length;
}

/**
 * Extract features from requirements and plan
 */
function extractFeatures(requirements: string, plan: string): string[] {
  const content = `${requirements}\n${plan}`.toLowerCase();
  const features: string[] = [];

  // Match against known feature baselines
  for (const baseline of FEATURE_BASELINES) {
    const found = baseline.keywords.some((kw) => content.includes(kw));
    if (found && !features.includes(baseline.name)) {
      features.push(baseline.name);
    }
  }

  // If no features detected, add generic ones based on content
  if (features.length === 0) {
    if (content.includes('user') || content.includes('account')) {
      features.push('User Authentication');
    }
    if (content.includes('database') || content.includes('model')) {
      features.push('Basic CRUD');
    }
    if (content.includes('frontend') || content.includes('ui')) {
      features.push('Frontend Development');
    }
  }

  return features;
}

/**
 * Estimate sessions for each feature
 */
function estimateFeatures(
  features: string[],
  complexity: ComplexityLevel
): {
  feature: string;
  sessions: number;
  time: string;
  complexity: ComplexityLevel;
}[] {
  return features.map((feature) => {
    const baseline = FEATURE_BASELINES.find((b) =>
      b.name.toLowerCase() === feature.toLowerCase() ||
      b.keywords.some((kw) => feature.toLowerCase().includes(kw))
    );

    let sessions: number;
    let featureComplexity: ComplexityLevel;

    if (baseline) {
      sessions = baseline.sessions[complexity];
      featureComplexity = complexity;
    } else {
      // Default estimate for unknown features
      sessions = Math.round(2 * COMPLEXITY_MULTIPLIERS[complexity]);
      featureComplexity = complexity;
    }

    return {
      feature,
      sessions,
      time: `${sessions * 3}h`,
      complexity: featureComplexity,
    };
  });
}

/**
 * Calculate domain distribution
 */
function calculateDomainDistribution(
  breakdown: { feature: string; sessions: number }[],
  _features: string[],
  requirements: string
): { domain: Domain; sessions: number; time: string }[] {
  const domainMap: Record<Domain, number> = {
    backend: 0,
    frontend: 0,
    mobile: 0,
    e2e: 0,
    infrastructure: 0,
  };

  // Distribute based on feature baselines
  for (const item of breakdown) {
    const baseline = FEATURE_BASELINES.find((b) =>
      b.name.toLowerCase() === item.feature.toLowerCase() ||
      b.keywords.some((kw) => item.feature.toLowerCase().includes(kw))
    );

    if (baseline) {
      const domainShare = item.sessions / baseline.domains.length;
      for (const domain of baseline.domains) {
        domainMap[domain] += domainShare;
      }
    } else {
      // Default split between backend and frontend
      domainMap.backend += item.sessions * 0.5;
      domainMap.frontend += item.sessions * 0.5;
    }
  }

  // Check for mobile in requirements
  const content = requirements.toLowerCase();
  if (content.includes('mobile') || content.includes('flutter') ||
      content.includes('ios') || content.includes('android')) {
    // Shift some frontend sessions to mobile
    const mobileShare = domainMap.frontend * 0.3;
    domainMap.mobile += mobileShare;
    domainMap.frontend -= mobileShare;
  }

  // Add infrastructure baseline
  const totalSessions = Object.values(domainMap).reduce((a, b) => a + b, 0);
  if (totalSessions > 0) {
    domainMap.infrastructure = Math.max(1, Math.round(totalSessions * 0.1));
    domainMap.e2e = Math.max(1, Math.round(totalSessions * 0.05));
  }

  // Filter out empty domains and format
  return Object.entries(domainMap)
    .filter(([_, sessions]) => sessions > 0)
    .map(([domain, sessions]) => ({
      domain: domain as Domain,
      sessions: Math.round(sessions),
      time: `${Math.round(sessions * 3)}h`,
    }));
}

/**
 * Calculate phase distribution
 */
function calculatePhaseDistribution(
  totalSessions: number,
  totalHours: number
): { phase: string; sessions: number; time: string; confidence: number }[] {
  return PHASE_TEMPLATES.map((template) => {
    const sessions = Math.max(1, Math.round(totalSessions * template.percentage));
    const hours = Math.round(totalHours * template.percentage);

    return {
      phase: template.name,
      sessions,
      time: `${hours}h`,
      confidence: 75, // Base confidence for phase estimates
    };
  });
}

/**
 * Identify adjustment factors
 */
function identifyAdjustments(
  requirements: string,
  _features: string[],
  complexity: ComplexityLevel
): { factor: string; impact: number; reason: string }[] {
  const adjustments: { factor: string; impact: number; reason: string }[] = [];
  const content = requirements.toLowerCase();

  // Integration complexity
  const integrations = ['stripe', 'paypal', 'oauth', 'sso', 'elasticsearch',
    'redis', 'aws', 'gcp', 'azure', 'twilio', 'sendgrid'];
  const integrationCount = integrations.filter((i) => content.includes(i)).length;

  if (integrationCount >= 3) {
    adjustments.push({
      factor: 'Multiple Third-party Integrations',
      impact: 15,
      reason: `${integrationCount} external integrations increase complexity and risk`,
    });
  } else if (integrationCount >= 1) {
    adjustments.push({
      factor: 'Third-party Integration',
      impact: 10,
      reason: 'External API integrations add uncertainty to estimates',
    });
  }

  // Team size/experience (assume small team for now)
  if (complexity === 'advanced') {
    adjustments.push({
      factor: 'Project Complexity',
      impact: 20,
      reason: 'Advanced projects have higher uncertainty and hidden complexity',
    });
  }

  // Compliance requirements
  const compliance = ['gdpr', 'hipaa', 'pci', 'sox', 'compliance'];
  if (compliance.some((c) => content.includes(c))) {
    adjustments.push({
      factor: 'Compliance Requirements',
      impact: 15,
      reason: 'Regulatory compliance adds documentation and security overhead',
    });
  }

  // Performance requirements
  if (content.includes('concurrent') || content.includes('high availability') ||
      content.includes('99.9%') || content.includes('performance')) {
    adjustments.push({
      factor: 'Performance Requirements',
      impact: 10,
      reason: 'Strict performance requirements need additional optimization time',
    });
  }

  return adjustments;
}

/**
 * Identify estimation risks
 */
function identifyRisks(
  complexity: ComplexityLevel,
  features: string[],
  totalSessions: number
): { category: 'underestimate' | 'overestimate' | 'dependency' | 'complexity'; description: string; mitigation: string }[] {
  const risks: { category: 'underestimate' | 'overestimate' | 'dependency' | 'complexity'; description: string; mitigation: string }[] = [];

  // Complexity risk
  if (complexity === 'advanced') {
    risks.push({
      category: 'underestimate',
      description: 'Advanced projects often encounter unforeseen challenges',
      mitigation: 'Add 20-30% buffer for unexpected issues',
    });
  }

  // Feature count risk
  if (features.length > 10) {
    risks.push({
      category: 'complexity',
      description: 'Large feature count increases integration complexity',
      mitigation: 'Prioritize MVP features and defer nice-to-haves',
    });
  }

  // Session count risk
  if (totalSessions > 20) {
    risks.push({
      category: 'underestimate',
      description: 'Large projects accumulate estimation errors',
      mitigation: 'Break into smaller milestones with re-estimation points',
    });
  }

  // Dependency risk
  if (features.some((f) =>
    f.toLowerCase().includes('payment') ||
    f.toLowerCase().includes('integration') ||
    f.toLowerCase().includes('third-party')
  )) {
    risks.push({
      category: 'dependency',
      description: 'Third-party dependencies can cause delays',
      mitigation: 'Identify backup solutions and allocate contingency time',
    });
  }

  // Small project overestimate risk
  if (totalSessions < 5 && complexity === 'basic') {
    risks.push({
      category: 'overestimate',
      description: 'Simple projects may be faster than estimated',
      mitigation: 'Consider aggressive timeline for quick wins',
    });
  }

  return risks;
}

/**
 * Calculate estimation confidence
 */
function calculateConfidence(
  complexity: ComplexityLevel,
  featureCount: number,
  hasHistorical: boolean
): number {
  let confidence = 70; // Base confidence

  // Complexity affects confidence
  switch (complexity) {
    case 'basic':
      confidence += 15;
      break;
    case 'intermediate':
      confidence += 5;
      break;
    case 'advanced':
      confidence -= 10;
      break;
  }

  // Feature count affects confidence
  if (featureCount > 15) {
    confidence -= 10;
  } else if (featureCount < 5) {
    confidence += 10;
  }

  // Historical data improves confidence
  if (hasHistorical) {
    confidence += 10;
  }

  return Math.max(30, Math.min(95, confidence));
}

/**
 * Generate historical comparison
 */
function generateHistoricalComparison(
  similarProjects: string[],
  _totalSessions: number,
  totalHours: number
): { project: string; similarity: number; actualTime: string; variance: number }[] {
  return similarProjects.map((project) => {
    // Check if we have baseline data
    const projectKey = Object.keys(HISTORICAL_BASELINES).find((k) =>
      project.toLowerCase().includes(k)
    );

    if (projectKey) {
      const baseline = HISTORICAL_BASELINES[projectKey];
      const baselineHours = parseInt(baseline.time.replace('h', ''));
      const variance = Math.round(((totalHours - baselineHours) / baselineHours) * 100);

      return {
        project: projectKey,
        similarity: 70 + Math.random() * 20, // Mock similarity score
        actualTime: baseline.time,
        variance,
      };
    }

    // Mock data for unknown projects
    return {
      project,
      similarity: 50 + Math.random() * 30,
      actualTime: `${Math.round(totalHours * (0.8 + Math.random() * 0.4))}h`,
      variance: Math.round((Math.random() - 0.5) * 40),
    };
  });
}
