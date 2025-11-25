// src/utils/index.ts
// Export all utility modules

// Error handling
export {
  MCPError,
  ValidationError,
  GitHubError,
  FileSystemError,
  ParseError,
  ConfigurationError,
  ErrorCode,
  formatErrorMessage,
  formatErrorForMCP,
  isRetryableError,
  getErrorSuggestion,
  wrapError,
} from './errors.js';

export type { ErrorCodeType, MCPErrorOptions } from './errors.js';

// Validation
export {
  validateGenerateProjectPlanParams,
  validateSetupGitHubProjectParams,
  validateTrackProgressParams,
  validateSyncWithGitHubParams,
  validateAnalyzeRequirementsParams,
  validateCritiquePlanParams,
  validateReviewArchitectureParams,
  validateEstimateEffortParams,
  validateDiscoveryQuestionsPromptParams,
  validateArchitectureReviewPromptParams,
  validateEstimateEffortPromptParams,
} from './validation.js';

export type { ValidationResult } from './validation.js';

// Graceful degradation
export {
  withFallback,
  withRetry,
  withTimeout,
  safeJsonParse,
  safeFileRead,
  safeGitHubCall,
  degradeGracefully,
} from './graceful.js';

export type {
  RetryOptions,
  SafeParseResult,
  SafeFileResult,
  SafeGitHubResult,
  DegradationStep,
  DegradationResult,
} from './graceful.js';
