// src/types/resources.ts
// Type definitions for MCP resources

import { ProjectPlan, AgentState, Risk } from "./common.js";

export interface ProjectResource {
  uri: string;  // "project://my-blog"
  name: string;
  mimeType: "application/json";
  content: {
    plan: ProjectPlan;
    state: AgentState;
    status: "not_started" | "in_progress" | "completed" | "paused";
    github?: {
      owner: string;
      repo: string;
      projectUrl?: string;
    };
  };
}

export interface TemplateResource {
  uri: string;  // "template://blog" or "template://blog/PROJECT_PLAN"
  name: string;
  mimeType: "text/markdown" | "application/json";
  content: string | TemplateMetadata;
}

export interface TemplateMetadata {
  type: string;
  name: string;
  description: string;
  complexity: string;
  features: string[];
  customizations: {
    name: string;
    type: "boolean" | "choice" | "text";
    default: any;
    options?: string[];
  }[];
  estimatedSessions: number;
  estimatedTime: string;
}

export interface PatternResource {
  uri: string;  // "pattern://django/models" or "pattern://vue/composables"
  name: string;
  mimeType: "text/markdown" | "application/json";
  content: Pattern;
}

export interface Pattern {
  name: string;
  category: "backend" | "frontend" | "mobile" | "infrastructure";
  subcategory: string;  // e.g., "models", "serializers", "components"
  description: string;
  when: string;  // When to use this pattern
  benefits: string[];
  tradeoffs: string[];
  example: {
    code: string;
    language: string;
    explanation: string;
  };
  relatedPatterns: string[];
  references: string[];
  usageCount: number;  // How many times used in past projects
  successRate: number; // 0-100
}

export interface MetricsResource {
  uri: string;  // "metrics://all" or "metrics://estimation" or "metrics://velocity"
  name: string;
  mimeType: "application/json";
  content: MetricsData;
}

export interface MetricsData {
  projects: ProjectMetrics[];
  aggregated: {
    totalProjects: number;
    totalSessions: number;
    avgSessionsPerProject: number;
    avgTimePerSession: string;
    avgCoverage: number;
    estimationAccuracy: {
      avgVariance: number;  // percentage
      underestimates: number;
      overestimates: number;
    };
    velocity: {
      avgSessionsPerDay: number;
      avgTestsPerSession: number;
    };
  };
  patterns: {
    mostUsed: Pattern[];
    highestSuccess: Pattern[];
  };
  risks: {
    common: Risk[];
    resolved: number;
    unresolved: number;
  };
}

export interface ProjectMetrics {
  name: string;
  type: string;
  complexity: string;
  completedAt?: Date;
  sessions: {
    planned: number;
    completed: number;
    skipped: number;
  };
  time: {
    estimated: string;
    actual: string;
    variance: number;  // percentage
  };
  quality: {
    avgCoverage: number;
    totalTests: number;
    typeCheckPassing: boolean;
  };
  velocity: {
    sessionsPerDay: number;
    testsPerSession: number;
  };
}
