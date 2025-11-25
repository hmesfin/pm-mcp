// src/prompts/index.ts
// MCP prompt handlers implementation

export interface PromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments: PromptArgument[];
}

export interface PromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

export interface PromptResult {
  messages: PromptMessage[];
}

// Discovery questions by project type
const DISCOVERY_QUESTIONS: Record<string, string[]> = {
  blog: [
    'What is the primary audience for your blog (tech professionals, general public, niche hobbyists)?',
    'Will users need to register/login to comment or interact with content?',
    'Do you need support for multiple authors or a single author?',
    'What content formats do you need (text, code snippets, images, videos, embedded media)?',
    'Do you need categories, tags, or both for content organization?',
    'Is SEO optimization a priority? Do you need sitemaps, meta tags, structured data?',
    'Do you need an RSS feed or newsletter integration?',
    'What moderation features do you need for comments?',
  ],
  ecommerce: [
    'What type of products will you sell (physical, digital, subscriptions, services)?',
    'How many products do you expect to have (10s, 100s, 1000s)?',
    'What payment processors do you need to support (Stripe, PayPal, others)?',
    'Do you need inventory management and stock tracking?',
    'Will you offer discounts, coupons, or promotional pricing?',
    'Do you need shipping calculation and multiple shipping methods?',
    'What tax calculation requirements do you have (by region, VAT, etc.)?',
    'Do you need customer accounts with order history?',
    'Will you support guest checkout?',
    'Do you need product reviews and ratings?',
  ],
  saas: [
    'What is the core problem your SaaS solves?',
    'Who are your target users (individuals, small teams, enterprises)?',
    'What pricing model will you use (free tier, subscription tiers, usage-based)?',
    'Do you need multi-tenancy support?',
    'What authentication methods do you need (email/password, OAuth, SSO)?',
    'Do you need role-based access control (RBAC)?',
    'What integrations are essential (Slack, email, webhooks, APIs)?',
    'Do you need real-time features (notifications, live updates, collaboration)?',
    'What analytics and reporting do users need?',
    'Do you need an admin dashboard for managing customers?',
  ],
  social: [
    'What type of social platform is this (networking, content sharing, community)?',
    'What is the primary content type (text posts, images, videos, mixed)?',
    'Do users need to follow/friend other users?',
    'What notification system do you need (in-app, email, push)?',
    'Do you need direct messaging between users?',
    'What moderation and content policy features are needed?',
    'Do you need groups or communities within the platform?',
    'What privacy settings should users have?',
    'Do you need content recommendation or discovery features?',
    'Is real-time feed updates important?',
  ],
  projectmanagement: [
    'What methodology will the tool support (Agile, Kanban, Waterfall, hybrid)?',
    'What is the typical team size using this tool?',
    'Do you need time tracking and reporting?',
    'What task hierarchy do you need (projects > epics > tasks > subtasks)?',
    'Do you need integrations with development tools (GitHub, GitLab, CI/CD)?',
    'What collaboration features are essential (comments, mentions, file sharing)?',
    'Do you need Gantt charts or timeline views?',
    'What notification and reminder system is needed?',
    'Do you need resource allocation and capacity planning?',
    'Is mobile access important?',
  ],
  custom: [
    'What is the core purpose of this application?',
    'Who are the primary users of this system?',
    'What are the 3-5 most critical features?',
    'What existing systems does this need to integrate with?',
    'What are the performance requirements (users, data volume, response time)?',
    'What security and compliance requirements exist?',
    'Is mobile support required (responsive web, native app, both)?',
    'What is the expected timeline and budget constraints?',
  ],
};

// Common questions for all project types
const COMMON_QUESTIONS = [
  'What is your testing strategy preference (unit tests, integration tests, E2E)?',
  'What test coverage target do you have in mind (70%, 85%, 95%)?',
  'Do you have existing infrastructure or is this greenfield?',
  'What deployment environment will you use (cloud provider, on-premise)?',
  'Are there any specific performance requirements or SLAs?',
  'What logging and monitoring solutions do you plan to use?',
  'Do you have any specific accessibility requirements (WCAG compliance)?',
];

// Focus area instructions for architecture review
const FOCUS_INSTRUCTIONS: Record<string, string> = {
  backend: `
Focus your review on BACKEND architecture:
- API design and RESTful conventions
- Database schema and query optimization
- Authentication and authorization implementation
- Caching strategies (Redis, in-memory)
- Background job processing
- Error handling and logging
- Service layer organization
- Repository pattern usage
- Input validation and sanitization
- Rate limiting and throttling`,

  frontend: `
Focus your review on FRONTEND architecture:
- Component hierarchy and composition
- State management approach
- Routing structure
- API integration patterns
- Form handling and validation
- Error boundary implementation
- Performance optimization (lazy loading, memoization)
- Accessibility (ARIA, keyboard navigation)
- Responsive design approach
- Testing strategy (unit, integration, E2E)`,

  mobile: `
Focus your review on MOBILE architecture:
- Cross-platform vs native considerations
- Navigation structure
- Offline-first data handling
- State persistence (AsyncStorage, SQLite)
- Push notification implementation
- Deep linking support
- Performance optimization (FlatList, image caching)
- Platform-specific code organization
- Native module integration
- App store compliance considerations`,

  infrastructure: `
Focus your review on INFRASTRUCTURE architecture:
- Deployment strategy (containers, serverless)
- CI/CD pipeline design
- Environment management (dev, staging, prod)
- Database provisioning and backups
- Secrets management
- Monitoring and alerting setup
- Log aggregation
- Scaling strategy (horizontal, vertical)
- Disaster recovery plan
- Cost optimization opportunities`,

  all: `
Perform a COMPREHENSIVE review covering all areas:

BACKEND:
- API design, database schema, authentication, caching, background jobs

FRONTEND:
- Component architecture, state management, routing, performance

INFRASTRUCTURE:
- Deployment, CI/CD, monitoring, scaling, security

CROSS-CUTTING:
- Security vulnerabilities, scalability concerns, testability, maintainability`,
};

// Complexity multipliers for estimation
const COMPLEXITY_DESCRIPTIONS: Record<string, string> = {
  basic: `
BASIC complexity considerations:
- Standard CRUD operations
- Simple authentication (email/password)
- Single-tenant architecture
- Minimal third-party integrations
- Basic responsive UI
- Standard testing patterns
- Typical TDD overhead: +30% for test writing`,

  intermediate: `
INTERMEDIATE complexity considerations:
- Complex business logic
- Multiple user roles and permissions
- Third-party API integrations
- Real-time features (WebSockets)
- Advanced UI interactions
- Comprehensive test coverage required
- Typical TDD overhead: +40% for test writing`,

  advanced: `
ADVANCED complexity considerations:
- Multi-tenant architecture
- Complex authorization (RBAC, ABAC)
- High-performance requirements
- Multiple integrations and webhooks
- Real-time collaboration features
- Offline support and sync
- Extensive security requirements
- Typical TDD overhead: +50% for test writing and security tests`,
};

/**
 * List all available prompts
 */
export function listPrompts(): PromptDefinition[] {
  return [
    {
      name: 'discovery-questions',
      description: 'Generate intelligent discovery questions for project planning based on project type',
      arguments: [
        {
          name: 'projectType',
          description: 'Type of project (blog, ecommerce, saas, social, projectmanagement, custom)',
          required: true,
        },
        {
          name: 'previousAnswers',
          description: 'Previous answers for follow-up questions (JSON object)',
          required: false,
        },
      ],
    },
    {
      name: 'architecture-review',
      description: 'Generate comprehensive architecture review prompt for analyzing project plans',
      arguments: [
        {
          name: 'plan',
          description: 'Project plan content (markdown)',
          required: true,
        },
        {
          name: 'requirements',
          description: 'Requirements content (markdown)',
          required: true,
        },
        {
          name: 'focus',
          description: 'Focus area (backend, frontend, mobile, infrastructure, all)',
          required: false,
        },
      ],
    },
    {
      name: 'estimate-effort',
      description: 'Generate effort estimation prompt with historical context and complexity analysis',
      arguments: [
        {
          name: 'requirements',
          description: 'Requirements content (markdown)',
          required: true,
        },
        {
          name: 'complexity',
          description: 'Project complexity level (basic, intermediate, advanced)',
          required: true,
        },
        {
          name: 'similarProjects',
          description: 'List of similar project names for reference',
          required: false,
        },
      ],
    },
  ];
}

/**
 * Get a prompt by name with arguments
 */
export function getPrompt(
  name: string,
  args: Record<string, any>
): PromptResult {
  switch (name) {
    case 'discovery-questions':
      return generateDiscoveryQuestionsPrompt({
        projectType: args.projectType,
        previousAnswers: args.previousAnswers,
      });

    case 'architecture-review':
      return generateArchitectureReviewPrompt({
        plan: args.plan,
        requirements: args.requirements,
        focus: args.focus,
      });

    case 'estimate-effort':
      return generateEstimateEffortPrompt({
        requirements: args.requirements,
        complexity: args.complexity,
        similarProjects: args.similarProjects,
      });

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}

/**
 * Generate discovery questions prompt
 */
export function generateDiscoveryQuestionsPrompt(params: {
  projectType: string;
  previousAnswers?: Record<string, any>;
}): PromptResult {
  const { projectType, previousAnswers } = params;

  // Get project-specific questions
  const projectQuestions = DISCOVERY_QUESTIONS[projectType] || DISCOVERY_QUESTIONS.custom;

  // Build context from previous answers
  let previousContext = '';
  if (previousAnswers && Object.keys(previousAnswers).length > 0) {
    previousContext = `
## Previous Answers
The user has already provided these answers:
${Object.entries(previousAnswers)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

Based on these answers, tailor your follow-up questions and consider any implications.
`;

    // Add follow-up context based on specific answers
    if (previousAnswers.hasAuthentication === 'yes' ||
        previousAnswers.authentication?.toLowerCase().includes('yes')) {
      previousContext += `
Note: User indicated authentication is needed. Consider asking about:
- OAuth providers needed
- Role-based access control requirements
- Session management preferences
`;
    }
  }

  const promptText = `# Project Discovery Questions

You are helping plan a **${projectType}** application. Your goal is to gather comprehensive requirements through intelligent questioning.

## Instructions

1. Ask questions one at a time to avoid overwhelming the user
2. Challenge assumptions when answers seem incomplete
3. Identify potential gaps in the requirements
4. Consider TDD implications for each feature discussed
5. Note any scalability or performance concerns
6. Flag security considerations early

${previousContext}

## Domain-Specific Questions for ${projectType.toUpperCase()}

Consider asking these ${projectType}-specific questions:
${projectQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## Common Technical Questions

Also consider these cross-cutting concerns:
${COMMON_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## TDD Considerations

For each feature discussed, consider:
- What tests would verify this feature works correctly?
- What edge cases need test coverage?
- What integration points need testing?
- What is a reasonable coverage target for this feature?

## Output Format

Provide your next question in a conversational manner. After each answer, summarize what you've learned and identify any gaps or follow-up questions needed.

When you have gathered sufficient information, provide a summary including:
- Core features identified
- Technical requirements
- Testing strategy recommendations
- Potential risks and challenges
- Suggested complexity level (basic/intermediate/advanced)`;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText,
        },
      },
    ],
  };
}

/**
 * Generate architecture review prompt
 */
export function generateArchitectureReviewPrompt(params: {
  plan: string;
  requirements: string;
  focus?: string;
}): PromptResult {
  const { plan, requirements, focus = 'all' } = params;

  const focusInstructions = FOCUS_INSTRUCTIONS[focus] || FOCUS_INSTRUCTIONS.all;

  const promptText = `# Architecture Review

You are an expert software architect reviewing a project plan and requirements. Provide a comprehensive analysis focusing on patterns, anti-patterns, security, scalability, and testability.

${focusInstructions}

## Project Plan

\`\`\`markdown
${plan}
\`\`\`

## Requirements

\`\`\`markdown
${requirements}
\`\`\`

## Review Criteria

### 1. Pattern Recognition
- Identify recognized architectural patterns (Repository, Service Layer, MVC, etc.)
- Recommend patterns that would benefit this project
- Flag any anti-patterns (God Objects, Circular Dependencies, etc.)

### 2. Security Analysis
- Authentication and authorization approach
- Data protection and encryption
- Input validation and sanitization
- OWASP Top 10 considerations
- Secrets management

### 3. Scalability Assessment
- Database design for scale
- Caching strategy appropriateness
- API design for performance
- Background job handling
- Horizontal vs vertical scaling readiness

### 4. Testability Review
- Unit test feasibility for proposed structure
- Integration test approach
- E2E test strategy
- TDD workflow compatibility
- Coverage achievability

### 5. Tech Stack Evaluation
- Technology choices appropriateness
- Library/framework selection rationale
- Potential compatibility issues
- Maintenance considerations

## Output Format

Provide your review in this structure:

### Overall Assessment
- Score: X/10
- Key Strengths: [list]
- Primary Concerns: [list]

### Patterns
- Recognized: [patterns found]
- Recommended: [patterns to add]
- Anti-patterns: [issues to fix]

### Security
- Score: X/10
- Vulnerabilities: [list]
- Recommendations: [list]

### Scalability
- Score: X/10
- Concerns: [list]
- Recommendations: [list]

### Testability
- Score: X/10
- TDD Compatibility: [assessment]
- Coverage Targets: [achievability]

### Action Items
1. [High priority items]
2. [Medium priority items]
3. [Low priority items]`;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText,
        },
      },
    ],
  };
}

/**
 * Generate effort estimation prompt
 */
export function generateEstimateEffortPrompt(params: {
  requirements: string;
  complexity: string;
  similarProjects?: string[];
}): PromptResult {
  const { requirements, complexity, similarProjects } = params;

  const complexityDescription = COMPLEXITY_DESCRIPTIONS[complexity] || COMPLEXITY_DESCRIPTIONS.intermediate;

  let similarProjectsContext = '';
  if (similarProjects && similarProjects.length > 0) {
    similarProjectsContext = `
## Reference Projects

Consider these similar projects for calibration:
${similarProjects.map((p) => `- ${p}`).join('\n')}

Use learnings from these projects to:
- Calibrate time estimates based on historical data
- Identify common pitfalls that added time
- Apply variance adjustments for similar features
`;
  }

  const promptText = `# Effort Estimation

You are an expert project estimator. Analyze the requirements and provide data-driven effort estimates with confidence levels.

## Complexity Level: ${complexity.toUpperCase()}

${complexityDescription}

## Requirements to Estimate

\`\`\`markdown
${requirements}
\`\`\`

${similarProjectsContext}

## Estimation Guidelines

### Session-Based Planning
- Each session = 2-4 hours of focused work
- Include TDD overhead (RED-GREEN-REFACTOR cycle)
- Account for testing time (typically 30-50% of implementation)
- Include documentation time

### Phase Breakdown
- Phase 1: Core Infrastructure (setup, types, database)
- Phase 2: Core Features (main functionality)
- Phase 3: Integrations (third-party services)
- Phase 4: Intelligence/Advanced Features
- Phase 5: Polish (error handling, optimization, docs)

### Risk Assessment
- Technical risks (new technologies, integrations)
- Scope risks (unclear requirements)
- Resource risks (dependencies on others)
- Timeline risks (external deadlines)

### Confidence Levels
- High (80%+): Well-understood, similar to past work
- Medium (60-80%): Some unknowns, reasonable assumptions
- Low (<60%): Significant unknowns, high variability

## Output Format

Provide your estimate in this structure:

### Total Estimate
- Sessions: X-Y sessions
- Time: X-Y hours
- Confidence: [High/Medium/Low]

### By Phase
| Phase | Sessions | Hours | Confidence |
|-------|----------|-------|------------|
| 1. Infrastructure | X | X | High/Med/Low |
| 2. Core Features | X | X | High/Med/Low |
| 3. Integrations | X | X | High/Med/Low |
| 4. Advanced | X | X | High/Med/Low |
| 5. Polish | X | X | High/Med/Low |

### Feature Breakdown
| Feature | Sessions | Complexity | Risk |
|---------|----------|------------|------|
| [Feature 1] | X | [basic/int/adv] | [low/med/high] |
| ... | ... | ... | ... |

### Adjustments Applied
- TDD overhead: +X%
- Integration complexity: +X%
- [Other factors]: +/-X%

### Risks
1. [Risk 1]: Impact [X sessions], Mitigation [strategy]
2. [Risk 2]: Impact [X sessions], Mitigation [strategy]

### Recommendations
- [Suggestions for scope management]
- [Parallel work opportunities]
- [Dependencies to resolve early]`;

  return {
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: promptText,
        },
      },
    ],
  };
}
