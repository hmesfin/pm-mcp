/**
 * Type definitions for Agent State Management System
 *
 * These types define the structure for tracking agent execution progress
 * across sessions, phases, and checkpoints.
 *
 * @see agent-state-schema.md for detailed documentation
 */

// ============================================================================
// Enums
// ============================================================================

export enum ExecutionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  PAUSED = "paused",
  ERROR = "error"
}

export enum PhaseStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

export enum SessionStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  RED_PHASE = "red_phase",                // Tests written, failing
  GREEN_PHASE = "green_phase",            // Implementation done, tests passing
  REFACTOR_PHASE = "refactor_phase",      // Refactoring in progress
  AWAITING_APPROVAL = "awaiting_approval", // At checkpoint, waiting for user
  COMPLETED = "completed",
  BLOCKED = "blocked",                    // Cannot proceed
  SKIPPED = "skipped",                    // User chose to skip
  ERROR = "error"                         // Encountered unrecoverable error
}

export enum CheckpointType {
  BEFORE_START = "before_start",
  AFTER_RED = "after_red",
  AFTER_GREEN = "after_green",
  AFTER_REFACTOR = "after_refactor",
  SESSION_COMPLETE = "session_complete"
}

export enum TDDPhase {
  RED = "red",       // Writing tests
  GREEN = "green",   // Implementing to pass tests
  REFACTOR = "refactor" // Improving code quality
}

export enum BlockerType {
  DEPENDENCY = "dependency",             // Waiting for another session
  TEST_FAILURE = "test_failure",         // Tests unexpectedly failing
  BUILD_ERROR = "build_error",           // Compilation/build error
  MERGE_CONFLICT = "merge_conflict",     // Git conflict
  MISSING_DEPENDENCY = "missing_dependency", // npm/pip package missing
  DATABASE_ERROR = "database_error"      // Migration or DB issue
}

export enum ErrorType {
  TEST_FAILURE = "test_failure",
  TYPE_ERROR = "type_error",
  MIGRATION_ERROR = "migration_error",
  IMPORT_ERROR = "import_error",
  VALIDATION_ERROR = "validation_error",
  RUNTIME_ERROR = "runtime_error"
}

// ============================================================================
// Core Interfaces
// ============================================================================

export interface SessionError {
  type: ErrorType                         // Type of error
  message: string                         // Error message
  stack_trace: string | null              // Full stack trace
  occurred_at: string                     // ISO 8601 timestamp
  auto_fixed: boolean                     // Whether agent auto-fixed it
  fix_description: string | null          // How it was fixed
}

export interface Blocker {
  id: string                              // Unique ID (UUID)
  type: BlockerType                       // Type of blocker
  severity: "critical" | "high" | "medium" | "low"
  session_number: number                  // Which session is blocked
  description: string                     // Human-readable description
  details: string                         // Technical details (stack trace, error message)
  created_at: string                      // ISO 8601 timestamp
  resolved_at: string | null              // ISO 8601 timestamp
  resolution: string | null               // How it was resolved
}

export interface Session {
  number: number                          // 1, 2, 3...
  title: string                           // "Models + Admin", "Serializers + ViewSets"
  status: SessionStatus                   // Current session status

  // Timing
  started_at: string | null               // ISO 8601 timestamp
  completed_at: string | null             // ISO 8601 timestamp
  estimated_hours: number                 // e.g., 2.5
  actual_hours: number | null             // Calculated from started_at to completed_at

  // Current checkpoint
  checkpoint: CheckpointType | null       // Where execution is paused

  // TDD phase tracking
  current_tdd_phase: TDDPhase | null      // "red" | "green" | "refactor" | null

  // Test metrics
  tests_written: number                   // Count of tests written
  tests_passing: number                   // Count of tests passing
  coverage: number | null                 // Percentage (0-100)

  // Git tracking
  commit_hash: string | null              // e.g., "a1b2c3d"
  branch: string | null                   // e.g., "feature/blog-models"

  // Files created/modified
  files_modified: string[]                // List of file paths

  // Dependencies
  depends_on: number[]                    // List of session numbers that must complete first
  blocks: number[]                        // List of session numbers that depend on this one

  // Error tracking
  errors: SessionError[]
  retry_count: number                     // Number of times session was retried
}

export interface Phase {
  number: number                          // 1, 2, 3, 4
  name: string                            // "Backend Foundation", "Frontend Foundation"
  status: PhaseStatus                     // "not_started" | "in_progress" | "completed"
  sessions: Session[]
  started_at: string | null               // ISO 8601 timestamp
  completed_at: string | null             // ISO 8601 timestamp
}

export interface AgentState {
  // Project metadata
  project_name: string                    // e.g., "my-blog"
  app_type: string                        // e.g., "blog", "ecommerce", "saas"
  plan_version: string                    // e.g., "1.0"

  // Execution tracking
  execution_started_at: string            // ISO 8601 timestamp
  last_updated_at: string                 // ISO 8601 timestamp
  status: ExecutionStatus                 // "not_started" | "in_progress" | "completed" | "paused" | "error"

  // Current position
  current_phase: number                   // 1-based (1, 2, 3, 4)
  current_session: number | null          // 1-based (1, 2, 3...) or null if no active session

  // Phases and sessions
  phases: Phase[]

  // Blockers and issues
  blockers: Blocker[]

  // Notes and metadata
  notes: string
}

// ============================================================================
// Validation Constraints
// ============================================================================

export interface ValidationRules {
  // Coverage requirements
  readonly MIN_BACKEND_COVERAGE: number   // 90%
  readonly MIN_FRONTEND_COVERAGE: number  // 85%

  // Retry limits
  readonly MAX_SESSION_RETRIES: number    // 2

  // Known app types
  readonly VALID_APP_TYPES: readonly string[]
}

export const VALIDATION_RULES: ValidationRules = {
  MIN_BACKEND_COVERAGE: 90,
  MIN_FRONTEND_COVERAGE: 85,
  MAX_SESSION_RETRIES: 2,
  VALID_APP_TYPES: ["blog", "ecommerce", "saas", "social", "projectmanagement"] as const
}

// ============================================================================
// Helper Types
// ============================================================================

export type SessionUpdate = Partial<Omit<Session, 'number' | 'title' | 'estimated_hours' | 'depends_on' | 'blocks'>>

export interface SessionMetrics {
  tests_written: number
  tests_passing: number
  coverage: number
  commit_hash: string
  actual_hours: number
  files_modified: string[]
}
