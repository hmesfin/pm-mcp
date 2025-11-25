/**
 * Plan Parser
 *
 * Parses PROJECT_PLAN.md markdown files into structured Phase and Session data
 * that can be used to initialize AgentState.
 *
 * @see agent-state-schema.md for state structure
 */

import * as fs from 'fs'
import * as path from 'path'
import type { Phase, Session } from './types'
import { PhaseStatus, SessionStatus } from './types'

// ============================================================================
// Types
// ============================================================================

interface ParsedSession {
  number: number
  title: string
  estimated_hours: number
  test_count: number
  phase_number: number
}

interface DependencyEdge {
  from: number  // Session number
  to: number    // Session number
}

// ============================================================================
// Parsing Configuration
// ============================================================================

const PHASE_REGEX = /^### Phase (\d+): (.+?) \(Sessions? ([\d\-,]+)\)$/
const SESSION_REGEX = /^#### Session (\d+): (.+?)(?:\s+\(TDD\))?$/
const ESTIMATED_TIME_REGEX = /^-\s+\*\*Estimated Time\*\*:\s+([\d.]+)\s+hours?$/
const TESTS_REGEX = /^-\s+\*\*Tests\*\*:\s+~?(\d+)\s+tests?$/
const MERMAID_SESSION_REGEX = /^\s+S(\d+)\[Session \d+:/
const MERMAID_DEPENDENCY_REGEX = /^\s+S(\d+)\s+-->\s+S(\d+)$/

// ============================================================================
// Main Parser Functions
// ============================================================================

/**
 * Parse a PROJECT_PLAN.md file into Phase and Session structures
 *
 * @param planPath - Path to PROJECT_PLAN.md file
 * @returns Array of Phase objects ready for AgentState
 */
export function parsePlan(planPath: string): Phase[] {
  if (!fs.existsSync(planPath)) {
    throw new Error(`Plan file not found: ${planPath}`)
  }

  const content = fs.readFileSync(planPath, 'utf-8')
  const lines = content.split('\n')

  // First pass: Parse phases and sessions
  const sessions = parseSessionsFromContent(lines)

  // Second pass: Parse dependencies from Mermaid graph
  const dependencies = parseDependenciesFromMermaid(lines)

  // Third pass: Build Phase structures
  const phases = buildPhases(sessions, dependencies)

  return phases
}

/**
 * Parse a plan for a specific app type from templates directory
 *
 * @param appType - Type of app (blog, ecommerce, saas, social, projectmanagement)
 * @returns Array of Phase objects
 */
export function parsePlanForApp(appType: string): Phase[] {
  const planPath = path.join(
    process.cwd(),
    '.claude',
    'templates',
    appType,
    'PROJECT_PLAN.md'
  )
  return parsePlan(planPath)
}

// ============================================================================
// Session Parsing
// ============================================================================

/**
 * Parse sessions from plan content
 *
 * Extracts session number, title, estimated hours, and test count.
 */
function parseSessionsFromContent(lines: string[]): ParsedSession[] {
  const sessions: ParsedSession[] = []
  let currentPhaseNumber = 0
  let currentSession: Partial<ParsedSession> | null = null

  for (const line of lines) {
    // Check for phase header
    const phaseMatch = line.match(PHASE_REGEX)
    if (phaseMatch) {
      currentPhaseNumber = parseInt(phaseMatch[1], 10)
      continue
    }

    // Check for session header
    const sessionMatch = line.match(SESSION_REGEX)
    if (sessionMatch) {
      // Save previous session if exists
      if (currentSession && isCompleteSession(currentSession)) {
        sessions.push(currentSession as ParsedSession)
      }

      // Start new session
      currentSession = {
        number: parseInt(sessionMatch[1], 10),
        title: sessionMatch[2].trim(),
        phase_number: currentPhaseNumber,
        estimated_hours: 0,
        test_count: 0
      }
      continue
    }

    // Extract estimated time
    const timeMatch = line.match(ESTIMATED_TIME_REGEX)
    if (timeMatch && currentSession) {
      currentSession.estimated_hours = parseFloat(timeMatch[1])
      continue
    }

    // Extract test count
    const testsMatch = line.match(TESTS_REGEX)
    if (testsMatch && currentSession) {
      currentSession.test_count = parseInt(testsMatch[1], 10)
      continue
    }
  }

  // Don't forget the last session
  if (currentSession && isCompleteSession(currentSession)) {
    sessions.push(currentSession as ParsedSession)
  }

  return sessions
}

/**
 * Check if a parsed session has all required fields
 */
function isCompleteSession(session: Partial<ParsedSession>): session is ParsedSession {
  return !!(
    session.number &&
    session.title &&
    session.phase_number &&
    session.estimated_hours !== undefined
  )
}

// ============================================================================
// Dependency Parsing
// ============================================================================

/**
 * Parse dependencies from Mermaid flowchart
 *
 * Extracts edges like "S1 --> S2" meaning S2 depends on S1.
 */
function parseDependenciesFromMermaid(lines: string[]): DependencyEdge[] {
  const dependencies: DependencyEdge[] = []
  let inMermaidBlock = false

  for (const line of lines) {
    // Check for start of mermaid block
    if (line.trim().startsWith('```mermaid')) {
      inMermaidBlock = true
      continue
    }

    // Check for end of mermaid block
    if (line.trim() === '```' && inMermaidBlock) {
      inMermaidBlock = false
      continue
    }

    // Parse dependency edges within mermaid block
    if (inMermaidBlock) {
      const depMatch = line.match(MERMAID_DEPENDENCY_REGEX)
      if (depMatch) {
        const from = parseInt(depMatch[1], 10)
        const to = parseInt(depMatch[2], 10)
        dependencies.push({ from, to })
      }
    }
  }

  return dependencies
}

// ============================================================================
// Phase Building
// ============================================================================

/**
 * Build Phase structures from parsed sessions and dependencies
 *
 * Groups sessions by phase and adds dependency information.
 */
function buildPhases(
  parsedSessions: ParsedSession[],
  dependencies: DependencyEdge[]
): Phase[] {
  // Group sessions by phase
  const sessionsByPhase = new Map<number, ParsedSession[]>()

  for (const session of parsedSessions) {
    if (!sessionsByPhase.has(session.phase_number)) {
      sessionsByPhase.set(session.phase_number, [])
    }
    sessionsByPhase.get(session.phase_number)!.push(session)
  }

  // Build dependency maps
  const dependsOnMap = buildDependencyMap(dependencies)
  const blocksMap = buildBlocksMap(dependencies)

  // Build Phase objects
  const phases: Phase[] = []

  for (const [phaseNumber, sessions] of sessionsByPhase) {
    // Determine phase name from first session
    const phaseName = inferPhaseName(phaseNumber)

    const phaseSessions: Session[] = sessions.map(s => ({
      number: s.number,
      title: s.title,
      status: SessionStatus.NOT_STARTED,

      started_at: null,
      completed_at: null,
      estimated_hours: s.estimated_hours,
      actual_hours: null,

      checkpoint: null,
      current_tdd_phase: null,

      tests_written: 0,
      tests_passing: 0,
      coverage: null,

      commit_hash: null,
      branch: null,

      files_modified: [],

      depends_on: dependsOnMap.get(s.number) || [],
      blocks: blocksMap.get(s.number) || [],

      errors: [],
      retry_count: 0
    }))

    phases.push({
      number: phaseNumber,
      name: phaseName,
      status: PhaseStatus.NOT_STARTED,
      sessions: phaseSessions,
      started_at: null,
      completed_at: null
    })
  }

  return phases.sort((a, b) => a.number - b.number)
}

/**
 * Build map of session number -> sessions it depends on
 */
function buildDependencyMap(edges: DependencyEdge[]): Map<number, number[]> {
  const map = new Map<number, number[]>()

  for (const edge of edges) {
    if (!map.has(edge.to)) {
      map.set(edge.to, [])
    }
    map.get(edge.to)!.push(edge.from)
  }

  // Sort each dependency list
  for (const deps of map.values()) {
    deps.sort((a, b) => a - b)
  }

  return map
}

/**
 * Build map of session number -> sessions it blocks
 */
function buildBlocksMap(edges: DependencyEdge[]): Map<number, number[]> {
  const map = new Map<number, number[]>()

  for (const edge of edges) {
    if (!map.has(edge.from)) {
      map.set(edge.from, [])
    }
    map.get(edge.from)!.push(edge.to)
  }

  // Sort each blocks list
  for (const blocks of map.values()) {
    blocks.sort((a, b) => a - b)
  }

  return map
}

/**
 * Infer phase name from phase number
 *
 * This is a fallback. Ideally we'd parse the phase name from the markdown,
 * but for now we use conventional names.
 */
function inferPhaseName(phaseNumber: number): string {
  const names: Record<number, string> = {
    1: "Backend Foundation",
    2: "Frontend Foundation",
    3: "Advanced Features",
    4: "Integration & Polish"
  }

  return names[phaseNumber] || `Phase ${phaseNumber}`
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validate parsed plan for common issues
 *
 * Checks for:
 * - Missing sessions (gaps in session numbers)
 * - Circular dependencies
 * - Invalid dependency references
 *
 * @param phases - Parsed phases to validate
 * @throws Error if validation fails
 */
export function validatePlan(phases: Phase[]): void {
  const allSessions = phases.flatMap(p => p.sessions)
  const sessionNumbers = new Set(allSessions.map(s => s.number))

  // Check for gaps in session numbers
  const maxSession = Math.max(...sessionNumbers)
  for (let i = 1; i <= maxSession; i++) {
    if (!sessionNumbers.has(i)) {
      throw new Error(`Missing session ${i} in plan`)
    }
  }

  // Check for invalid dependency references
  for (const session of allSessions) {
    for (const dep of session.depends_on) {
      if (!sessionNumbers.has(dep)) {
        throw new Error(
          `Session ${session.number} depends on non-existent session ${dep}`
        )
      }
    }

    for (const block of session.blocks) {
      if (!sessionNumbers.has(block)) {
        throw new Error(
          `Session ${session.number} blocks non-existent session ${block}`
        )
      }
    }
  }

  // Check for circular dependencies (simple check - no session should depend on itself transitively)
  for (const session of allSessions) {
    const visited = new Set<number>()
    const queue = [...session.depends_on]

    while (queue.length > 0) {
      const dep = queue.shift()!

      if (dep === session.number) {
        throw new Error(`Circular dependency detected involving session ${session.number}`)
      }

      if (visited.has(dep)) {
        continue
      }

      visited.add(dep)

      const depSession = allSessions.find(s => s.number === dep)
      if (depSession) {
        queue.push(...depSession.depends_on)
      }
    }
  }
}

// ============================================================================
// Exports
// ============================================================================

export { ParsedSession, DependencyEdge }
