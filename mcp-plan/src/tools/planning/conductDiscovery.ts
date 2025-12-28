// src/tools/planning/conductDiscovery.ts
/**
 * Interactive AI-driven discovery session to gather project requirements.
 *
 * This tool provides:
 * - Strategic questions based on project type
 * - Assumption challenging
 * - Gap detection
 * - Progressive disclosure (not all questions at once)
 * - Discovery summary generation when complete
 *
 * @module conductDiscovery
 */

import type {
  ConductDiscoveryParams,
  DiscoverySession,
  DiscoveryMessage,
  DiscoveryQuestion,
  DiscoverySummary,
} from '../../types/tools.js';
import type {
  ProjectType,
  ComplexityLevel,
  Challenge,
  Suggestion,
  Risk,
} from '../../types/common.js';

// Questions per project type
const PROJECT_TYPE_QUESTIONS: Record<ProjectType, DiscoveryQuestion[]> = {
  ecommerce: [
    {
      id: 'product-catalog',
      question: 'What type of products will you sell and approximately how many products will you have?',
      type: 'text',
      validation: { required: true },
    },
    {
      id: 'payment-methods',
      question: 'What payment methods do you need to support?',
      type: 'multiselect',
      options: ['Credit/Debit Cards (Stripe)', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer', 'Cryptocurrency'],
    },
    {
      id: 'shipping',
      question: 'What are your shipping requirements?',
      type: 'text',
      validation: { required: true },
    },
    {
      id: 'inventory',
      question: 'Do you need inventory management with stock tracking?',
      type: 'boolean',
    },
    {
      id: 'multi-vendor',
      question: 'Will this be a single-vendor or multi-vendor marketplace?',
      type: 'choice',
      options: ['Single vendor', 'Multi-vendor marketplace'],
    },
    {
      id: 'promotions',
      question: 'What promotional features do you need?',
      type: 'multiselect',
      options: ['Discount codes', 'Flash sales', 'Bundle deals', 'Loyalty program', 'Referral system'],
    },
  ],
  saas: [
    {
      id: 'subscription-model',
      question: 'What subscription/pricing model will you use?',
      type: 'choice',
      options: ['Free tier + paid plans', 'Paid only', 'Usage-based', 'Per-seat pricing', 'Freemium'],
    },
    {
      id: 'multi-tenant',
      question: 'Do you need multi-tenant architecture with data isolation?',
      type: 'boolean',
    },
    {
      id: 'api-access',
      question: 'Will you provide API access to customers?',
      type: 'boolean',
    },
    {
      id: 'billing',
      question: 'What billing provider will you use?',
      type: 'choice',
      options: ['Stripe Billing', 'Paddle', 'Chargebee', 'Custom solution'],
    },
    {
      id: 'collaboration',
      question: 'Do you need team/collaboration features?',
      type: 'boolean',
    },
    {
      id: 'integrations',
      question: 'What third-party integrations are essential?',
      type: 'text',
    },
  ],
  blog: [
    {
      id: 'content-types',
      question: 'What types of content will your blog support?',
      type: 'multiselect',
      options: ['Text posts', 'Images', 'Videos', 'Podcasts', 'Code snippets'],
    },
    {
      id: 'authors',
      question: 'Will you have multiple authors or a single author?',
      type: 'choice',
      options: ['Single author', 'Multiple authors with profiles'],
    },
    {
      id: 'comments',
      question: 'Do you need a commenting system?',
      type: 'boolean',
    },
    {
      id: 'categories-tags',
      question: 'How will content be organized?',
      type: 'multiselect',
      options: ['Categories', 'Tags', 'Series/Collections', 'Featured posts'],
    },
    {
      id: 'monetization',
      question: 'Will you monetize the blog?',
      type: 'multiselect',
      options: ['Ads', 'Sponsorships', 'Paid subscriptions', 'None'],
    },
  ],
  social: [
    {
      id: 'connection-type',
      question: 'What type of social connections will users have?',
      type: 'choice',
      options: ['Follow/Following (asymmetric)', 'Friends (symmetric)', 'Both'],
    },
    {
      id: 'content-sharing',
      question: 'What can users share?',
      type: 'multiselect',
      options: ['Text posts', 'Images', 'Videos', 'Stories', 'Live streams'],
    },
    {
      id: 'messaging',
      question: 'Do you need direct messaging between users?',
      type: 'boolean',
    },
    {
      id: 'privacy-controls',
      question: 'What privacy controls do users need?',
      type: 'multiselect',
      options: ['Public/private profiles', 'Block users', 'Content visibility settings', 'Data export'],
    },
    {
      id: 'notifications',
      question: 'What notification channels do you need?',
      type: 'multiselect',
      options: ['In-app', 'Email', 'Push notifications', 'SMS'],
    },
  ],
  projectmanagement: [
    {
      id: 'project-structure',
      question: 'How will projects be structured?',
      type: 'multiselect',
      options: ['Workspaces', 'Projects', 'Tasks', 'Subtasks', 'Milestones'],
    },
    {
      id: 'views',
      question: 'What views do you need for tasks?',
      type: 'multiselect',
      options: ['List view', 'Kanban board', 'Calendar', 'Gantt chart', 'Timeline'],
    },
    {
      id: 'team-features',
      question: 'What team collaboration features are needed?',
      type: 'multiselect',
      options: ['Task assignment', 'Comments', 'Mentions', 'File attachments', 'Time tracking'],
    },
    {
      id: 'permissions',
      question: 'What permission levels do you need?',
      type: 'multiselect',
      options: ['Owner', 'Admin', 'Member', 'Guest/View-only', 'Custom roles'],
    },
  ],
  custom: [
    {
      id: 'project-name',
      question: 'What is the name of your project?',
      type: 'text',
      validation: { required: true },
    },
    {
      id: 'project-description',
      question: 'Briefly describe what your project will do.',
      type: 'text',
      validation: { required: true },
    },
    {
      id: 'target-users',
      question: 'Who are the primary users of this application?',
      type: 'text',
    },
    {
      id: 'core-features',
      question: 'What are the 3-5 most important features?',
      type: 'text',
      validation: { required: true },
    },
  ],
};

// Common questions asked regardless of project type
const COMMON_QUESTIONS: DiscoveryQuestion[] = [
  {
    id: 'project-name',
    question: 'What is the name of your project?',
    type: 'text',
    validation: { required: true },
  },
  {
    id: 'auth-method',
    question: 'What authentication methods do you need?',
    type: 'multiselect',
    options: ['Email/Password', 'Google OAuth', 'GitHub OAuth', 'Apple Sign-In', 'Phone/SMS', 'SSO/SAML'],
  },
  {
    id: 'mobile-requirements',
    question: 'What are your mobile requirements?',
    type: 'choice',
    options: ['Responsive web only', 'Native mobile apps (iOS/Android)', 'Progressive Web App (PWA)', 'Mobile-first design'],
  },
  {
    id: 'admin-features',
    question: 'What admin/back-office features do you need?',
    type: 'text',
  },
  {
    id: 'third-party-integrations',
    question: 'What third-party services or APIs will you integrate with?',
    type: 'text',
  },
  {
    id: 'data-sensitivity',
    question: 'What sensitive data will your application handle?',
    type: 'multiselect',
    options: ['Personal information (PII)', 'Payment data', 'Health data (HIPAA)', 'None/minimal'],
  },
];

// Keywords to detect if a topic has been covered
const TOPIC_KEYWORDS: Record<string, string[]> = {
  'product-catalog': ['product', 'catalog', 'inventory', 'sku', 'item'],
  'payment-methods': ['payment', 'stripe', 'paypal', 'credit card', 'checkout'],
  'shipping': ['shipping', 'delivery', 'carrier', 'logistics'],
  'subscription-model': ['subscription', 'pricing', 'plan', 'tier', 'free tier'],
  'multi-tenant': ['tenant', 'isolation', 'organization'],
  'auth-method': ['authentication', 'login', 'oauth', 'sso', 'password'],
  'mobile-requirements': ['mobile', 'app', 'native', 'responsive', 'pwa'],
  'comments': ['comment', 'reply', 'thread'],
  'messaging': ['message', 'chat', 'dm', 'direct message'],
};

// Triggers for challenges based on conversation content
const CHALLENGE_TRIGGERS: Array<{
  keywords: string[];
  challenge: Challenge;
}> = [
  {
    keywords: ['real-time', 'realtime', 'live', 'websocket', 'collaboration'],
    challenge: {
      severity: 'medium',
      category: 'technical',
      title: 'Real-time infrastructure required',
      description: 'Real-time features require WebSocket infrastructure, which adds complexity for scaling and state management.',
      recommendation: 'Consider using managed services like Pusher, Ably, or Firebase for real-time features to reduce infrastructure complexity.',
    },
  },
  {
    keywords: ['million', 'thousands', 'concurrent', 'scale', 'high traffic'],
    challenge: {
      severity: 'high',
      category: 'architecture',
      title: 'High scalability requirements',
      description: 'Large-scale user expectations require careful architecture planning from the start.',
      recommendation: 'Plan for horizontal scaling, caching strategies, and consider microservices architecture for critical paths.',
    },
  },
  {
    keywords: ['multiple warehouse', 'multi-warehouse', 'distributed inventory'],
    challenge: {
      severity: 'medium',
      category: 'technical',
      title: 'Distributed inventory management',
      description: 'Multi-warehouse inventory requires complex sync logic and conflict resolution.',
      recommendation: 'Implement event-driven architecture with eventual consistency for inventory updates.',
    },
  },
  {
    keywords: ['google docs', 'figma', 'collaborative editing', 'simultaneous'],
    challenge: {
      severity: 'high',
      category: 'technical',
      title: 'Real-time collaborative editing',
      description: 'Simultaneous document editing requires CRDT or OT algorithms, which are complex to implement.',
      recommendation: 'Consider using existing solutions like Yjs, Automerge, or Liveblocks instead of building from scratch.',
    },
  },
];

// Risk triggers based on conversation content
const RISK_TRIGGERS: Array<{
  keywords: string[];
  risk: Risk;
}> = [
  {
    keywords: ['credit card', 'card data', 'payment data', 'store card'],
    risk: {
      severity: 'critical',
      category: 'compliance',
      title: 'PCI-DSS compliance required',
      description: 'Handling credit card data directly requires PCI-DSS compliance, which is costly and complex.',
      mitigation: 'Use tokenization via Stripe or similar providers to avoid handling raw card data.',
      probability: 'high',
      impact: 'high',
    },
  },
  {
    keywords: ['health data', 'medical', 'patient', 'hipaa'],
    risk: {
      severity: 'critical',
      category: 'compliance',
      title: 'HIPAA compliance required',
      description: 'Handling health data requires HIPAA compliance with strict security and audit requirements.',
      mitigation: 'Use HIPAA-compliant infrastructure and implement required administrative, physical, and technical safeguards.',
      probability: 'high',
      impact: 'high',
    },
  },
  {
    keywords: ['gdpr', 'european', 'eu users', 'europe'],
    risk: {
      severity: 'high',
      category: 'compliance',
      title: 'GDPR compliance required',
      description: 'Serving EU users requires GDPR compliance including data portability and right to be forgotten.',
      mitigation: 'Implement consent management, data export, and deletion workflows from the start.',
      probability: 'medium',
      impact: 'high',
    },
  },
  {
    keywords: ['custom cms', 'build from scratch', 'no framework'],
    risk: {
      severity: 'medium',
      category: 'timeline',
      title: 'Custom solution increases timeline',
      description: 'Building custom solutions instead of using established frameworks increases development time significantly.',
      mitigation: 'Evaluate existing solutions before building custom. Use battle-tested frameworks where possible.',
      probability: 'high',
      impact: 'medium',
    },
  },
];

/**
 * Conduct an interactive discovery session to gather project requirements.
 *
 * @param params - Discovery parameters
 * @param params.projectType - Optional project type
 * @param params.conversationHistory - Previous conversation messages
 * @returns DiscoverySession with questions, challenges, risks, and optionally summary
 */
export async function conductDiscovery(
  params: ConductDiscoveryParams
): Promise<DiscoverySession> {
  const { conversationHistory = [] } = params;

  // Infer project type from conversation if not provided
  const projectType = params.projectType || inferProjectType(conversationHistory);

  // Get all conversation content for analysis
  const conversationText = conversationHistory
    .map(m => m.content.toLowerCase())
    .join(' ');

  // Determine which questions have been answered
  const coveredTopics = detectCoveredTopics(conversationText);

  // Get relevant questions for this project type
  // Project-type-specific questions come first for relevance
  const allQuestions = [
    ...(PROJECT_TYPE_QUESTIONS[projectType] || []),
    ...COMMON_QUESTIONS,
  ];

  // Filter to unanswered questions
  const unansweredQuestions = allQuestions.filter(
    q => !coveredTopics.has(q.id)
  );

  // Progressive disclosure: limit questions per round
  const maxQuestionsPerRound = 5;
  const questionsToShow = unansweredQuestions.slice(0, maxQuestionsPerRound);

  // Detect challenges from conversation
  const challenges = detectChallenges(conversationText);

  // Detect risks from conversation
  const risks = detectRisks(conversationText);

  // Generate suggestions based on project type
  const suggestions = generateSuggestions(projectType, conversationText);

  // Determine if discovery is complete
  // Count user responses (every other message starting from index 1)
  const userResponses = conversationHistory.filter(m => m.role === 'user').length;
  const minAnswersForComplete = 6;
  // Complete if we have enough answers OR very few questions left
  const isComplete = userResponses >= minAnswersForComplete ||
                     (conversationHistory.length >= 8 && unansweredQuestions.length <= 3);

  // Generate summary if complete
  const summary = isComplete
    ? generateSummary(projectType, conversationHistory, coveredTopics)
    : undefined;

  return {
    projectType,
    questions: questionsToShow,
    challenges,
    suggestions,
    risks,
    nextQuestion: questionsToShow[0],
    isComplete,
    summary,
  };
}

/**
 * Infer project type from conversation history
 */
function inferProjectType(history: DiscoveryMessage[]): ProjectType {
  const text = history.map(m => m.content.toLowerCase()).join(' ');

  if (text.includes('e-commerce') || text.includes('ecommerce') ||
      text.includes('shop') || text.includes('store') ||
      text.includes('products') || text.includes('cart')) {
    return 'ecommerce';
  }

  if (text.includes('saas') || text.includes('subscription') ||
      text.includes('multi-tenant') || text.includes('billing')) {
    return 'saas';
  }

  if (text.includes('blog') || text.includes('posts') ||
      text.includes('articles') || text.includes('content management')) {
    return 'blog';
  }

  if (text.includes('social') || text.includes('friends') ||
      text.includes('followers') || text.includes('networking')) {
    return 'social';
  }

  if (text.includes('project management') || text.includes('tasks') ||
      text.includes('kanban') || text.includes('sprint')) {
    return 'projectmanagement';
  }

  return 'custom';
}

/**
 * Detect which topics have been covered in conversation
 */
function detectCoveredTopics(text: string): Set<string> {
  const covered = new Set<string>();

  for (const [topicId, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      covered.add(topicId);
    }
  }

  return covered;
}

/**
 * Detect challenges based on conversation content
 */
function detectChallenges(text: string): Challenge[] {
  const challenges: Challenge[] = [];

  for (const trigger of CHALLENGE_TRIGGERS) {
    if (trigger.keywords.some(kw => text.includes(kw))) {
      challenges.push(trigger.challenge);
    }
  }

  return challenges;
}

/**
 * Detect risks based on conversation content
 */
function detectRisks(text: string): Risk[] {
  const risks: Risk[] = [];

  for (const trigger of RISK_TRIGGERS) {
    if (trigger.keywords.some(kw => text.includes(kw))) {
      risks.push(trigger.risk);
    }
  }

  return risks;
}

/**
 * Generate suggestions based on project type
 */
function generateSuggestions(projectType: ProjectType, _conversationText: string): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Project-type specific suggestions
  switch (projectType) {
    case 'ecommerce':
      suggestions.push({
        category: 'feature',
        title: 'Consider implementing wishlist',
        description: 'Wishlists increase user engagement and conversion rates.',
        benefit: 'Higher conversion rates and customer retention',
        effort: 'low',
      });
      suggestions.push({
        category: 'architecture',
        title: 'Plan for inventory sync',
        description: 'Implement event-driven inventory updates to prevent overselling.',
        benefit: 'Accurate stock levels and better customer experience',
        effort: 'medium',
      });
      break;

    case 'saas':
      suggestions.push({
        category: 'architecture',
        title: 'Implement feature flags',
        description: 'Use feature flags for gradual rollouts and plan-based features.',
        benefit: 'Safer deployments and flexible pricing tiers',
        effort: 'low',
      });
      suggestions.push({
        category: 'tooling',
        title: 'Set up usage analytics',
        description: 'Track feature usage to inform product decisions.',
        benefit: 'Data-driven product development',
        effort: 'medium',
      });
      break;

    case 'blog':
      suggestions.push({
        category: 'feature',
        title: 'Implement SEO optimization',
        description: 'Add meta tags, structured data, and sitemap generation.',
        benefit: 'Better search engine visibility',
        effort: 'medium',
      });
      suggestions.push({
        category: 'workflow',
        title: 'Add draft/publish workflow',
        description: 'Implement a content workflow with drafts, scheduling, and publishing.',
        benefit: 'Better content management experience',
        effort: 'low',
      });
      break;

    case 'social':
      suggestions.push({
        category: 'architecture',
        title: 'Plan for feed scalability',
        description: 'Consider fan-out on write vs. fan-out on read for the feed.',
        benefit: 'Scalable feed performance',
        effort: 'high',
      });
      suggestions.push({
        category: 'feature',
        title: 'Implement content moderation',
        description: 'Add reporting and moderation tools from the start.',
        benefit: 'Safer community and regulatory compliance',
        effort: 'medium',
      });
      break;

    case 'projectmanagement':
      suggestions.push({
        category: 'feature',
        title: 'Add keyboard shortcuts',
        description: 'Power users expect efficient keyboard navigation.',
        benefit: 'Better user productivity',
        effort: 'medium',
      });
      suggestions.push({
        category: 'architecture',
        title: 'Implement activity logging',
        description: 'Track all changes for audit trail and activity feeds.',
        benefit: 'Transparency and accountability',
        effort: 'medium',
      });
      break;

    case 'custom':
      suggestions.push({
        category: 'workflow',
        title: 'Define MVP scope clearly',
        description: 'Identify the minimum feature set for initial launch.',
        benefit: 'Faster time to market and learning',
        effort: 'low',
      });
      break;
  }

  return suggestions;
}

/**
 * Generate discovery summary from conversation
 */
function generateSummary(
  projectType: ProjectType,
  history: DiscoveryMessage[],
  _coveredTopics: Set<string>
): DiscoverySummary {
  const allText = history.map(m => m.content).join(' ');
  const allTextLower = allText.toLowerCase();

  // Extract project name (look for explicit mentions or capitalize first noun)
  const projectName = extractProjectName(history);

  // Extract features mentioned
  const features = extractFeatures(allTextLower, projectType);

  // Extract entities (data models)
  const entities = extractEntities(allTextLower, projectType);

  // Extract integrations
  const integrations = extractIntegrations(allTextLower);

  // Determine mobile requirements
  const mobileRequirements = determineMobileRequirements(allTextLower);

  // Estimate complexity
  const complexity = estimateComplexity(features.length, entities.length, integrations.length);

  // Estimate sessions
  const estimatedSessions = estimateSessions(complexity, features.length);

  return {
    projectName,
    projectType,
    complexity,
    features,
    entities,
    integrations,
    mobileRequirements,
    estimatedSessions,
    estimatedTime: `${Math.ceil(estimatedSessions * 2.5)}h - ${Math.ceil(estimatedSessions * 4)}h`,
  };
}

/**
 * Extract project name from conversation
 */
function extractProjectName(history: DiscoveryMessage[]): string {
  // Look for explicit name mentions
  for (const msg of history) {
    if (msg.role === 'user') {
      const nameMatch = msg.content.match(/(?:called|named|name is)\s+["']?(\w+)["']?/i);
      if (nameMatch) {
        return nameMatch[1];
      }
    }
  }

  // Look for capitalized words after common patterns
  for (const msg of history) {
    if (msg.role === 'user') {
      const projectMatch = msg.content.match(/^([A-Z][a-zA-Z]+)(?:\s|$)/);
      if (projectMatch) {
        return projectMatch[1];
      }
    }
  }

  return 'Untitled Project';
}

/**
 * Extract features from conversation
 */
function extractFeatures(text: string, _projectType: ProjectType): string[] {
  const features: string[] = [];
  const featureKeywords: Record<string, string> = {
    'authentication': 'user authentication',
    'login': 'user authentication',
    'shopping cart': 'shopping cart',
    'cart': 'shopping cart',
    'wishlist': 'wishlist',
    'search': 'search functionality',
    'notification': 'notifications',
    'payment': 'payment processing',
    'stripe': 'payment processing',
    'comment': 'comments',
    'review': 'product reviews',
    'rating': 'ratings system',
    'analytics': 'analytics dashboard',
    'export': 'data export',
    'import': 'data import',
  };

  for (const [keyword, feature] of Object.entries(featureKeywords)) {
    if (text.includes(keyword) && !features.includes(feature)) {
      features.push(feature);
    }
  }

  return features;
}

/**
 * Extract entities from conversation
 */
function extractEntities(_text: string, projectType: ProjectType): string[] {
  const baseEntities: Record<ProjectType, string[]> = {
    ecommerce: ['User', 'Product', 'Order', 'Cart'],
    saas: ['User', 'Organization', 'Subscription'],
    blog: ['User', 'Post', 'Comment'],
    social: ['User', 'Post', 'Connection'],
    projectmanagement: ['User', 'Project', 'Task'],
    custom: ['User'],
  };

  return baseEntities[projectType] || ['User'];
}

/**
 * Extract integrations from conversation
 */
function extractIntegrations(text: string): string[] {
  const integrations: string[] = [];
  const integrationKeywords: Record<string, string> = {
    'stripe': 'Stripe',
    'paypal': 'PayPal',
    'google analytics': 'Google Analytics',
    'twitter': 'Twitter API',
    'facebook': 'Facebook API',
    'slack': 'Slack',
    'sendgrid': 'SendGrid',
    'mailchimp': 'Mailchimp',
    's3': 'AWS S3',
    'aws': 'AWS',
    'google oauth': 'Google OAuth',
    'github': 'GitHub OAuth',
  };

  for (const [keyword, integration] of Object.entries(integrationKeywords)) {
    if (text.includes(keyword) && !integrations.includes(integration)) {
      integrations.push(integration);
    }
  }

  return integrations;
}

/**
 * Determine mobile requirements from conversation
 */
function determineMobileRequirements(text: string): DiscoverySummary['mobileRequirements'] {
  if (text.includes('mobile-first') || text.includes('mobile first')) {
    return 'mobile-first';
  }
  if (text.includes('native app') || text.includes('ios') || text.includes('android')) {
    return 'full-parity';
  }
  if (text.includes('pwa') || text.includes('progressive web')) {
    return 'selective';
  }
  if (text.includes('responsive') || text.includes('web only')) {
    return 'none';
  }
  return 'none';
}

/**
 * Estimate project complexity
 */
function estimateComplexity(
  featureCount: number,
  entityCount: number,
  integrationCount: number
): ComplexityLevel {
  const score = featureCount + entityCount * 2 + integrationCount * 1.5;

  if (score < 10) return 'basic';
  if (score < 25) return 'intermediate';
  return 'advanced';
}

/**
 * Estimate number of sessions needed
 */
function estimateSessions(complexity: ComplexityLevel, featureCount: number): number {
  const baseSessionsByComplexity: Record<ComplexityLevel, number> = {
    basic: 8,
    intermediate: 15,
    advanced: 25,
  };

  return baseSessionsByComplexity[complexity] + Math.ceil(featureCount / 2);
}
