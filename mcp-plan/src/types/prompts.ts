// src/types/prompts.ts
// Type definitions for MCP prompts

export interface DiscoveryPromptParams {
  projectType: string;
  previousAnswers?: Record<string, any>;
}

export interface DiscoveryPrompt {
  name: "discovery-questions";
  description: string;
  arguments: DiscoveryPromptParams;
  template: string;
}

export interface ArchitectureReviewPromptParams {
  plan: string;
  requirements: string;
  focus?: string;
}

export interface ArchitectureReviewPrompt {
  name: "architecture-review";
  description: string;
  arguments: ArchitectureReviewPromptParams;
  template: string;
}

export interface EstimationPromptParams {
  requirements: string;
  complexity: string;
  similarProjects?: string[];
}

export interface EstimationPrompt {
  name: "estimate-effort";
  description: string;
  arguments: EstimationPromptParams;
  template: string;
}
