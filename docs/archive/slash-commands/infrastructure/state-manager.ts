/**
 * Agent State Management System
 *
 * Provides utilities for saving, loading, and updating agent execution state.
 * State is persisted to `project-plans/<app-name>/.agent-state.json`.
 *
 * @see agent-state-schema.md for detailed documentation
 */

import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type {
  AgentState,
  Phase,
  Session,
  SessionUpdate,
  SessionMetrics,
  Blocker,
  SessionError,
  ExecutionStatus,
  SessionStatus,
  CheckpointType,
  TDDPhase,
  VALIDATION_RULES
} from './types'
import {
  ExecutionStatus as ExecStatus,
  SessionStatus as SessStatus,
  PhaseStatus,
  VALIDATION_RULES as RULES
} from './types'

// ============================================================================
// Configuration
// ============================================================================

const PROJECT_PLANS_DIR = path.join(process.cwd(), 'project-plans')

/**
 * Get the path to the state file for a given project
 */
function getStatePath(projectName: string): string {
  return path.join(PROJECT_PLANS_DIR, projectName, '.agent-state.json')
}

/**
 * Ensure the project directory exists
 */
function ensureProjectDir(projectName: string): void {
  const projectDir = path.join(PROJECT_PLANS_DIR, projectName)
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true })
  }
}

// ============================================================================
// State Initialization
// ============================================================================

/**
 * Initialize a new agent state for a project
 *
 * This should be called when starting execution for the first time.
 * It creates the initial state structure with empty phases (to be populated
 * by the plan parser).
 *
 * @param projectName - Name of the project (e.g., "my-blog")
 * @param appType - Type of application (e.g., "blog", "ecommerce")
 * @returns Newly created AgentState
 * @throws Error if appType is invalid
 */
export function initializeState(
  projectName: string,
  appType: string
): AgentState {
  // Validate app type
  if (!RULES.VALID_APP_TYPES.includes(appType)) {
    throw new Error(
      `Invalid app type: ${appType}. Must be one of: ${RULES.VALID_APP_TYPES.join(', ')}`
    )
  }

  const now = new Date().toISOString()

  const state: AgentState = {
    project_name: projectName,
    app_type: appType,
    plan_version: "1.0",

    execution_started_at: now,
    last_updated_at: now,
    status: ExecStatus.NOT_STARTED,

    current_phase: 1,
    current_session: null,

    phases: [],

    blockers: [],

    notes: ""
  }

  ensureProjectDir(projectName)
  saveState(state)

  return state
}

// ============================================================================
// State Persistence
// ============================================================================

/**
 * Load agent state from disk
 *
 * @param projectName - Name of the project
 * @returns AgentState if file exists, null otherwise
 */
export function loadState(projectName: string): AgentState | null {
  const statePath = getStatePath(projectName)

  if (!fs.existsSync(statePath)) {
    return null
  }

  try {
    const contents = fs.readFileSync(statePath, 'utf-8')
    return JSON.parse(contents) as AgentState
  } catch (error) {
    throw new Error(
      `Failed to load state from ${statePath}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Save agent state to disk
 *
 * Automatically updates `last_updated_at` timestamp.
 *
 * @param state - AgentState to save
 */
export function saveState(state: AgentState): void {
  state.last_updated_at = new Date().toISOString()

  const statePath = getStatePath(state.project_name)
  const contents = JSON.stringify(state, null, 2)

  try {
    fs.writeFileSync(statePath, contents, 'utf-8')
  } catch (error) {
    throw new Error(
      `Failed to save state to ${statePath}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Find a session by phase and session number
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 * @returns Session object
 * @throws Error if phase or session not found
 */
function findSession(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number
): Session {
  const phase = state.phases.find(p => p.number === phaseNumber)
  if (!phase) {
    throw new Error(`Phase ${phaseNumber} not found`)
  }

  const session = phase.sessions.find(s => s.number === sessionNumber)
  if (!session) {
    throw new Error(`Session ${sessionNumber} not found in Phase ${phaseNumber}`)
  }

  return session
}

/**
 * Update a session with partial data
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 * @param updates - Partial session data to merge
 */
export function updateSession(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  updates: SessionUpdate
): void {
  const session = findSession(state, phaseNumber, sessionNumber)

  // Merge updates
  Object.assign(session, updates)

  // Auto-calculate actual_hours if completing session
  if (updates.completed_at && session.started_at) {
    const start = new Date(session.started_at).getTime()
    const end = new Date(updates.completed_at).getTime()
    session.actual_hours = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10 // Round to 1 decimal
  }

  saveState(state)
}

/**
 * Mark a session as started
 *
 * Updates status to IN_PROGRESS and sets started_at timestamp.
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 */
export function startSession(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number
): void {
  const session = findSession(state, phaseNumber, sessionNumber)

  // Check dependencies
  const unmetDeps = session.depends_on.filter(depNum => {
    const depSession = findSession(state, phaseNumber, depNum)
    return depSession.status !== SessStatus.COMPLETED
  })

  if (unmetDeps.length > 0) {
    throw new Error(
      `Cannot start session ${sessionNumber}: depends on incomplete sessions ${unmetDeps.join(', ')}`
    )
  }

  updateSession(state, phaseNumber, sessionNumber, {
    status: SessStatus.IN_PROGRESS,
    started_at: new Date().toISOString()
  })

  // Update current session tracking
  state.current_phase = phaseNumber
  state.current_session = sessionNumber
  state.status = ExecStatus.IN_PROGRESS

  saveState(state)
}

/**
 * Mark a session as completed
 *
 * Validates that all tests pass and coverage meets requirements.
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 * @param metrics - Session completion metrics
 * @throws Error if validation fails
 */
export function markSessionComplete(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  metrics: SessionMetrics
): void {
  const session = findSession(state, phaseNumber, sessionNumber)

  // Validate tests passing
  if (metrics.tests_passing !== metrics.tests_written) {
    throw new Error(
      `Cannot complete session: ${metrics.tests_passing}/${metrics.tests_written} tests passing`
    )
  }

  // Validate coverage (backend vs frontend based on phase name)
  const phase = state.phases.find(p => p.number === phaseNumber)!
  const isBackend = phase.name.toLowerCase().includes('backend')
  const minCoverage = isBackend ? RULES.MIN_BACKEND_COVERAGE : RULES.MIN_FRONTEND_COVERAGE

  if (metrics.coverage < minCoverage) {
    throw new Error(
      `Cannot complete session: coverage ${metrics.coverage}% < ${minCoverage}% (${isBackend ? 'backend' : 'frontend'} requirement)`
    )
  }

  // Validate commit hash
  if (!metrics.commit_hash) {
    throw new Error('Cannot complete session: commit_hash is required')
  }

  updateSession(state, phaseNumber, sessionNumber, {
    status: SessStatus.COMPLETED,
    completed_at: new Date().toISOString(),
    tests_written: metrics.tests_written,
    tests_passing: metrics.tests_passing,
    coverage: metrics.coverage,
    commit_hash: metrics.commit_hash,
    actual_hours: metrics.actual_hours,
    files_modified: metrics.files_modified,
    checkpoint: null,
    current_tdd_phase: null
  })

  // Clear current session
  state.current_session = null

  // Check if phase is complete
  if (phase.sessions.every(s => s.status === SessStatus.COMPLETED)) {
    phase.status = PhaseStatus.COMPLETED
    phase.completed_at = new Date().toISOString()
  }

  // Check if all phases complete
  if (state.phases.every(p => p.status === PhaseStatus.COMPLETED)) {
    state.status = ExecStatus.COMPLETED
  }

  saveState(state)
}

/**
 * Set session checkpoint and status
 *
 * Used when pausing at TDD phase boundaries for user approval.
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 * @param checkpoint - Checkpoint type
 * @param tddPhase - Current TDD phase (or null)
 */
export function setCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  checkpoint: CheckpointType,
  tddPhase: TDDPhase | null = null
): void {
  updateSession(state, phaseNumber, sessionNumber, {
    status: SessStatus.AWAITING_APPROVAL,
    checkpoint,
    current_tdd_phase: tddPhase
  })
}

/**
 * Resume from checkpoint
 *
 * Clears checkpoint and updates TDD phase if provided.
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 * @param newStatus - New session status
 * @param tddPhase - New TDD phase (optional)
 */
export function resumeFromCheckpoint(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  newStatus: SessionStatus,
  tddPhase: TDDPhase | null = null
): void {
  updateSession(state, phaseNumber, sessionNumber, {
    status: newStatus,
    checkpoint: null,
    current_tdd_phase: tddPhase
  })
}

// ============================================================================
// Blocker Management
// ============================================================================

/**
 * Add a blocker to the state
 *
 * @param state - Current agent state
 * @param blocker - Blocker to add (id will be auto-generated if not provided)
 */
export function addBlocker(
  state: AgentState,
  blocker: Omit<Blocker, 'id' | 'created_at' | 'resolved_at' | 'resolution'>
): void {
  const newBlocker: Blocker = {
    ...blocker,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolution: null
  }

  state.blockers.push(newBlocker)

  // Mark session as blocked
  const session = findSession(state, state.current_phase, blocker.session_number)
  session.status = SessStatus.BLOCKED

  saveState(state)
}

/**
 * Resolve a blocker
 *
 * @param state - Current agent state
 * @param blockerId - ID of blocker to resolve
 * @param resolution - Description of how it was resolved
 */
export function resolveBlocker(
  state: AgentState,
  blockerId: string,
  resolution: string
): void {
  const blocker = state.blockers.find(b => b.id === blockerId)
  if (!blocker) {
    throw new Error(`Blocker ${blockerId} not found`)
  }

  blocker.resolved_at = new Date().toISOString()
  blocker.resolution = resolution

  saveState(state)
}

// ============================================================================
// Error Tracking
// ============================================================================

/**
 * Record an error in a session
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @param sessionNumber - Session number (1-based)
 * @param error - Error details
 */
export function recordError(
  state: AgentState,
  phaseNumber: number,
  sessionNumber: number,
  error: Omit<SessionError, 'occurred_at'>
): void {
  const session = findSession(state, phaseNumber, sessionNumber)

  const newError: SessionError = {
    ...error,
    occurred_at: new Date().toISOString()
  }

  session.errors.push(newError)

  // Increment retry count if not auto-fixed
  if (!error.auto_fixed) {
    session.retry_count += 1

    // Mark as ERROR if max retries exceeded
    if (session.retry_count > RULES.MAX_SESSION_RETRIES) {
      session.status = SessStatus.ERROR
    }
  }

  saveState(state)
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Get all sessions in a phase
 *
 * @param state - Current agent state
 * @param phaseNumber - Phase number (1-based)
 * @returns Array of sessions
 */
export function getPhaseSessions(
  state: AgentState,
  phaseNumber: number
): Session[] {
  const phase = state.phases.find(p => p.number === phaseNumber)
  if (!phase) {
    throw new Error(`Phase ${phaseNumber} not found`)
  }
  return phase.sessions
}

/**
 * Get the current active session
 *
 * @param state - Current agent state
 * @returns Current session or null if none active
 */
export function getCurrentSession(state: AgentState): Session | null {
  if (state.current_session === null) {
    return null
  }
  return findSession(state, state.current_phase, state.current_session)
}

/**
 * Get all unresolved blockers
 *
 * @param state - Current agent state
 * @returns Array of unresolved blockers
 */
export function getUnresolvedBlockers(state: AgentState): Blocker[] {
  return state.blockers.filter(b => b.resolved_at === null)
}

/**
 * Get execution progress statistics
 *
 * @param state - Current agent state
 * @returns Progress statistics
 */
export function getProgress(state: AgentState): {
  total_sessions: number
  completed_sessions: number
  in_progress_sessions: number
  blocked_sessions: number
  error_sessions: number
  completion_percentage: number
  estimated_hours_remaining: number
} {
  const allSessions = state.phases.flatMap(p => p.sessions)

  const completed = allSessions.filter(s => s.status === SessStatus.COMPLETED).length
  const inProgress = allSessions.filter(s => s.status === SessStatus.IN_PROGRESS).length
  const blocked = allSessions.filter(s => s.status === SessStatus.BLOCKED).length
  const error = allSessions.filter(s => s.status === SessStatus.ERROR).length

  const completionPercentage = Math.round((completed / allSessions.length) * 100)

  const remainingSessions = allSessions.filter(
    s => s.status === SessStatus.NOT_STARTED || s.status === SessStatus.IN_PROGRESS
  )
  const estimatedHoursRemaining = remainingSessions.reduce(
    (sum, s) => sum + s.estimated_hours,
    0
  )

  return {
    total_sessions: allSessions.length,
    completed_sessions: completed,
    in_progress_sessions: inProgress,
    blocked_sessions: blocked,
    error_sessions: error,
    completion_percentage: completionPercentage,
    estimated_hours_remaining: estimatedHoursRemaining
  }
}
