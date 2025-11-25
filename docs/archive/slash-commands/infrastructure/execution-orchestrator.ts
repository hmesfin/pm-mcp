/**
 * Execution Orchestrator
 *
 * Coordinates the execution of a project plan, managing state, checkpoints,
 * and agent execution. This is the main controller for automated plan execution.
 *
 * @see AGENT_INTEGRATION_ARCHITECTURE.md for architecture details
 */

import type { AgentState, Phase, Session } from './types'
import { ExecutionStatus, SessionStatus } from './types'
import {
  initializeState,
  loadState,
  saveState,
  startSession,
  markSessionComplete,
  updateSession,
  getCurrentSession,
  getProgress
} from './state-manager'
import { parsePlanForApp, validatePlan } from './plan-parser'
import {
  createBeforeStartCheckpoint,
  createAfterRedCheckpoint,
  createAfterGreenCheckpoint,
  createAfterRefactorCheckpoint,
  createSessionCompleteCheckpoint,
  activateCheckpoint,
  formatCheckpointForDisplay,
  type CheckpointData,
  type CheckpointOption,
  CheckpointAction
} from './checkpoint-manager'

// ============================================================================
// Types
// ============================================================================

export interface OrchestratorConfig {
  project_name: string
  app_type: string
  auto_continue?: boolean        // Auto-proceed through checkpoints (dangerous!)
  dry_run?: boolean              // Parse plan but don't execute
  resume?: boolean               // Resume from saved state
}

export interface ExecutionResult {
  success: boolean
  state: AgentState
  error?: Error
  sessions_completed: number
  sessions_total: number
  hours_spent: number
}

export interface SessionExecutor {
  /**
   * Execute the RED phase (write failing tests)
   *
   * @param state - Current agent state
   * @param phase - Current phase
   * @param session - Current session
   * @returns Test files created and test counts
   */
  executeRedPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    tests_written: number
    tests_failing: number
    files_modified: string[]
  }>

  /**
   * Execute the GREEN phase (implement to pass tests)
   *
   * @param state - Current agent state
   * @param phase - Current phase
   * @param session - Current session
   * @returns Implementation files and test results
   */
  executeGreenPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    tests_passing: number
    coverage: number
    files_modified: string[]
  }>

  /**
   * Execute the REFACTOR phase (improve code quality)
   *
   * @param state - Current agent state
   * @param phase - Current phase
   * @param session - Current session
   * @returns Refactored files
   */
  executeRefactorPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    files_modified: string[]
    coverage: number
  }>

  /**
   * Create a git commit for completed session
   *
   * @param state - Current agent state
   * @param phase - Current phase
   * @param session - Current session
   * @returns Commit hash
   */
  createCommit(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<string>
}

// ============================================================================
// Orchestrator Class
// ============================================================================

export class ExecutionOrchestrator {
  private config: OrchestratorConfig
  private state: AgentState | null = null
  private executor: SessionExecutor | null = null

  constructor(config: OrchestratorConfig) {
    this.config = config
  }

  /**
   * Set the session executor
   *
   * The executor is responsible for the actual implementation (RED, GREEN, REFACTOR).
   * In Phase 3.1, this is a placeholder. In Phase 3.2, this will be the backend-builder agent.
   */
  setExecutor(executor: SessionExecutor): void {
    this.executor = executor
  }

  /**
   * Initialize execution
   *
   * Loads existing state or creates new state from plan.
   */
  async initialize(): Promise<void> {
    const { project_name, app_type, resume } = this.config

    if (resume) {
      // Try to load existing state
      this.state = loadState(project_name)

      if (!this.state) {
        throw new Error(
          `Cannot resume: no existing state found for project "${project_name}"`
        )
      }

      console.log(`Resumed execution for project "${project_name}"`)
      console.log(`Status: ${this.state.status}`)
      console.log(`Current: Phase ${this.state.current_phase}, Session ${this.state.current_session}`)
    } else {
      // Initialize new state
      this.state = initializeState(project_name, app_type)

      // Parse plan and populate phases
      const phases = parsePlanForApp(app_type)
      validatePlan(phases)

      this.state.phases = phases
      this.state.status = ExecutionStatus.IN_PROGRESS

      saveState(this.state)

      console.log(`Initialized new execution for project "${project_name}"`)
      console.log(`Plan: ${app_type}`)
      console.log(`Total sessions: ${phases.flatMap(p => p.sessions).length}`)
    }
  }

  /**
   * Execute the plan
   *
   * Main execution loop that runs through all sessions.
   */
  async execute(): Promise<ExecutionResult> {
    if (!this.state) {
      throw new Error('Orchestrator not initialized. Call initialize() first.')
    }

    if (!this.executor) {
      throw new Error('No executor set. Call setExecutor() first.')
    }

    const startTime = Date.now()

    try {
      // Execute each phase
      for (const phase of this.state.phases) {
        if (phase.status === 'completed') {
          console.log(`Phase ${phase.number} already completed, skipping...`)
          continue
        }

        console.log(`\n=== Starting Phase ${phase.number}: ${phase.name} ===\n`)

        // Execute each session in phase
        for (const session of phase.sessions) {
          if (session.status === SessionStatus.COMPLETED) {
            console.log(`Session ${session.number} already completed, skipping...`)
            continue
          }

          if (session.status === SessionStatus.SKIPPED) {
            console.log(`Session ${session.number} skipped by user`)
            continue
          }

          // Execute session
          const sessionResult = await this.executeSession(phase, session)

          if (!sessionResult.success) {
            console.error(`Session ${session.number} failed, halting execution`)
            break
          }
        }

        // Check if phase complete
        if (phase.sessions.every(s =>
          s.status === SessionStatus.COMPLETED ||
          s.status === SessionStatus.SKIPPED
        )) {
          phase.status = 'completed'
          phase.completed_at = new Date().toISOString()
          saveState(this.state)
        }
      }

      // Check if all phases complete
      if (this.state.phases.every(p => p.status === 'completed')) {
        this.state.status = ExecutionStatus.COMPLETED
        saveState(this.state)
      }

      const endTime = Date.now()
      const hours_spent = (endTime - startTime) / (1000 * 60 * 60)

      const progress = getProgress(this.state)

      return {
        success: true,
        state: this.state,
        sessions_completed: progress.completed_sessions,
        sessions_total: progress.total_sessions,
        hours_spent
      }
    } catch (error) {
      this.state.status = ExecutionStatus.ERROR
      saveState(this.state)

      return {
        success: false,
        state: this.state,
        error: error as Error,
        sessions_completed: getProgress(this.state).completed_sessions,
        sessions_total: getProgress(this.state).total_sessions,
        hours_spent: 0
      }
    }
  }

  /**
   * Execute a single session through RED-GREEN-REFACTOR cycle
   */
  private async executeSession(
    phase: Phase,
    session: Session
  ): Promise<{ success: boolean }> {
    if (!this.state || !this.executor) {
      throw new Error('Orchestrator not properly initialized')
    }

    console.log(`\n>>> Session ${session.number}: ${session.title} <<<\n`)

    // CHECKPOINT 1: BEFORE_START
    const beforeStartCheckpoint = createBeforeStartCheckpoint(
      this.state,
      phase.number,
      session.number
    )
    const startApproved = await this.handleCheckpoint(beforeStartCheckpoint)

    if (!startApproved) {
      return { success: false }
    }

    // Start the session
    startSession(this.state, phase.number, session.number)

    // RED PHASE: Write failing tests
    console.log('RED PHASE: Writing tests...')
    const redResult = await this.executor.executeRedPhase(this.state, phase, session)

    updateSession(this.state, phase.number, session.number, {
      tests_written: redResult.tests_written,
      tests_passing: 0,
      files_modified: redResult.files_modified,
      status: SessionStatus.RED_PHASE
    })

    // CHECKPOINT 2: AFTER_RED
    const afterRedCheckpoint = createAfterRedCheckpoint(
      this.state,
      phase.number,
      session.number,
      redResult.tests_written,
      redResult.tests_failing,
      redResult.files_modified,
      []  // TODO: Add code samples in Phase 3.2
    )
    const redApproved = await this.handleCheckpoint(afterRedCheckpoint)

    if (!redApproved) {
      return { success: false }
    }

    // GREEN PHASE: Implement to pass tests
    console.log('GREEN PHASE: Implementing...')
    const greenResult = await this.executor.executeGreenPhase(this.state, phase, session)

    updateSession(this.state, phase.number, session.number, {
      tests_passing: greenResult.tests_passing,
      coverage: greenResult.coverage,
      files_modified: [...redResult.files_modified, ...greenResult.files_modified],
      status: SessionStatus.GREEN_PHASE
    })

    // CHECKPOINT 3: AFTER_GREEN
    const afterGreenCheckpoint = createAfterGreenCheckpoint(
      this.state,
      phase.number,
      session.number,
      redResult.tests_written,
      greenResult.tests_passing,
      greenResult.coverage,
      [...redResult.files_modified, ...greenResult.files_modified],
      []  // TODO: Add code samples
    )
    const greenApproved = await this.handleCheckpoint(afterGreenCheckpoint)

    if (!greenApproved) {
      return { success: false }
    }

    // REFACTOR PHASE: Improve code quality
    console.log('REFACTOR PHASE: Refactoring...')
    const refactorResult = await this.executor.executeRefactorPhase(this.state, phase, session)

    updateSession(this.state, phase.number, session.number, {
      coverage: refactorResult.coverage,
      status: SessionStatus.REFACTOR_PHASE
    })

    // CHECKPOINT 4: AFTER_REFACTOR
    const afterRefactorCheckpoint = createAfterRefactorCheckpoint(
      this.state,
      phase.number,
      session.number,
      redResult.tests_written,
      greenResult.tests_passing,
      refactorResult.coverage,
      [...redResult.files_modified, ...greenResult.files_modified, ...refactorResult.files_modified],
      []  // TODO: Add code samples
    )
    const refactorApproved = await this.handleCheckpoint(afterRefactorCheckpoint)

    if (!refactorApproved) {
      return { success: false }
    }

    // CREATE COMMIT
    console.log('Creating git commit...')
    const commitHash = await this.executor.createCommit(this.state, phase, session)

    // Calculate actual hours
    const startTime = new Date(session.started_at!).getTime()
    const endTime = Date.now()
    const actualHours = Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10

    // Mark session complete
    markSessionComplete(this.state, phase.number, session.number, {
      tests_written: redResult.tests_written,
      tests_passing: greenResult.tests_passing,
      coverage: refactorResult.coverage,
      commit_hash: commitHash,
      actual_hours: actualHours,
      files_modified: [
        ...redResult.files_modified,
        ...greenResult.files_modified,
        ...refactorResult.files_modified
      ]
    })

    // CHECKPOINT 5: SESSION_COMPLETE
    const sessionCompleteCheckpoint = createSessionCompleteCheckpoint(
      this.state,
      phase.number,
      session.number,
      commitHash,
      actualHours
    )
    await this.handleCheckpoint(sessionCompleteCheckpoint)

    console.log(`\n✓ Session ${session.number} complete!\n`)

    return { success: true }
  }

  /**
   * Handle a checkpoint
   *
   * Displays checkpoint info and waits for user input.
   * In Phase 3.1, this is a placeholder that auto-approves.
   * In Phase 3.2+, this will integrate with Claude to get user approval.
   */
  private async handleCheckpoint(checkpointData: CheckpointData): Promise<boolean> {
    // Activate checkpoint in state
    activateCheckpoint(this.state!, checkpointData)

    // Display checkpoint
    const display = formatCheckpointForDisplay(checkpointData)
    console.log(display)

    // TODO: In Phase 3.2+, integrate with Claude to get user input
    // For now, auto-approve if auto_continue is enabled
    if (this.config.auto_continue) {
      console.log('[AUTO-CONTINUE] Automatically proceeding...\n')
      return true
    }

    // In Phase 3.1, this is a placeholder
    console.log('[PLACEHOLDER] Checkpoint activated. In Phase 3.2+, will wait for user input.\n')
    return true
  }

  /**
   * Get current execution progress
   */
  getProgress(): {
    total_sessions: number
    completed_sessions: number
    completion_percentage: number
    estimated_hours_remaining: number
  } | null {
    if (!this.state) {
      return null
    }

    return getProgress(this.state)
  }

  /**
   * Get current state
   */
  getState(): AgentState | null {
    return this.state
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  OrchestratorConfig,
  ExecutionResult,
  SessionExecutor
}
