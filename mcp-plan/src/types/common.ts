// src/types/common.ts
// Shared type definitions used across the MCP server

export type ComplexityLevel = "basic" | "intermediate" | "advanced";

export type ProjectType = "blog" | "ecommerce" | "saas" | "social" | "projectmanagement" | "custom";

export type TDDPhase = "not_started" | "red" | "green" | "refactor" | "complete";

export type SessionStatus =
  | "not_started"
  | "in_progress"
  | "red_phase"
  | "green_phase"
  | "refactor_phase"
  | "awaiting_approval"
  | "completed"
  | "blocked"
  | "skipped";

export type Domain = "backend" | "frontend" | "mobile" | "e2e" | "infrastructure";

export interface TestMetrics {
  testsWritten: number;
  testsPassing: number;
  testsFailing: number;
  coverage: number;
  typeCheckPassing: boolean;
  lintPassing: boolean;
}

export interface TimeEstimate {
  estimated: string;  // e.g., "2.5h"
  actual?: string;
  variance?: number;  // percentage
}

export interface Session {
  number: number;
  title: string;
  phase: number;
  phaseName: string;
  domain: Domain;
  objectives: string[];
  tddWorkflow: {
    redPhase: TDDTask[];
    greenPhase: TDDTask[];
    refactorPhase: TDDTask[];
  };
  filesToCreate: string[];
  filesToModify: string[];
  dependencies: number[];  // Session numbers
  exitCriteria: string[];
  estimatedTime: TimeEstimate;
  estimatedTests: number;
  status: SessionStatus;
  githubIssue?: number;
  githubPR?: number;
  metrics?: TestMetrics;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TDDTask {
  description: string;
  duration: string;  // e.g., "15 min"
  commands?: string[];
  expectedOutcome: string;
}

export interface Phase {
  number: number;
  name: string;
  goal: string;
  sessions: Session[];
  deliverables: string[];
  estimatedTime: string;
  status: "not_started" | "in_progress" | "completed";
  completedSessions: number;
  totalSessions: number;
}

export interface ProjectPlan {
  name: string;
  description: string;
  projectType: ProjectType;
  complexity: ComplexityLevel;
  techStack: {
    backend: string;
    frontend: string;
    mobile: string;
    infrastructure: string[];
  };
  features: string[];
  integrations: string[];
  phases: Phase[];
  totalSessions: number;
  totalEstimatedTime: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentState {
  projectName: string;
  currentPhase: number;
  currentSession: number;
  completedSessions: number[];
  inProgress?: number;
  blockedSessions: number[];
  lastCheckpoint: Date;
  status: "not_started" | "in_progress" | "completed" | "paused";
  github?: {
    owner: string;
    repo: string;
    projectUrl?: string;
    issueMapping: Record<number, number>;  // sessionNumber -> issueNumber
    prMapping: Record<number, number>;     // sessionNumber -> prNumber
  };
  metrics: {
    totalTests: number;
    avgCoverage: number;
    timeSpent: string;
    velocity: number;  // sessions per day
  };
}

export interface Challenge {
  severity: "low" | "medium" | "high";
  category: "architecture" | "scope" | "timeline" | "technical" | "compliance";
  title: string;
  description: string;
  recommendation: string;
}

export interface Suggestion {
  category: "feature" | "architecture" | "tooling" | "workflow";
  title: string;
  description: string;
  benefit: string;
  effort: "low" | "medium" | "high";
}

export interface Risk {
  severity: "low" | "medium" | "high" | "critical";
  category: "technical" | "timeline" | "scope" | "dependency" | "compliance";
  title: string;
  description: string;
  mitigation: string;
  probability: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export type WebhookEventType =
  | "session_started"
  | "session_completed"
  | "phase_completed"
  | "session_blocked";

export interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;  // For HMAC signature verification
  events: WebhookEventType[];
  enabled: boolean;
  retryCount?: number;  // Max retries (default: 3)
  timeoutMs?: number;   // Request timeout (default: 10000)
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookPayload {
  id: string;           // Unique event ID
  event: WebhookEventType;
  timestamp: Date;
  project: {
    name: string;
    owner?: string;
    repo?: string;
  };
  session?: {
    number: number;
    title: string;
    domain: Domain;
    phase: number;
    phaseName: string;
    status: SessionStatus;
    metrics?: TestMetrics;
    startedAt?: Date;
    completedAt?: Date;
  };
  phase?: {
    number: number;
    name: string;
    completedSessions: number;
    totalSessions: number;
  };
  blocker?: {
    sessionNumber: number;
    reason: string;
    blockedBy?: number[];  // Session numbers blocking this one
  };
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  payload: WebhookPayload;
  status: "pending" | "success" | "failed";
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
}

export interface WebhookDeliveryResult {
  success: boolean;
  webhookId: string;
  eventId: string;
  statusCode?: number;
  error?: string;
  retryScheduled?: boolean;
}
