/**
 * Checkpoint Manager
 *
 * Manages human-in-the-loop checkpoints during agent execution.
 * Provides utilities for displaying checkpoint information and handling user responses.
 *
 * @see AGENT_INTEGRATION_ARCHITECTURE.md for checkpoint workflow details
 */

import type { AgentState, Session, CheckpointType, TDDPhase } from './types'
import { CheckpointType as CP, SessionStatus, TDDPhase as TDD } from './types'
import { setCheckpoint, resumeFromCheckpoint, getCurrentSession } from './state-manager'

// ============================================================================
// Types
// ============================================================================

export interface CheckpointData {
  type: CheckpointType
  session: Session
  phase_number: number
  message: string
  details: CheckpointDetails
  options: CheckpointOption[]
}

export interface CheckpointDetails {
  // Test metrics
  tests_written?: number
  tests_passing?: number
  tests_failing?: number

  // Files modified
  files_modified?: string[]

  // Code snippets to show
  code_samples?: CodeSample[]

  // Git info
  commit_ready?: boolean
}

export interface CodeSample {
  file_path: string
  language: string
  code: string
  description: string
}

export interface CheckpointOption {
  label: string
  value: string
  description: string
  action: CheckpointAction
}

export enum CheckpointAction {
  PROCEED = "proceed",           // Continue to next phase
  RETRY = "retry",               // Retry current phase
  SKIP = "skip",                 // Skip current session
  PAUSE = "pause",               // Pause execution
  MODIFY = "modify"              // User wants to make changes
}

// ============================================================================
// Checkpoint Creation
// ============================================================================

/**
 * Create a BEFORE_START checkpoint
 *
 * Shows session plan and asks user to approve starting.
 */
export function createBeforeStartCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number
): CheckpointData {
  const session = state.phases
    .find(p => p.number === phaseNumber)!
    .sessions.find(s => s.number === sessionNumber)!

  return {
    type: CP.BEFORE_START,
    session,
    phase_number: phaseNumber,
    message: `Ready to start Session ${sessionNumber}: ${session.title}`,
    details: {
      tests_written: 0,
      tests_passing: 0,
      tests_failing: 0,
      files_modified: []
    },
    options: [
      {
        label: "Start Session",
        value: "start",
        description: "Begin RED phase (write failing tests)",
        action: CheckpointAction.PROCEED
      },
      {
        label: "Skip Session",
        value: "skip",
        description: "Mark this session as skipped",
        action: CheckpointAction.SKIP
      },
      {
        label: "Pause",
        value: "pause",
        description: "Pause execution and resume later",
        action: CheckpointAction.PAUSE
      }
    ]
  }
}

/**
 * Create an AFTER_RED checkpoint
 *
 * Shows failing tests and asks user to approve implementation.
 */
export function createAfterRedCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  testsWritten: number,
  testsFailing: number,
  filesModified: string[],
  codeSamples: CodeSample[]
): CheckpointData {
  const session = state.phases
    .find(p => p.number === phaseNumber)!
    .sessions.find(s => s.number === sessionNumber)!

  return {
    type: CP.AFTER_RED,
    session,
    phase_number: phaseNumber,
    message: `RED phase complete: ${testsWritten} tests written, ${testsFailing} failing`,
    details: {
      tests_written: testsWritten,
      tests_passing: 0,
      tests_failing: testsFailing,
      files_modified: filesModified,
      code_samples: codeSamples
    },
    options: [
      {
        label: "Implement",
        value: "implement",
        description: "Proceed to GREEN phase (implement to pass tests)",
        action: CheckpointAction.PROCEED
      },
      {
        label: "Revise Tests",
        value: "revise",
        description: "I want to modify the tests first",
        action: CheckpointAction.MODIFY
      },
      {
        label: "Retry RED",
        value: "retry",
        description: "Retry writing tests",
        action: CheckpointAction.RETRY
      },
      {
        label: "Skip Session",
        value: "skip",
        description: "Skip this session entirely",
        action: CheckpointAction.SKIP
      }
    ]
  }
}

/**
 * Create an AFTER_GREEN checkpoint
 *
 * Shows passing tests and asks user to approve refactoring.
 */
export function createAfterGreenCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  testsWritten: number,
  testsPassing: number,
  coverage: number,
  filesModified: string[],
  codeSamples: CodeSample[]
): CheckpointData {
  const session = state.phases
    .find(p => p.number === phaseNumber)!
    .sessions.find(s => s.number === sessionNumber)!

  const coveragePercent = Math.round(coverage)

  return {
    type: CP.AFTER_GREEN,
    session,
    phase_number: phaseNumber,
    message: `GREEN phase complete: ${testsPassing}/${testsWritten} tests passing (${coveragePercent}% coverage)`,
    details: {
      tests_written: testsWritten,
      tests_passing: testsPassing,
      tests_failing: 0,
      files_modified: filesModified,
      code_samples: codeSamples
    },
    options: [
      {
        label: "Refactor",
        value: "refactor",
        description: "Proceed to REFACTOR phase (improve code quality)",
        action: CheckpointAction.PROCEED
      },
      {
        label: "Skip Refactor",
        value: "skip_refactor",
        description: "Code is good, skip to commit",
        action: CheckpointAction.SKIP
      },
      {
        label: "Modify Implementation",
        value: "modify",
        description: "I want to change the implementation",
        action: CheckpointAction.MODIFY
      },
      {
        label: "Retry GREEN",
        value: "retry",
        description: "Retry implementation",
        action: CheckpointAction.RETRY
      }
    ]
  }
}

/**
 * Create an AFTER_REFACTOR checkpoint
 *
 * Shows refactored code and asks user to approve commit.
 */
export function createAfterRefactorCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  testsWritten: number,
  testsPassing: number,
  coverage: number,
  filesModified: string[],
  codeSamples: CodeSample[]
): CheckpointData {
  const session = state.phases
    .find(p => p.number === phaseNumber)!
    .sessions.find(s => s.number === sessionNumber)!

  const coveragePercent = Math.round(coverage)

  return {
    type: CP.AFTER_REFACTOR,
    session,
    phase_number: phaseNumber,
    message: `REFACTOR phase complete: Code improved, ${testsPassing}/${testsWritten} tests passing (${coveragePercent}% coverage)`,
    details: {
      tests_written: testsWritten,
      tests_passing: testsPassing,
      tests_failing: 0,
      files_modified: filesModified,
      code_samples: codeSamples,
      commit_ready: true
    },
    options: [
      {
        label: "Commit & Continue",
        value: "commit",
        description: "Create git commit and mark session complete",
        action: CheckpointAction.PROCEED
      },
      {
        label: "Further Refactoring",
        value: "modify",
        description: "I want to refactor more",
        action: CheckpointAction.MODIFY
      },
      {
        label: "Retry REFACTOR",
        value: "retry",
        description: "Retry refactoring phase",
        action: CheckpointAction.RETRY
      }
    ]
  }
}

/**
 * Create a SESSION_COMPLETE checkpoint
 *
 * Shows session summary and asks user to continue to next session.
 */
export function createSessionCompleteCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  commitHash: string,
  actualHours: number
): CheckpointData {
  const session = state.phases
    .find(p => p.number === phaseNumber)!
    .sessions.find(s => s.number === sessionNumber)!

  const estimatedHours = session.estimated_hours
  const variance = actualHours - estimatedHours
  const variancePercent = Math.round((variance / estimatedHours) * 100)

  return {
    type: CP.SESSION_COMPLETE,
    session,
    phase_number: phaseNumber,
    message: `Session ${sessionNumber} complete: ${session.title}`,
    details: {
      tests_written: session.tests_written,
      tests_passing: session.tests_passing,
      files_modified: session.files_modified,
      commit_ready: false
    },
    options: [
      {
        label: "Continue",
        value: "continue",
        description: "Proceed to next session",
        action: CheckpointAction.PROCEED
      },
      {
        label: "Pause",
        value: "pause",
        description: "Pause execution and resume later",
        action: CheckpointAction.PAUSE
      }
    ]
  }
}

// ============================================================================
// Checkpoint Handling
// ============================================================================

/**
 * Set a checkpoint in the state
 *
 * Marks the session as AWAITING_APPROVAL with the given checkpoint type.
 *
 * @param state - Current agent state
 * @param checkpointData - Checkpoint data
 */
export function activateCheckpoint(
  state: AgentState,
  checkpointData: CheckpointData
): void {
  let tddPhase: TDDPhase | null = null

  // Determine TDD phase based on checkpoint type
  switch (checkpointData.type) {
    case CP.BEFORE_START:
      tddPhase = null
      break
    case CP.AFTER_RED:
      tddPhase = TDD.RED
      break
    case CP.AFTER_GREEN:
      tddPhase = TDD.GREEN
      break
    case CP.AFTER_REFACTOR:
      tddPhase = TDD.REFACTOR
      break
    case CP.SESSION_COMPLETE:
      tddPhase = null
      break
  }

  setCheckpoint(
    state,
    checkpointData.phase_number,
    checkpointData.session.number,
    checkpointData.type,
    tddPhase
  )
}

/**
 * Handle user response to a checkpoint
 *
 * Updates state based on user's chosen action.
 *
 * @param state - Current agent state
 * @param checkpointData - The checkpoint user is responding to
 * @param selectedOption - Option chosen by user
 * @returns Next action to take
 */
export function handleCheckpointResponse(
  state: AgentState,
  checkpointData: CheckpointData,
  selectedOption: CheckpointOption
): {
  action: CheckpointAction
  next_status: SessionStatus
  next_tdd_phase: TDDPhase | null
} {
  const { action } = selectedOption

  let nextStatus: SessionStatus
  let nextTddPhase: TDDPhase | null = null

  switch (action) {
    case CheckpointAction.PROCEED:
      // Determine next status based on current checkpoint
      switch (checkpointData.type) {
        case CP.BEFORE_START:
          nextStatus = SessionStatus.RED_PHASE
          nextTddPhase = TDD.RED
          break
        case CP.AFTER_RED:
          nextStatus = SessionStatus.GREEN_PHASE
          nextTddPhase = TDD.GREEN
          break
        case CP.AFTER_GREEN:
          nextStatus = SessionStatus.REFACTOR_PHASE
          nextTddPhase = TDD.REFACTOR
          break
        case CP.AFTER_REFACTOR:
          nextStatus = SessionStatus.COMPLETED
          nextTddPhase = null
          break
        case CP.SESSION_COMPLETE:
          nextStatus = SessionStatus.COMPLETED
          nextTddPhase = null
          break
        default:
          nextStatus = SessionStatus.IN_PROGRESS
      }
      break

    case CheckpointAction.SKIP:
      nextStatus = SessionStatus.SKIPPED
      nextTddPhase = null
      break

    case CheckpointAction.PAUSE:
      nextStatus = SessionStatus.AWAITING_APPROVAL
      // Keep current TDD phase
      nextTddPhase = checkpointData.session.current_tdd_phase
      break

    case CheckpointAction.RETRY:
      // Stay in current phase, retry
      nextStatus = checkpointData.session.status
      nextTddPhase = checkpointData.session.current_tdd_phase
      break

    case CheckpointAction.MODIFY:
      // Pause for user modifications
      nextStatus = SessionStatus.AWAITING_APPROVAL
      nextTddPhase = checkpointData.session.current_tdd_phase
      break

    default:
      nextStatus = SessionStatus.IN_PROGRESS
  }

  // Resume from checkpoint if proceeding
  if (action === CheckpointAction.PROCEED && nextStatus !== SessionStatus.COMPLETED) {
    resumeFromCheckpoint(
      state,
      checkpointData.phase_number,
      checkpointData.session.number,
      nextStatus,
      nextTddPhase
    )
  }

  return {
    action,
    next_status: nextStatus,
    next_tdd_phase: nextTddPhase
  }
}

// ============================================================================
// Checkpoint Display Formatting
// ============================================================================

/**
 * Format checkpoint data for display to user
 *
 * Creates a human-readable summary of the checkpoint.
 *
 * @param checkpointData - Checkpoint to format
 * @returns Formatted string for display
 */
export function formatCheckpointForDisplay(checkpointData: CheckpointData): string {
  const { session, message, details, options } = checkpointData

  const lines: string[] = []

  // Header
  lines.push(`\n${'='.repeat(60)}`)
  lines.push(`CHECKPOINT: ${checkpointData.type.toUpperCase().replace('_', ' ')}`)
  lines.push(`Session ${session.number}: ${session.title}`)
  lines.push(`${'='.repeat(60)}\n`)

  // Message
  lines.push(message)
  lines.push('')

  // Details
  if (details.tests_written !== undefined) {
    lines.push(`Tests Written: ${details.tests_written}`)
  }
  if (details.tests_passing !== undefined) {
    lines.push(`Tests Passing: ${details.tests_passing}`)
  }
  if (details.tests_failing !== undefined && details.tests_failing > 0) {
    lines.push(`Tests Failing: ${details.tests_failing}`)
  }
  if (details.files_modified && details.files_modified.length > 0) {
    lines.push(`\nFiles Modified (${details.files_modified.length}):`)
    details.files_modified.slice(0, 10).forEach(file => {
      lines.push(`  - ${file}`)
    })
    if (details.files_modified.length > 10) {
      lines.push(`  ... and ${details.files_modified.length - 10} more`)
    }
  }

  lines.push('')

  // Code samples
  if (details.code_samples && details.code_samples.length > 0) {
    lines.push('Code Samples:')
    details.code_samples.forEach(sample => {
      lines.push(`\n${sample.description}`)
      lines.push(`File: ${sample.file_path}`)
      lines.push('```' + sample.language)
      lines.push(sample.code)
      lines.push('```')
    })
    lines.push('')
  }

  // Options
  lines.push('What would you like to do?\n')
  options.forEach((option, index) => {
    lines.push(`${index + 1}. ${option.label}`)
    lines.push(`   ${option.description}`)
    lines.push('')
  })

  lines.push(`${'='.repeat(60)}\n`)

  return lines.join('\n')
}

// ============================================================================
// Exports
// ============================================================================

export {
  CheckpointData,
  CheckpointDetails,
  CheckpointOption,
  CheckpointAction,
  CodeSample
}
