// src/tools/github/syncWithGitHub.ts
/**
 * Synchronize project state between local .agent-state.json and GitHub.
 *
 * This tool provides bidirectional sync capabilities:
 * - Pull: Fetch GitHub issue states → update local state
 * - Push: Read local state → update GitHub issues
 * - Bidirectional: Sync both ways with conflict detection
 *
 * @module syncWithGitHub
 */

import { Octokit } from "@octokit/rest";
import * as fs from "fs/promises";
import {
  SyncWithGitHubParams,
  SyncWithGitHubResult,
  SyncUpdate,
  SyncConflict,
} from "../../types/tools.js";
import { AgentState } from "../../types/common.js";

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  labels: Array<{ name: string }>;
  created_at: string;
  closed_at?: string;
}

type SessionStatus = "not_started" | "in_progress" | "completed" | "blocked";

interface SessionState {
  sessionNumber: number;
  issueNumber: number;
  status: SessionStatus;
}

/**
 * Synchronize project state between local .agent-state.json and GitHub.
 *
 * @param params - Sync parameters
 * @param params.owner - GitHub repository owner
 * @param params.repo - GitHub repository name
 * @param params.direction - Sync direction: 'pull', 'push', or 'bidirectional'
 * @param params.statePath - Path to .agent-state.json file
 * @returns Sync result with updates, conflicts, and errors
 */
export async function syncWithGitHub(
  params: SyncWithGitHubParams
): Promise<SyncWithGitHubResult> {
  const { owner, repo, direction, statePath } = params;
  const updates: SyncUpdate[] = [];
  const conflicts: SyncConflict[] = [];
  const errors: string[] = [];

  let localState: AgentState | null = null;
  let githubSessions: SessionState[] = [];

  try {
    // Initialize Octokit
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // Fetch GitHub issues
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: "all",
      per_page: 100,
    });

    // Parse GitHub issues into session states
    githubSessions = parseGitHubIssues(issues as GitHubIssue[]);

    // Try to read local state
    localState = await readLocalState(statePath);

    // For bidirectional sync, detect conflicts FIRST (before pull overwrites local state)
    if (direction === "bidirectional") {
      const detectedConflicts = detectConflicts(localState, githubSessions);
      conflicts.push(...detectedConflicts);
    }

    // Perform sync based on direction
    if (direction === "pull" || direction === "bidirectional") {
      const pullResult = performPullSync(localState, githubSessions, owner, repo);

      // For bidirectional, filter out conflicting updates
      if (direction === "bidirectional") {
        const conflictSessions = new Set(conflicts.map(c => c.sessionNumber));
        const nonConflictingUpdates = pullResult.updates.filter(
          u => !conflictSessions.has(u.sessionNumber)
        );
        updates.push(...nonConflictingUpdates);
      } else {
        updates.push(...pullResult.updates);
      }

      localState = pullResult.updatedState;
    }

    if (direction === "push" || direction === "bidirectional") {
      const pushResult = await performPushSync(
        localState,
        githubSessions,
        octokit,
        owner,
        repo
      );

      // For bidirectional, filter out conflicting updates
      if (direction === "bidirectional") {
        const conflictSessions = new Set(conflicts.map(c => c.sessionNumber));
        const nonConflictingUpdates = pushResult.updates.filter(
          u => !conflictSessions.has(u.sessionNumber)
        );
        updates.push(...nonConflictingUpdates);
      } else {
        updates.push(...pushResult.updates);
      }
    }

    // Update lastCheckpoint
    if (localState) {
      localState.lastCheckpoint = new Date();
    }

    // Write updated local state
    await writeLocalState(statePath, localState);

    return {
      success: true,
      direction,
      sessionsSynced: updates.length,
      updates,
      conflicts,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);

    return {
      success: false,
      direction,
      sessionsSynced: 0,
      updates,
      conflicts,
      errors,
    };
  }
}

/**
 * Parse GitHub issues into session states
 */
function parseGitHubIssues(issues: GitHubIssue[]): SessionState[] {
  const sessions: SessionState[] = [];

  for (const issue of issues) {
    // Extract session number from title (e.g., "Session 1: Project Setup")
    const match = issue.title.match(/^Session\s+(\d+):/i);
    if (!match) continue;

    const sessionNumber = parseInt(match[1], 10);
    const status = determineStatusFromIssue(issue);

    sessions.push({
      sessionNumber,
      issueNumber: issue.number,
      status,
    });
  }

  return sessions.sort((a, b) => a.sessionNumber - b.sessionNumber);
}

/**
 * Determine session status from GitHub issue state and labels
 */
function determineStatusFromIssue(issue: GitHubIssue): SessionStatus {
  if (issue.state === "closed") {
    return "completed";
  }

  const labelNames = issue.labels.map(l => l.name.toLowerCase());

  if (labelNames.includes("blocked")) {
    return "blocked";
  }

  if (labelNames.includes("in-progress")) {
    return "in_progress";
  }

  return "not_started";
}

/**
 * Read local agent state from file
 */
async function readLocalState(statePath?: string): Promise<AgentState | null> {
  if (!statePath) return null;

  try {
    const content = await fs.readFile(statePath, "utf-8");
    return JSON.parse(content) as AgentState;
  } catch {
    // File doesn't exist or invalid JSON - return null
    return null;
  }
}

/**
 * Write local agent state to file
 */
async function writeLocalState(
  statePath: string | undefined,
  state: AgentState | null
): Promise<void> {
  if (!statePath || !state) return;

  await fs.writeFile(statePath, JSON.stringify(state, null, 2), "utf-8");
}

/**
 * Build issue mapping from session number to issue number
 */
function buildIssueMapping(sessions: SessionState[]): Record<number, number> {
  const mapping: Record<number, number> = {};
  for (const session of sessions) {
    mapping[session.sessionNumber] = session.issueNumber;
  }
  return mapping;
}

/**
 * Perform pull sync: GitHub → Local
 */
function performPullSync(
  localState: AgentState | null,
  githubSessions: SessionState[],
  owner: string,
  repo: string
): { updates: SyncUpdate[]; updatedState: AgentState } {
  const updates: SyncUpdate[] = [];

  // Create or update local state
  const updatedState: AgentState = localState || createEmptyState(owner, repo);

  // Update github info and issue mapping
  updatedState.github = {
    owner,
    repo,
    issueMapping: buildIssueMapping(githubSessions),
    prMapping: updatedState.github?.prMapping || {},
  };
  updatedState.github!.issueMapping = buildIssueMapping(githubSessions);

  // Track completed sessions
  const completedFromGitHub = new Set<number>();
  const blockedFromGitHub = new Set<number>();
  let inProgressFromGitHub: number | undefined;

  for (const session of githubSessions) {
    if (session.status === "completed") {
      completedFromGitHub.add(session.sessionNumber);
    } else if (session.status === "blocked") {
      blockedFromGitHub.add(session.sessionNumber);
    } else if (session.status === "in_progress" && !inProgressFromGitHub) {
      inProgressFromGitHub = session.sessionNumber;
    }
  }

  // Check for sessions completed on GitHub but not locally
  for (const sessionNum of completedFromGitHub) {
    if (!updatedState.completedSessions.includes(sessionNum)) {
      updates.push({
        sessionNumber: sessionNum,
        field: "status",
        oldValue: "not_started",
        newValue: "completed",
        source: "github",
      });
    }
  }

  // Check for blocked sessions on GitHub
  for (const sessionNum of blockedFromGitHub) {
    if (!updatedState.blockedSessions.includes(sessionNum)) {
      updates.push({
        sessionNumber: sessionNum,
        field: "status",
        oldValue: updatedState.completedSessions.includes(sessionNum)
          ? "completed"
          : "not_started",
        newValue: "blocked",
        source: "github",
      });
    }
  }

  // Update local state arrays
  updatedState.completedSessions = Array.from(completedFromGitHub).sort(
    (a, b) => a - b
  );
  updatedState.blockedSessions = Array.from(blockedFromGitHub).sort(
    (a, b) => a - b
  );
  updatedState.inProgress = inProgressFromGitHub;

  // Update overall status
  if (completedFromGitHub.size === githubSessions.length && githubSessions.length > 0) {
    updatedState.status = "completed";
  } else if (completedFromGitHub.size > 0 || inProgressFromGitHub) {
    updatedState.status = "in_progress";
  }

  return { updates, updatedState };
}

/**
 * Perform push sync: Local → GitHub
 */
async function performPushSync(
  localState: AgentState | null,
  githubSessions: SessionState[],
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ updates: SyncUpdate[] }> {
  const updates: SyncUpdate[] = [];

  if (!localState) {
    return { updates };
  }

  const githubSessionMap = new Map<number, SessionState>();
  for (const session of githubSessions) {
    githubSessionMap.set(session.sessionNumber, session);
  }

  // Check for sessions that need updating on GitHub
  for (const sessionNum of localState.completedSessions) {
    const ghSession = githubSessionMap.get(sessionNum);
    if (ghSession && ghSession.status !== "completed") {
      // Close the issue on GitHub
      try {
        await octokit.issues.update({
          owner,
          repo,
          issue_number: ghSession.issueNumber,
          state: "closed",
        });
        updates.push({
          sessionNumber: sessionNum,
          field: "status",
          oldValue: ghSession.status,
          newValue: "completed",
          source: "local",
        });
      } catch {
        // Ignore errors for individual updates
      }
    }
  }

  // Add blocked labels for locally blocked sessions
  for (const sessionNum of localState.blockedSessions) {
    const ghSession = githubSessionMap.get(sessionNum);
    if (ghSession && ghSession.status !== "blocked") {
      try {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: ghSession.issueNumber,
          labels: ["blocked"],
        });
        updates.push({
          sessionNumber: sessionNum,
          field: "status",
          oldValue: ghSession.status,
          newValue: "blocked",
          source: "local",
        });
      } catch {
        // Ignore errors
      }
    }
  }

  // Add in-progress label for locally in-progress session
  if (localState.inProgress) {
    const ghSession = githubSessionMap.get(localState.inProgress);
    if (ghSession && ghSession.status !== "in_progress") {
      try {
        await octokit.issues.addLabels({
          owner,
          repo,
          issue_number: ghSession.issueNumber,
          labels: ["in-progress"],
        });
        updates.push({
          sessionNumber: localState.inProgress,
          field: "status",
          oldValue: ghSession.status,
          newValue: "in_progress",
          source: "local",
        });
      } catch {
        // Ignore errors
      }
    }
  }

  return { updates };
}

/**
 * Detect conflicts between local and GitHub states
 */
function detectConflicts(
  localState: AgentState | null,
  githubSessions: SessionState[]
): SyncConflict[] {
  const conflicts: SyncConflict[] = [];

  if (!localState) {
    return conflicts;
  }

  const githubSessionMap = new Map<number, SessionState>();
  for (const session of githubSessions) {
    githubSessionMap.set(session.sessionNumber, session);
  }

  // Check for status conflicts
  for (const sessionNum of localState.completedSessions) {
    const ghSession = githubSessionMap.get(sessionNum);
    if (ghSession && ghSession.status !== "completed") {
      conflicts.push({
        sessionNumber: sessionNum,
        field: "status",
        localValue: "completed",
        githubValue: ghSession.status,
      });
    }
  }

  // Check blocked conflicts
  for (const sessionNum of localState.blockedSessions) {
    const ghSession = githubSessionMap.get(sessionNum);
    if (ghSession && ghSession.status !== "blocked") {
      // Only conflict if GitHub has a different non-not_started status
      if (ghSession.status !== "not_started") {
        conflicts.push({
          sessionNumber: sessionNum,
          field: "status",
          localValue: "blocked",
          githubValue: ghSession.status,
        });
      }
    }
  }

  return conflicts;
}

/**
 * Create an empty agent state
 */
function createEmptyState(owner: string, repo: string): AgentState {
  return {
    projectName: repo,
    currentPhase: 1,
    currentSession: 1,
    completedSessions: [],
    blockedSessions: [],
    lastCheckpoint: new Date(),
    status: "not_started",
    github: {
      owner,
      repo,
      issueMapping: {},
      prMapping: {},
    },
    metrics: {
      totalTests: 0,
      avgCoverage: 0,
      timeSpent: "0h",
      velocity: 0,
    },
  };
}
