// src/utils/validation.ts
// Input validation using Zod schemas

import { z } from 'zod';

// Re-export ValidationError from errors module
export { ValidationError } from './errors.js';

/**
 * Validation result type
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

/**
 * Common schemas
 */
const projectTypeSchema = z.enum([
  'blog',
  'ecommerce',
  'saas',
  'social',
  'projectmanagement',
  'custom',
]);

const complexitySchema = z.enum(['basic', 'intermediate', 'advanced']);

// Domain schema - exported for use by other validators
export const domainSchema = z.enum(['backend', 'frontend', 'mobile', 'e2e', 'infrastructure']);

const focusSchema = z.enum(['backend', 'frontend', 'mobile', 'infrastructure', 'all']);

const formatSchema = z.enum(['summary', 'detailed', 'json']);

const directionSchema = z.enum(['pull', 'push', 'bidirectional']);

// GitHub owner/repo pattern (alphanumeric, hyphens, no spaces)
const githubNameSchema = z
  .string()
  .min(1, 'Required')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid format: only alphanumeric, dots, hyphens, and underscores allowed');

// Non-empty string that trims whitespace
const nonEmptyStringSchema = z.string().min(1).transform((s) => s.trim());

// Path schema
const pathSchema = z.string().min(1, 'Path is required').transform((s) => s.trim());

/**
 * GenerateProjectPlan params schema
 */
const generateProjectPlanParamsSchema = z
  .object({
    requirementsPath: pathSchema.optional(),
    requirements: z.string().optional(),
    discoverySummary: z.object({}).passthrough().optional(),
    outputPath: pathSchema,
    templateType: projectTypeSchema.optional(),
    customizations: z.record(z.any()).optional(),
  })
  .refine(
    (data) => data.requirementsPath || data.requirements,
    { message: 'Either requirementsPath or requirements must be provided' }
  );

/**
 * Validate generateProjectPlan params
 */
export function validateGenerateProjectPlanParams(
  params: unknown
): ValidationResult<z.infer<typeof generateProjectPlanParamsSchema>> {
  const result = generateProjectPlanParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * SetupGitHubProject params schema
 */
const setupGitHubProjectParamsSchema = z.object({
  owner: githubNameSchema,
  repo: githubNameSchema,
  planPath: pathSchema,
  createProject: z.boolean().optional().default(true),
  createMilestones: z.boolean().optional().default(true),
  labels: z
    .object({
      phases: z.boolean().optional(),
      domains: z.boolean().optional(),
      sessions: z.boolean().optional(),
      tddPhases: z.boolean().optional(),
      custom: z
        .array(
          z.object({
            name: z.string(),
            color: z.string(),
            description: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

/**
 * Validate setupGitHubProject params
 */
export function validateSetupGitHubProjectParams(
  params: unknown
): ValidationResult<z.infer<typeof setupGitHubProjectParamsSchema>> {
  const result = setupGitHubProjectParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * TrackProgress params schema
 */
const trackProgressParamsSchema = z.object({
  owner: githubNameSchema,
  repo: githubNameSchema,
  format: formatSchema.optional().default('summary'),
});

/**
 * Validate trackProgress params
 */
export function validateTrackProgressParams(
  params: unknown
): ValidationResult<z.infer<typeof trackProgressParamsSchema>> {
  const result = trackProgressParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * SyncWithGitHub params schema
 */
const syncWithGitHubParamsSchema = z.object({
  owner: githubNameSchema,
  repo: githubNameSchema,
  direction: directionSchema,
  statePath: pathSchema.optional(),
});

/**
 * Validate syncWithGitHub params
 */
export function validateSyncWithGitHubParams(
  params: unknown
): ValidationResult<z.infer<typeof syncWithGitHubParamsSchema>> {
  const result = syncWithGitHubParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * AnalyzeRequirements params schema
 */
const analyzeRequirementsParamsSchema = z.object({
  requirements: z
    .string()
    .min(1, 'requirements is required')
    .refine((s) => s.trim().length > 0, { message: 'requirements cannot be empty' }),
  projectType: projectTypeSchema.optional(),
});

/**
 * Validate analyzeRequirements params
 */
export function validateAnalyzeRequirementsParams(
  params: unknown
): ValidationResult<z.infer<typeof analyzeRequirementsParamsSchema>> {
  const result = analyzeRequirementsParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * CritiquePlan params schema
 */
const critiquePlanParamsSchema = z.object({
  planPath: pathSchema,
});

/**
 * Validate critiquePlan params
 */
export function validateCritiquePlanParams(
  params: unknown
): ValidationResult<z.infer<typeof critiquePlanParamsSchema>> {
  const result = critiquePlanParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * ReviewArchitecture params schema
 */
const reviewArchitectureParamsSchema = z
  .object({
    planPath: pathSchema.optional(),
    requirementsPath: pathSchema.optional(),
    plan: z.string().optional(),
    requirements: z.string().optional(),
    focus: focusSchema.optional().default('all'),
  })
  .refine((data) => data.planPath || data.plan, {
    message: 'Either planPath or plan content must be provided',
  })
  .refine((data) => data.requirementsPath || data.requirements, {
    message: 'Either requirementsPath or requirements content must be provided',
  });

/**
 * Validate reviewArchitecture params
 */
export function validateReviewArchitectureParams(
  params: unknown
): ValidationResult<z.infer<typeof reviewArchitectureParamsSchema>> {
  const result = reviewArchitectureParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * EstimateEffort params schema
 */
const estimateEffortParamsSchema = z
  .object({
    requirements: z.string().optional(),
    plan: z.string().optional(),
    complexity: complexitySchema.optional(),
    features: z.array(z.string()).optional(),
    similarProjects: z.array(z.string()).optional(),
  })
  .refine((data) => data.requirements || data.plan, {
    message: 'Either requirements or plan must be provided',
  });

/**
 * Validate estimateEffort params
 */
export function validateEstimateEffortParams(
  params: unknown
): ValidationResult<z.infer<typeof estimateEffortParamsSchema>> {
  const result = estimateEffortParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

// ============================================================================
// PROMPT VALIDATION
// ============================================================================

/**
 * DiscoveryQuestionsPrompt params schema
 */
const discoveryQuestionsPromptParamsSchema = z.object({
  projectType: projectTypeSchema,
  previousAnswers: z.record(z.any()).optional(),
});

/**
 * Validate discoveryQuestionsPrompt params
 */
export function validateDiscoveryQuestionsPromptParams(
  params: unknown
): ValidationResult<z.infer<typeof discoveryQuestionsPromptParamsSchema>> {
  const result = discoveryQuestionsPromptParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * ArchitectureReviewPrompt params schema
 */
const architectureReviewPromptParamsSchema = z.object({
  plan: nonEmptyStringSchema,
  requirements: nonEmptyStringSchema,
  focus: focusSchema.optional(),
});

/**
 * Validate architectureReviewPrompt params
 */
export function validateArchitectureReviewPromptParams(
  params: unknown
): ValidationResult<z.infer<typeof architectureReviewPromptParamsSchema>> {
  const result = architectureReviewPromptParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}

/**
 * EstimateEffortPrompt params schema
 */
const estimateEffortPromptParamsSchema = z.object({
  requirements: nonEmptyStringSchema,
  complexity: complexitySchema,
  similarProjects: z.array(z.string()).optional(),
});

/**
 * Validate estimateEffortPrompt params
 */
export function validateEstimateEffortPromptParams(
  params: unknown
): ValidationResult<z.infer<typeof estimateEffortPromptParamsSchema>> {
  const result = estimateEffortPromptParamsSchema.safeParse(params);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return {
    success: false,
    error: errors.join('; '),
    errors,
  };
}
