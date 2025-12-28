// src/types/tools.ts
// Type definitions for all MCP tool parameters and return values

import { ComplexityLevel, ProjectType, Session, TestMetrics, ProjectPlan, Challenge, Suggestion, Risk, Domain, TDDPhase, SessionStatus } from "./common.js";

// ============================================================================
// PLANNING TOOLS
// ============================================================================

export interface ConductDiscoveryParams {
  projectType?: ProjectType;
  conversationHistory?: DiscoveryMessage[];
}

export interface DiscoveryMessage {
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export interface DiscoveryQuestion {
  id: string;
  question: string;
  type: "text" | "choice" | "multiselect" | "boolean";
  options?: string[];
  defaultValue?: string;
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  followUp?: {
    condition: string;  // e.g., "if answer contains 'payment'"
    questions: DiscoveryQuestion[];
  };
}

export interface DiscoverySession {
  projectType: ProjectType;
  questions: DiscoveryQuestion[];
  challenges: Challenge[];
  suggestions: Suggestion[];
  risks: Risk[];
  nextQuestion?: DiscoveryQuestion;
  isComplete: boolean;
  summary?: DiscoverySummary;
}

export interface DiscoverySummary {
  projectName: string;
  projectType: ProjectType;
  complexity: ComplexityLevel;
  features: string[];
  entities: string[];
  integrations: string[];
  mobileRequirements: "none" | "full-parity" | "selective" | "mobile-first";
  mobileFeatures?: string[];
  estimatedSessions: number;
  estimatedTime: string;
}

export interface AnalyzeRequirementsParams {
  requirements: string;  // Markdown content
  projectType?: ProjectType;
}

export interface RequirementsAnalysis {
  valid: boolean;
  completeness: number;  // 0-100
  clarity: number;       // 0-100
  feasibility: number;   // 0-100
  gaps: Gap[];
  conflicts: Conflict[];
  ambiguities: Ambiguity[];
  suggestions: Suggestion[];
  risks: Risk[];
  estimatedComplexity: ComplexityLevel;
}

export interface Gap {
  category: "data-model" | "api" | "ui" | "workflow" | "security" | "testing";
  title: string;
  description: string;
  severity: "minor" | "major" | "critical";
  recommendation: string;
}

export interface Conflict {
  category: "technical" | "business" | "timeline" | "scope";
  title: string;
  description: string;
  conflictingItems: string[];
  recommendation: string;
}

export interface Ambiguity {
  location: string;  // Where in requirements
  text: string;      // The ambiguous text
  issue: string;     // What's unclear
  clarificationNeeded: string;
}

export interface GenerateProjectPlanParams {
  requirementsPath?: string;     // Path to REQUIREMENTS.md
  requirements?: string;          // Or direct content
  discoverySummary?: DiscoverySummary;
  outputPath: string;             // Where to write files
  templateType?: ProjectType;
  customizations?: Record<string, any>;
}

export interface GenerateProjectPlanResult {
  success: boolean;
  projectPlan: ProjectPlan;
  filesCreated: string[];
  warnings: string[];
  errors: string[];
}

export interface CritiquePlanParams {
  planPath: string;  // Path to PROJECT_PLAN.md
  includeDiagram?: boolean;  // Generate Mermaid dependency diagram
  diagramOptions?: {
    direction?: 'TB' | 'BT' | 'LR' | 'RL';
    highlightCriticalPath?: boolean;
    showParallelGroups?: boolean;
    colorByDomain?: boolean;
  };
}

export interface PlanCritique {
  overall: {
    score: number;  // 0-100
    strengths: string[];
    weaknesses: string[];
  };
  sessions: SessionCritique[];
  dependencies: {
    valid: boolean;
    circularDependencies: number[][];
    missingDependencies: { session: number; requires: number }[];
  };
  parallelization: {
    opportunities: ParallelizationOpportunity[];
    estimatedTimeSavings: string;
  };
  risks: Risk[];
  recommendations: string[];
  diagram?: {
    mermaid: string;
    criticalPath: number[];
  };
}

export interface SessionCritique {
  sessionNumber: number;
  score: number;  // 0-100
  issues: {
    severity: "low" | "medium" | "high";
    category: "scope" | "dependencies" | "testing" | "timeline";
    description: string;
  }[];
  suggestions: string[];
}

export interface ParallelizationOpportunity {
  sessions: number[];
  reason: string;
  timeSavings: string;
}

// ============================================================================
// GITHUB INTEGRATION TOOLS
// ============================================================================

export interface SetupGitHubProjectParams {
  owner: string;
  repo: string;
  planPath: string;           // Path to PROJECT_PLAN.md
  createProject?: boolean;    // Create GitHub Project board (default: true)
  createMilestones?: boolean; // Create milestones per phase (default: true)
  labels?: LabelConfig;
}

export interface LabelConfig {
  phases?: boolean;      // phase-1, phase-2, etc.
  domains?: boolean;     // backend, frontend, mobile
  sessions?: boolean;    // session-1, session-2, etc.
  tddPhases?: boolean;   // red-phase, green-phase, refactor-phase
  custom?: { name: string; color: string; description: string }[];
}

export interface SetupGitHubProjectResult {
  success: boolean;
  projectUrl?: string;
  projectId?: number;
  issuesCreated: IssueCreated[];
  milestonesCreated: MilestoneCreated[];
  labelsCreated: string[];
  errors: string[];
}

export interface IssueCreated {
  sessionNumber: number;
  issueNumber: number;
  title: string;
  url: string;
}

export interface MilestoneCreated {
  phaseNumber: number;
  milestoneNumber: number;
  title: string;
  url: string;
}

export interface SyncWithGitHubParams {
  owner: string;
  repo: string;
  direction: "pull" | "push" | "bidirectional";
  statePath?: string;  // Path to .agent-state.json (default: auto-detect)
}

export interface SyncWithGitHubResult {
  success: boolean;
  direction: "pull" | "push" | "bidirectional";
  sessionsSynced: number;
  updates: SyncUpdate[];
  conflicts: SyncConflict[];
  errors: string[];
}

export interface SyncUpdate {
  sessionNumber: number;
  field: string;
  oldValue: any;
  newValue: any;
  source: "github" | "local";
}

export interface SyncConflict {
  sessionNumber: number;
  field: string;
  githubValue: any;
  localValue: any;
  resolution?: "github" | "local" | "manual";
}

export interface TrackProgressParams {
  owner: string;
  repo: string;
  format?: "summary" | "detailed" | "json";
}

export interface ProgressReport {
  project: string;
  status: "not_started" | "in_progress" | "completed" | "paused";
  lastUpdated: Date;
  progress: {
    overall: ProgressMetrics;
    byPhase: Record<string, PhaseProgress>;
    byDomain: Record<Domain, DomainProgress>;
  };
  metrics: {
    totalTests: number;
    avgCoverage: number;
    timeSpent: string;
    timeEstimated: string;
    velocity: number;
    estimatedCompletion?: Date;
  };
  pullRequests: {
    open: PRSummary[];
    merged: PRSummary[];
    draft: PRSummary[];
  };
  blockers: Blocker[];
  upNext?: Session;
  recommendations: string[];
}

export interface ProgressMetrics {
  totalSessions: number;
  completed: number;
  inProgress: number;
  blocked: number;
  notStarted: number;
  percentComplete: number;
}

export interface PhaseProgress {
  name: string;
  sessions: number;
  completed: number;
  inProgress: number;
  blocked: number;
  percentComplete: number;
  estimatedTime: string;
  actualTime?: string;
}

export interface DomainProgress {
  sessions: number;
  completed: number;
  percentComplete: number;
}

export interface PRSummary {
  number: number;
  title: string;
  sessionNumber?: number;
  status: "open" | "merged" | "closed" | "draft";
  checks?: "passing" | "failing" | "pending";
  reviewers: string[];
  createdAt: Date;
  mergedAt?: Date;
  url: string;
}

export interface Blocker {
  sessionNumber: number;
  title: string;
  category: "dependency" | "technical" | "external" | "approval";
  description: string;
  blockedSince: Date;
  resolution?: string;
}

export interface UpdateSessionStatusParams {
  owner: string;
  repo: string;
  sessionNumber: number;
  status: SessionStatus;
  phase?: TDDPhase;
  metrics?: TestMetrics;
  comment?: string;
  moveProjectCard?: boolean;  // Auto-move on GitHub Project board
}

export interface UpdateSessionStatusResult {
  success: boolean;
  issueNumber: number;
  commentAdded: boolean;
  labelsUpdated: string[];
  cardMoved: boolean;
  newColumn?: string;
}

export interface FindNextSessionParams {
  owner: string;
  repo: string;
  considerDependencies?: boolean;  // Only suggest sessions with satisfied dependencies
  preferDomain?: Domain;           // Prefer sessions in this domain
}

export interface FindNextSessionResult {
  found: boolean;
  session?: Session;
  issueNumber?: number;
  issueUrl?: string;
  blockedBy?: number[];  // Session numbers blocking this one
  parallelOptions?: Session[];  // Other sessions that could run in parallel
}

// ============================================================================
// INTELLIGENCE TOOLS
// ============================================================================

export interface ReviewArchitectureParams {
  planPath?: string;           // Path to PROJECT_PLAN.md
  requirementsPath?: string;   // Path to REQUIREMENTS.md
  plan?: string;               // Or direct content
  requirements?: string;
  focus?: "backend" | "frontend" | "mobile" | "infrastructure" | "all";
}

export interface ArchitectureReview {
  overall: {
    score: number;  // 0-100
    strengths: string[];
    concerns: string[];
  };
  patterns: {
    recognized: RecognizedPattern[];
    recommended: RecommendedPattern[];
    antiPatterns: AntiPattern[];
  };
  techStack: {
    appropriate: boolean;
    recommendations: TechRecommendation[];
  };
  scalability: {
    score: number;
    concerns: string[];
    recommendations: string[];
  };
  security: {
    score: number;
    vulnerabilities: SecurityConcern[];
    recommendations: string[];
  };
  testability: {
    score: number;
    concerns: string[];
    recommendations: string[];
  };
}

export interface RecognizedPattern {
  name: string;
  category: "architecture" | "design" | "data" | "api";
  description: string;
  benefits: string[];
  location: string;  // Where in the plan
}

export interface RecommendedPattern {
  name: string;
  category: "architecture" | "design" | "data" | "api";
  reason: string;
  benefits: string[];
  tradeoffs: string[];
  effort: "low" | "medium" | "high";
}

export interface AntiPattern {
  name: string;
  category: "architecture" | "design" | "data" | "api";
  description: string;
  risks: string[];
  alternative: string;
  location: string;
}

export interface TechRecommendation {
  current: string;
  category: "backend" | "frontend" | "mobile" | "infrastructure" | "tooling";
  recommendation?: string;
  reason: string;
  tradeoffs?: string[];
}

export interface SecurityConcern {
  severity: "low" | "medium" | "high" | "critical";
  category: "authentication" | "authorization" | "data" | "api" | "infrastructure";
  title: string;
  description: string;
  mitigation: string;
  references?: string[];
}

export interface EstimateEffortParams {
  requirements?: string;
  plan?: string;
  complexity?: ComplexityLevel;
  features?: string[];
  similarProjects?: string[];  // Project names to learn from
}

export interface EffortEstimate {
  total: {
    sessions: number;
    time: string;
    confidence: number;  // 0-100
  };
  byPhase: {
    phase: string;
    sessions: number;
    time: string;
    confidence: number;
  }[];
  byDomain: {
    domain: Domain;
    sessions: number;
    time: string;
  }[];
  breakdown: {
    feature: string;
    sessions: number;
    time: string;
    complexity: ComplexityLevel;
  }[];
  adjustments: {
    factor: string;
    impact: number;  // percentage
    reason: string;
  }[];
  risks: {
    category: "underestimate" | "overestimate" | "dependency" | "complexity";
    description: string;
    mitigation: string;
  }[];
  historicalComparison?: {
    project: string;
    similarity: number;  // 0-100
    actualTime: string;
    variance: number;    // percentage
  }[];
}
