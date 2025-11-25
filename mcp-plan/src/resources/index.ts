// src/resources/index.ts
// MCP Resource handlers for project, template, pattern, and metrics resources

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: 'application/json' | 'text/markdown';
}

export interface ResourceContent {
  uri: string;
  mimeType: 'application/json' | 'text/markdown';
  text: string;
  content?: string; // Alias for text for compatibility
}

interface Pattern {
  name: string;
  category: string;
  description: string;
  usageCount: number;
  examples?: string[];
  antiPatterns?: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Base paths - configurable via environment
const PROJECTS_DIR = process.env.PROJECTS_DIR || path.join(process.cwd(), '..', 'project-plans');
const TEMPLATES_DIR = process.env.TEMPLATES_DIR || path.join(process.cwd(), '..', 'templates');

// Built-in patterns for best practices
const PATTERNS: Pattern[] = [
  // Backend patterns
  {
    name: 'repository',
    category: 'backend',
    description: 'Repository pattern for data access abstraction',
    usageCount: 0,
    examples: ['UserRepository', 'ProductRepository'],
    antiPatterns: ['Direct database access in controllers'],
  },
  {
    name: 'service-layer',
    category: 'backend',
    description: 'Service layer pattern for business logic encapsulation',
    usageCount: 0,
    examples: ['UserService', 'OrderService'],
    antiPatterns: ['Fat controllers with business logic'],
  },
  {
    name: 'dto',
    category: 'backend',
    description: 'Data Transfer Objects for API contracts',
    usageCount: 0,
    examples: ['CreateUserDTO', 'UpdateProductDTO'],
    antiPatterns: ['Exposing database models directly'],
  },
  {
    name: 'dependency-injection',
    category: 'backend',
    description: 'Dependency injection for testability and loose coupling',
    usageCount: 0,
    examples: ['Constructor injection', 'Interface-based injection'],
    antiPatterns: ['Hard-coded dependencies', 'Global state'],
  },
  // Frontend patterns
  {
    name: 'composable',
    category: 'frontend',
    description: 'Vue 3 composable pattern for reusable logic',
    usageCount: 0,
    examples: ['useAuth', 'useFetch', 'useForm'],
    antiPatterns: ['Logic in components that should be reusable'],
  },
  {
    name: 'store-module',
    category: 'frontend',
    description: 'Pinia/Vuex store modules for state management',
    usageCount: 0,
    examples: ['useUserStore', 'useCartStore'],
    antiPatterns: ['Component-level global state'],
  },
  {
    name: 'compound-component',
    category: 'frontend',
    description: 'Compound components for flexible UI composition',
    usageCount: 0,
    examples: ['Tabs + Tab', 'Accordion + AccordionItem'],
    antiPatterns: ['Monolithic components with too many props'],
  },
  // Mobile patterns
  {
    name: 'offline-first',
    category: 'mobile',
    description: 'Offline-first architecture for mobile apps',
    usageCount: 0,
    examples: ['Local SQLite + sync', 'Queue-based operations'],
    antiPatterns: ['Assuming network availability'],
  },
  {
    name: 'platform-abstraction',
    category: 'mobile',
    description: 'Platform abstraction for cross-platform code',
    usageCount: 0,
    examples: ['Platform-specific files (.ios.tsx, .android.tsx)'],
    antiPatterns: ['Platform checks scattered throughout code'],
  },
  // Infrastructure patterns
  {
    name: 'infrastructure-as-code',
    category: 'infrastructure',
    description: 'Infrastructure as code for reproducible deployments',
    usageCount: 0,
    examples: ['Docker Compose', 'Terraform', 'Kubernetes manifests'],
    antiPatterns: ['Manual server configuration'],
  },
  {
    name: 'ci-cd-pipeline',
    category: 'infrastructure',
    description: 'CI/CD pipeline for automated testing and deployment',
    usageCount: 0,
    examples: ['GitHub Actions', 'GitLab CI', 'Jenkins'],
    antiPatterns: ['Manual deployments'],
  },
  // Testing patterns
  {
    name: 'tdd',
    category: 'testing',
    description: 'Test-Driven Development methodology',
    usageCount: 0,
    examples: ['RED-GREEN-REFACTOR cycle'],
    antiPatterns: ['Writing tests after implementation'],
  },
  {
    name: 'test-fixtures',
    category: 'testing',
    description: 'Test fixtures for consistent test data',
    usageCount: 0,
    examples: ['Factory functions', 'Seed data'],
    antiPatterns: ['Duplicated test data across tests'],
  },
];

// ============================================================================
// LIST RESOURCES
// ============================================================================

/**
 * List all available resource types
 */
export async function listResources(): Promise<ResourceDefinition[]> {
  return [
    {
      uri: 'project://list',
      name: 'All Projects',
      description: 'List all projects tracked by the planner with their current status',
      mimeType: 'application/json',
    },
    {
      uri: 'template://list',
      name: 'Available Templates',
      description: 'List all available project templates with complexity and features',
      mimeType: 'application/json',
    },
    {
      uri: 'pattern://list',
      name: 'Best Practices Patterns',
      description: 'List all recognized patterns and best practices by category',
      mimeType: 'application/json',
    },
    {
      uri: 'metrics://all',
      name: 'Historical Metrics',
      description: 'Aggregated metrics from all past projects including estimation accuracy',
      mimeType: 'application/json',
    },
  ];
}

// ============================================================================
// READ RESOURCE (Router)
// ============================================================================

/**
 * Read a resource by URI - routes to appropriate handler
 */
export async function readResource(uri: string): Promise<ResourceContent> {
  const scheme = uri.split('://')[0];

  switch (scheme) {
    case 'project':
      return getProjectResource(uri);
    case 'template':
      return getTemplateResource(uri);
    case 'pattern':
      return getPatternResource(uri);
    case 'metrics':
      return getMetricsResource(uri);
    default:
      throw new Error(`Unknown resource scheme: ${scheme}`);
  }
}

// ============================================================================
// PROJECT RESOURCE
// ============================================================================

/**
 * Get project resource by URI
 * - project://list - List all projects
 * - project://name - Get specific project
 */
export async function getProjectResource(uri: string): Promise<ResourceContent> {
  const resourcePath = uri.replace('project://', '');

  if (resourcePath === 'list') {
    return listProjects();
  }

  return getProject(resourcePath);
}

async function listProjects(): Promise<ResourceContent> {
  const projects: Array<{ name: string; status?: string; path: string }> = [];

  try {
    const entries = await fs.readdir(PROJECTS_DIR);

    for (const entry of entries) {
      const entryPath = path.join(PROJECTS_DIR, entry);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        // Try to read .agent-state.json for status
        let status: string | undefined;
        try {
          const statePath = path.join(entryPath, '.agent-state.json');
          const stateContent = await fs.readFile(statePath, 'utf-8');
          const state = JSON.parse(stateContent);
          status = state.status;
        } catch {
          // No state file, that's ok
        }

        projects.push({
          name: entry,
          status,
          path: entryPath,
        });
      }
    }
  } catch {
    // Projects directory doesn't exist yet
  }

  const text = JSON.stringify({ projects }, null, 2);
  return {
    uri: 'project://list',
    mimeType: 'application/json',
    text,
    content: text,
  };
}

async function getProject(name: string): Promise<ResourceContent> {
  const projectPath = path.join(PROJECTS_DIR, name);

  // Check if project exists
  await fs.access(projectPath);

  // Read project state
  const statePath = path.join(projectPath, '.agent-state.json');
  const stateContent = await fs.readFile(statePath, 'utf-8');
  const state = JSON.parse(stateContent);

  const text = JSON.stringify(state, null, 2);
  return {
    uri: `project://${name}`,
    mimeType: 'application/json',
    text,
    content: text,
  };
}

// ============================================================================
// TEMPLATE RESOURCE
// ============================================================================

/**
 * Get template resource by URI
 * - template://list - List all templates
 * - template://name - Get template metadata
 * - template://name/file - Get template file content
 */
export async function getTemplateResource(uri: string): Promise<ResourceContent> {
  const resourcePath = uri.replace('template://', '');
  const segments = resourcePath.split('/');

  if (resourcePath === 'list') {
    return listTemplates();
  }

  if (segments.length === 1) {
    return getTemplateMetadata(segments[0]);
  }

  return getTemplateFile(segments[0], segments[1]);
}

async function listTemplates(): Promise<ResourceContent> {
  const templates: Array<{
    name: string;
    complexity?: string;
    description?: string;
  }> = [];

  try {
    const entries = await fs.readdir(TEMPLATES_DIR);

    for (const entry of entries) {
      const entryPath = path.join(TEMPLATES_DIR, entry);
      const stat = await fs.stat(entryPath);

      if (stat.isDirectory()) {
        // Try to read README.md for metadata
        let complexity: string | undefined;
        let description: string | undefined;

        try {
          const readmePath = path.join(entryPath, 'README.md');
          const content = await fs.readFile(readmePath, 'utf-8');

          // Parse complexity
          const complexityMatch = content.match(/##\s*Complexity\s*\n([^\n#]+)/i);
          if (complexityMatch) {
            complexity = complexityMatch[1].trim().toLowerCase();
          }

          // Parse description
          const descMatch = content.match(/##\s*Description\s*\n([^\n#]+)/i);
          if (descMatch) {
            description = descMatch[1].trim();
          }
        } catch {
          // No README, that's ok
        }

        templates.push({
          name: entry,
          complexity,
          description,
        });
      }
    }
  } catch {
    // Templates directory doesn't exist
  }

  const text = JSON.stringify({ templates }, null, 2);
  return {
    uri: 'template://list',
    mimeType: 'application/json',
    text,
    content: text,
  };
}

async function getTemplateMetadata(name: string): Promise<ResourceContent> {
  const templatePath = path.join(TEMPLATES_DIR, name);

  // Check if template exists
  await fs.access(templatePath);

  // Read README.md for metadata
  const readmePath = path.join(templatePath, 'README.md');
  const content = await fs.readFile(readmePath, 'utf-8');

  // Parse metadata from README
  const metadata: Record<string, unknown> = { name };

  const complexityMatch = content.match(/##\s*Complexity\s*\n([^\n#]+)/i);
  if (complexityMatch) {
    metadata.complexity = complexityMatch[1].trim().toLowerCase();
  }

  const descMatch = content.match(/##\s*Description\s*\n([^\n#]+)/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim();
  }

  const featuresMatch = content.match(/##\s*Features\s*\n((?:[-*][^\n]+\n?)+)/i);
  if (featuresMatch) {
    metadata.features = featuresMatch[1]
      .split('\n')
      .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*'))
      .map((line) => line.replace(/^[-*]\s*/, '').trim());
  }

  const text = JSON.stringify(metadata, null, 2);
  return {
    uri: `template://${name}`,
    mimeType: 'application/json',
    text,
    content: text,
  };
}

async function getTemplateFile(
  templateName: string,
  fileName: string
): Promise<ResourceContent> {
  const templatePath = path.join(TEMPLATES_DIR, templateName);

  // Check if template exists
  await fs.access(templatePath);

  // Try multiple file extensions
  const possibleFiles = [
    `${fileName}.md`,
    `${fileName}.json`,
    fileName,
  ];

  for (const file of possibleFiles) {
    const filePath = path.join(templatePath, file);
    try {
      await fs.access(filePath);
      const content = await fs.readFile(filePath, 'utf-8');

      const isMarkdown = file.endsWith('.md') || !file.includes('.');
      return {
        uri: `template://${templateName}/${fileName}`,
        mimeType: isMarkdown ? 'text/markdown' : 'application/json',
        text: content,
        content,
      };
    } catch {
      // Try next extension
    }
  }

  throw new Error(`Template file not found: ${templateName}/${fileName}`);
}

// ============================================================================
// PATTERN RESOURCE
// ============================================================================

/**
 * Get pattern resource by URI
 * - pattern://list - List all patterns
 * - pattern://category - List patterns by category
 * - pattern://category/name - Get specific pattern
 */
export async function getPatternResource(uri: string): Promise<ResourceContent> {
  const resourcePath = uri.replace('pattern://', '');
  const segments = resourcePath.split('/');

  if (resourcePath === 'list') {
    return listPatterns();
  }

  if (segments.length === 1) {
    return getPatternsByCategory(segments[0]);
  }

  return getPattern(segments[0], segments[1]);
}

function listPatterns(): ResourceContent {
  const categories = [...new Set(PATTERNS.map((p) => p.category))];

  const text = JSON.stringify(
    {
      patterns: PATTERNS,
      categories,
      totalPatterns: PATTERNS.length,
    },
    null,
    2
  );

  return {
    uri: 'pattern://list',
    mimeType: 'application/json',
    text,
    content: text,
  };
}

function getPatternsByCategory(category: string): ResourceContent {
  const patterns = PATTERNS.filter((p) => p.category === category);

  if (patterns.length === 0) {
    throw new Error(`Unknown pattern category: ${category}`);
  }

  const text = JSON.stringify({ patterns, category }, null, 2);
  return {
    uri: `pattern://${category}`,
    mimeType: 'application/json',
    text,
    content: text,
  };
}

function getPattern(category: string, name: string): ResourceContent {
  const pattern = PATTERNS.find(
    (p) => p.category === category && p.name === name
  );

  if (!pattern) {
    throw new Error(`Pattern not found: ${category}/${name}`);
  }

  const text = JSON.stringify(pattern, null, 2);
  return {
    uri: `pattern://${category}/${name}`,
    mimeType: 'application/json',
    text,
    content: text,
  };
}

// ============================================================================
// METRICS RESOURCE
// ============================================================================

/**
 * Get metrics resource by URI
 * - metrics://all - All aggregated metrics
 * - metrics://estimation - Estimation accuracy metrics
 * - metrics://velocity - Velocity metrics
 */
export async function getMetricsResource(uri: string): Promise<ResourceContent> {
  const resourcePath = uri.replace('metrics://', '');

  // For now, return baseline metrics
  // In the future, this will read from actual project data
  const baselineMetrics = getBaselineMetrics();

  switch (resourcePath) {
    case 'all':
      return {
        uri: 'metrics://all',
        mimeType: 'application/json',
        text: JSON.stringify(baselineMetrics, null, 2),
        content: JSON.stringify(baselineMetrics, null, 2),
      };

    case 'estimation':
      return {
        uri: 'metrics://estimation',
        mimeType: 'application/json',
        text: JSON.stringify({ estimation: baselineMetrics.aggregated.estimationAccuracy }, null, 2),
        content: JSON.stringify({ estimation: baselineMetrics.aggregated.estimationAccuracy }, null, 2),
      };

    case 'velocity':
      return {
        uri: 'metrics://velocity',
        mimeType: 'application/json',
        text: JSON.stringify({ velocity: baselineMetrics.aggregated.velocity }, null, 2),
        content: JSON.stringify({ velocity: baselineMetrics.aggregated.velocity }, null, 2),
      };

    default:
      throw new Error(`Unknown metrics type: ${resourcePath}`);
  }
}

function getBaselineMetrics() {
  return {
    aggregated: {
      totalProjects: 0,
      totalSessions: 0,
      completedSessions: 0,
      averageSessionDuration: 3.5, // hours
      estimationAccuracy: {
        mean: 0.85, // 85% accuracy baseline
        stdDev: 0.15,
        sampleSize: 0,
        trend: 'stable' as const,
      },
      velocity: {
        sessionsPerWeek: 0,
        trend: 'stable' as const,
        byDomain: {
          backend: 0,
          frontend: 0,
          mobile: 0,
          infrastructure: 0,
        },
      },
    },
    risks: {
      common: [
        {
          type: 'scope-creep',
          frequency: 0.3,
          impact: 'medium',
          mitigation: 'Clear requirements and change control process',
        },
        {
          type: 'underestimation',
          frequency: 0.4,
          impact: 'high',
          mitigation: 'Add buffer time, use historical data',
        },
        {
          type: 'dependency-delays',
          frequency: 0.25,
          impact: 'medium',
          mitigation: 'Identify dependencies early, have fallback plans',
        },
      ],
    },
    patterns: {
      mostUsed: PATTERNS.slice(0, 5).map((p) => ({
        name: p.name,
        category: p.category,
        usageCount: p.usageCount,
      })),
      byCategory: PATTERNS.reduce(
        (acc, p) => {
          acc[p.category] = (acc[p.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  };
}
