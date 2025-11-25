/**
 * Phase Orchestrator
 *
 * Higher-level orchestrator that manages execution of entire phases.
 * Coordinates multiple session executors, handles dependencies, and enables parallelization.
 *
 * @see execution-orchestrator.ts for SessionExecutor interface
 * @see backend-executor.ts, frontend-executor.ts, mobile-executor.ts, e2e-executor.ts
 */

import type { AgentState, Phase, Session, Checkpoint } from './types'
import type { SessionExecutor } from './execution-orchestrator'
import { BackendExecutor } from './backend-executor'
import { FrontendExecutor } from './frontend-executor'
import { MobileExecutor } from './mobile-executor'
import { E2EExecutor } from './e2e-executor'

// ============================================================================
// Types
// ============================================================================

interface PhaseExecutionResult {
  phase_number: number
  sessions_completed: number
  sessions_failed: number
  total_tests: number
  average_coverage: number
  total_time_hours: number
  commit_hashes: string[]
  errors: SessionError[]
}

interface SessionError {
  session_number: number
  session_title: string
  error: string
  retry_count: number
}

interface ParallelGroup {
  sessions: Session[]
  can_run: boolean // All dependencies met
}

// ============================================================================
// Phase Orchestrator
// ============================================================================

export class PhaseOrchestrator {
  private backendExecutor: BackendExecutor
  private frontendExecutor: FrontendExecutor
  private mobileExecutor: MobileExecutor
  private e2eExecutor: E2EExecutor

  constructor() {
    this.backendExecutor = new BackendExecutor()
    this.frontendExecutor = new FrontendExecutor()
    this.mobileExecutor = new MobileExecutor()
    this.e2eExecutor = new E2EExecutor()
  }

  /**
   * Execute an entire phase with dependency-aware parallelization
   */
  async executePhase(
    state: AgentState,
    phaseNumber: number,
    options: {
      parallel?: boolean // Default: true
      maxConcurrent?: number // Default: 3
      stopOnError?: boolean // Default: false
    } = {}
  ): Promise<PhaseExecutionResult> {
    const { parallel = true, maxConcurrent = 3, stopOnError = false } = options

    // Find phase
    const phase = state.phases.find(p => p.number === phaseNumber)
    if (!phase) {
      throw new Error(`Phase ${phaseNumber} not found`)
    }

    console.log(`\n[PHASE ORCHESTRATOR] Starting Phase ${phase.number}: ${phase.name}\n`)

    // Show phase-level checkpoint
    await this.showPhaseStartCheckpoint(state, phase)

    // Initialize result tracking
    const result: PhaseExecutionResult = {
      phase_number: phaseNumber,
      sessions_completed: 0,
      sessions_failed: 0,
      total_tests: 0,
      average_coverage: 0,
      total_time_hours: 0,
      commit_hashes: [],
      errors: []
    }

    // Build dependency graph
    const dependencyGraph = this.buildDependencyGraph(phase)

    // Execute sessions in dependency order with parallelization
    if (parallel) {
      await this.executeParallel(state, phase, dependencyGraph, maxConcurrent, stopOnError, result)
    } else {
      await this.executeSequential(state, phase, result)
    }

    // Show phase-level completion checkpoint
    await this.showPhaseCompleteCheckpoint(state, phase, result)

    // Calculate final metrics
    result.average_coverage = this.calculateAverageCoverage(phase)

    console.log(`\n[PHASE ORCHESTRATOR] Phase ${phase.number} complete!\n`)

    return result
  }

  /**
   * Execute sessions sequentially (fallback mode)
   */
  private async executeSequential(
    state: AgentState,
    phase: Phase,
    result: PhaseExecutionResult
  ): Promise<void> {
    for (const session of phase.sessions) {
      if (session.status === 'completed') {
        console.log(`[SKIP] Session ${session.number} already completed`)
        continue
      }

      try {
        await this.executeSession(state, phase, session)
        result.sessions_completed++
        result.total_tests += session.tests_passing
        result.total_time_hours += session.actual_hours
        if (session.commit_hash) {
          result.commit_hashes.push(session.commit_hash)
        }
      } catch (error) {
        result.sessions_failed++
        result.errors.push({
          session_number: session.number,
          session_title: session.title,
          error: error instanceof Error ? error.message : String(error),
          retry_count: session.retry_count
        })
      }
    }
  }

  /**
   * Execute sessions in parallel based on dependencies
   */
  private async executeParallel(
    state: AgentState,
    phase: Phase,
    dependencyGraph: Map<number, number[]>,
    maxConcurrent: number,
    stopOnError: boolean,
    result: PhaseExecutionResult
  ): Promise<void> {
    const completed = new Set<number>()
    const failed = new Set<number>()
    const inProgress = new Set<number>()

    while (completed.size + failed.size < phase.sessions.length) {
      // Find sessions that can run now
      const runnableSessions = this.findRunnableSessions(
        phase,
        dependencyGraph,
        completed,
        failed,
        inProgress
      )

      if (runnableSessions.length === 0) {
        // No runnable sessions - check if we're waiting on in-progress sessions
        if (inProgress.size > 0) {
          // Wait for in-progress sessions to complete
          await this.sleep(1000)
          continue
        } else {
          // Deadlock or all remaining sessions are blocked by failures
          console.log('[ORCHESTRATOR] No more runnable sessions. Stopping.')
          break
        }
      }

      // Limit concurrent execution
      const sessionsToRun = runnableSessions.slice(0, maxConcurrent - inProgress.size)

      // Execute sessions in parallel
      const promises = sessionsToRun.map(async session => {
        inProgress.add(session.number)

        try {
          console.log(`[START] Session ${session.number}: ${session.title}`)
          await this.executeSession(state, phase, session)

          completed.add(session.number)
          result.sessions_completed++
          result.total_tests += session.tests_passing
          result.total_time_hours += session.actual_hours
          if (session.commit_hash) {
            result.commit_hashes.push(session.commit_hash)
          }

          console.log(`[COMPLETE] Session ${session.number}: ${session.title}`)
        } catch (error) {
          failed.add(session.number)
          result.sessions_failed++
          result.errors.push({
            session_number: session.number,
            session_title: session.title,
            error: error instanceof Error ? error.message : String(error),
            retry_count: session.retry_count
          })

          console.log(`[FAILED] Session ${session.number}: ${session.title}`)

          if (stopOnError) {
            throw error
          }
        } finally {
          inProgress.delete(session.number)
        }
      })

      // Wait for this batch to complete
      await Promise.allSettled(promises)
    }
  }

  /**
   * Find sessions that can run now (dependencies met, not completed/failed/in-progress)
   */
  private findRunnableSessions(
    phase: Phase,
    dependencyGraph: Map<number, number[]>,
    completed: Set<number>,
    failed: Set<number>,
    inProgress: Set<number>
  ): Session[] {
    return phase.sessions.filter(session => {
      // Skip if already completed, failed, or in progress
      if (completed.has(session.number) ||
          failed.has(session.number) ||
          inProgress.has(session.number)) {
        return false
      }

      // Check if all dependencies are completed
      const dependencies = dependencyGraph.get(session.number) || []
      const allDependenciesMet = dependencies.every(dep => completed.has(dep))

      // Check if any dependency failed
      const anyDependencyFailed = dependencies.some(dep => failed.has(dep))

      return allDependenciesMet && !anyDependencyFailed
    })
  }

  /**
   * Build dependency graph from session depends_on arrays
   */
  private buildDependencyGraph(phase: Phase): Map<number, number[]> {
    const graph = new Map<number, number[]>()

    for (const session of phase.sessions) {
      graph.set(session.number, session.depends_on)
    }

    return graph
  }

  /**
   * Execute a single session using appropriate executor
   */
  private async executeSession(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<void> {
    const executor = this.getExecutorForSession(phase, session)

    // Execute RED phase
    const redResult = await executor.executeRedPhase(state, phase, session)
    session.tests_written = redResult.tests_written
    session.tests_failing = redResult.tests_failing
    session.files_modified = redResult.files_modified

    // Execute GREEN phase
    const greenResult = await executor.executeGreenPhase(state, phase, session)
    session.tests_passing = greenResult.tests_passing
    session.coverage = greenResult.coverage
    session.files_modified = [...session.files_modified, ...greenResult.files_modified]

    // Execute REFACTOR phase
    const refactorResult = await executor.executeRefactorPhase(state, phase, session)
    session.files_modified = [...session.files_modified, ...refactorResult.files_modified]
    session.coverage = refactorResult.coverage

    // Create commit
    const commitHash = await executor.createCommit(state, phase, session)
    session.commit_hash = commitHash
    session.status = 'completed'
  }

  /**
   * Get appropriate executor for session type
   */
  private getExecutorForSession(phase: Phase, session: Session): SessionExecutor {
    const phaseName = phase.name.toLowerCase()
    const sessionTitle = session.title.toLowerCase()

    // E2E detection (most specific, check first)
    if (phaseName.includes('e2e') || phaseName.includes('integration') || phaseName.includes('testing') ||
        sessionTitle.includes('e2e') || sessionTitle.includes('integration') ||
        sessionTitle.includes('playwright') || sessionTitle.includes('performance')) {
      return this.e2eExecutor
    }

    // Mobile detection
    if (phaseName.includes('mobile') ||
        sessionTitle.includes('screen') || sessionTitle.includes('navigation') ||
        sessionTitle.includes('react native') || sessionTitle.includes('expo')) {
      return this.mobileExecutor
    }

    // Frontend detection
    if (phaseName.includes('frontend') ||
        sessionTitle.includes('component') || sessionTitle.includes('composable') ||
        sessionTitle.includes('view') || sessionTitle.includes('schema')) {
      return this.frontendExecutor
    }

    // Backend detection (default)
    return this.backendExecutor
  }

  /**
   * Calculate average coverage across all sessions
   */
  private calculateAverageCoverage(phase: Phase): number {
    const completedSessions = phase.sessions.filter(s => s.status === 'completed')
    if (completedSessions.length === 0) return 0

    const totalCoverage = completedSessions.reduce((sum, s) => sum + s.coverage, 0)
    return Math.round(totalCoverage / completedSessions.length)
  }

  /**
   * Show phase start checkpoint
   */
  private async showPhaseStartCheckpoint(state: AgentState, phase: Phase): Promise<void> {
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│ CHECKPOINT: PHASE START                                     │
│ Phase ${phase.number}: ${phase.name}                                  │
└─────────────────────────────────────────────────────────────┘

I will now execute all sessions in this phase:

${phase.sessions.map(s => `  ${s.status === 'completed' ? '✓' : '○'} Session ${s.number}: ${s.title} (${s.estimated_hours}h)`).join('\n')}

Parallelization: Enabled
- Sessions with no dependencies will run concurrently
- Max 3 sessions at a time
- Total estimated time: ${phase.estimated_hours}h (may be faster with parallelization!)

What would you like to do?

1. ✅ Start Phase (proceed with execution)
2. ⏭️  Skip Phase
3. ⏸️  Pause
`)

    // TODO: Actual user input handling (for now, auto-proceed)
    console.log('[AUTO] Proceeding with phase execution...\n')
  }

  /**
   * Show phase completion checkpoint
   */
  private async showPhaseCompleteCheckpoint(
    state: AgentState,
    phase: Phase,
    result: PhaseExecutionResult
  ): Promise<void> {
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│ ✓ PHASE ${phase.number} COMPLETE: ${phase.name}                       │
│                                                              │
│ Sessions: ${result.sessions_completed}/${phase.sessions.length} completed                                 │
│ Tests: ${result.total_tests} passing                                  │
│ Coverage: ${result.average_coverage}% average                                │
│ Time: ${result.total_time_hours}h (estimated: ${phase.estimated_hours}h)                     │
│ Commits: ${result.commit_hashes.length} created                                     │
└─────────────────────────────────────────────────────────────┘

${result.errors.length > 0 ? `
⚠️  Errors encountered:
${result.errors.map(e => `  - Session ${e.session_number}: ${e.error}`).join('\n')}
` : ''}

What would you like to do?

1. ✅ Continue to next phase
2. 📊 Show overall progress
3. ⏸️  Pause execution
`)

    // TODO: Actual user input handling
    console.log('[AUTO] Phase complete!\n')
  }

  /**
   * Sleep helper for waiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Analyze phase for parallelization opportunities
   */
  analyzeParallelization(phase: Phase): {
    sequential_sessions: number[]
    parallel_groups: ParallelGroup[]
    max_parallelism: number
    estimated_time_sequential: number
    estimated_time_parallel: number
  } {
    const dependencyGraph = this.buildDependencyGraph(phase)

    // Find sessions with no dependencies (can start immediately)
    const noDependencies = phase.sessions.filter(s => s.depends_on.length === 0)

    // Build parallel groups (sessions that can run together)
    const parallelGroups: ParallelGroup[] = []
    const processed = new Set<number>()

    // Group 1: No dependencies
    if (noDependencies.length > 0) {
      parallelGroups.push({
        sessions: noDependencies,
        can_run: true
      })
      noDependencies.forEach(s => processed.add(s.number))
    }

    // Find subsequent groups
    while (processed.size < phase.sessions.length) {
      const nextGroup = phase.sessions.filter(session => {
        if (processed.has(session.number)) return false
        const allDependenciesMet = session.depends_on.every(dep => processed.has(dep))
        return allDependenciesMet
      })

      if (nextGroup.length === 0) break

      parallelGroups.push({
        sessions: nextGroup,
        can_run: false // Will be true once previous group completes
      })
      nextGroup.forEach(s => processed.add(s.number))
    }

    // Calculate max parallelism
    const maxParallelism = Math.max(...parallelGroups.map(g => g.sessions.length))

    // Calculate estimated times
    const estimatedTimeSequential = phase.sessions.reduce((sum, s) => sum + s.estimated_hours, 0)
    const estimatedTimeParallel = parallelGroups.reduce((sum, group) => {
      const maxTimeInGroup = Math.max(...group.sessions.map(s => s.estimated_hours))
      return sum + maxTimeInGroup
    }, 0)

    return {
      sequential_sessions: phase.sessions.filter(s => s.depends_on.length > 0).map(s => s.number),
      parallel_groups: parallelGroups,
      max_parallelism: maxParallelism,
      estimated_time_sequential: estimatedTimeSequential,
      estimated_time_parallel: estimatedTimeParallel
    }
  }
}
