// src/services/cicdService.ts
/**
 * CI/CD integration service for automatic session status updates.
 *
 * This module provides:
 * - PR-to-session linking via branch name, title, or body
 * - Automatic status updates on PR merge
 * - GitHub Actions workflow generation
 * - Label management for session status
 *
 * @module cicdService
 */

import type { SessionStatus } from '../types/common.js';

// ============================================================================
// TYPES
// ============================================================================

export interface SessionLinkResult {
  found: boolean;
  sessionNumber?: number;
  source?: 'branch' | 'title' | 'body';
}

export interface PRInfo {
  prNumber: number;
  branch: string;
  title: string;
  body?: string;
}

export interface PRMergeEvent {
  owner: string;
  repo: string;
  prNumber: number;
  branch: string;
  title: string;
  body?: string;
  mergedBy: string;
  mergedAt: Date;
  targetStatus?: SessionStatus;
}

export interface PRMergeResult {
  processed: boolean;
  sessionNumber?: number;
  issueNumber?: number;
  newStatus?: SessionStatus;
  labelsToAdd?: string[];
  labelsToRemove?: string[];
  reason?: string;
  comment?: string;
}

export interface PROpenEvent {
  owner: string;
  repo: string;
  prNumber: number;
  branch: string;
  title: string;
  body?: string;
  author: string;
}

export interface PROpenResult {
  processed: boolean;
  sessionNumber?: number;
  suggestedStatus?: SessionStatus;
  reason?: string;
}

export interface GitHubEventPayload {
  eventType: 'pr_merged' | 'pr_opened' | 'pr_closed';
  owner: string;
  repo: string;
  prNumber: number;
  branch: string;
  title: string;
  body: string;
  author?: string;
  mergedBy?: string;
  mergedAt?: string;
}

export interface LabelChanges {
  add: string[];
  remove: string[];
}

export interface CICDServiceOptions {
  sessionToIssueMapping?: Record<number, number>;
}

export interface WorkflowOptions {
  workflowName?: string;
  branches?: string[];
}

// ============================================================================
// SESSION EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract session number from branch name.
 *
 * Supports patterns:
 * - session-N (e.g., session-5)
 * - feature/session-N (e.g., feature/session-3)
 * - session/N (e.g., session/7)
 * - s-N (e.g., s-4)
 *
 * @param branch - Branch name
 * @returns Session number or null if not found
 */
export function extractSessionFromBranch(branch: string): number | null {
  // Pattern: session-N, feature/session-N, session-N-description
  const sessionDashPattern = /(?:^|\/)?session-(\d+)/i;
  const matchDash = branch.match(sessionDashPattern);
  if (matchDash) {
    const num = parseInt(matchDash[1], 10);
    return num > 0 ? num : null;
  }

  // Pattern: session/N
  const sessionSlashPattern = /session\/(\d+)/i;
  const matchSlash = branch.match(sessionSlashPattern);
  if (matchSlash) {
    const num = parseInt(matchSlash[1], 10);
    return num > 0 ? num : null;
  }

  // Pattern: s-N (shorthand)
  const shortPattern = /(?:^|\/)?s-(\d+)/i;
  const matchShort = branch.match(shortPattern);
  if (matchShort) {
    const num = parseInt(matchShort[1], 10);
    return num > 0 ? num : null;
  }

  return null;
}

/**
 * Extract session number from PR body text.
 *
 * Supports patterns:
 * - Session #N
 * - Session: N
 * - Implements session N
 * - Closes session N
 * - Completes session N
 * - ## Session N (markdown header)
 *
 * @param body - PR body text
 * @returns Session number or null if not found
 */
export function extractSessionFromPRBody(body: string): number | null {
  if (!body) return null;

  // Pattern: Session #N or Session: N
  const hashPattern = /session\s*[#:]\s*(\d+)/i;
  const matchHash = body.match(hashPattern);
  if (matchHash) {
    const num = parseInt(matchHash[1], 10);
    return num > 0 ? num : null;
  }

  // Pattern: Implements/Closes/Completes session N
  const verbPattern = /(?:implements?|closes?|completes?)\s+session\s+(\d+)/i;
  const matchVerb = body.match(verbPattern);
  if (matchVerb) {
    const num = parseInt(matchVerb[1], 10);
    return num > 0 ? num : null;
  }

  // Pattern: ## Session N or [x] Session N
  const markdownPattern = /(?:##\s*|(?:\[x\]\s*))session\s+(\d+)/i;
  const matchMarkdown = body.match(markdownPattern);
  if (matchMarkdown) {
    const num = parseInt(matchMarkdown[1], 10);
    return num > 0 ? num : null;
  }

  return null;
}

/**
 * Extract session number from PR title.
 *
 * Supports patterns:
 * - [Session N] Title
 * - [S-N] Title
 * - Session N: Title
 *
 * @param title - PR title
 * @returns Session number or null if not found
 */
export function extractSessionFromPRTitle(title: string): number | null {
  // Pattern: [Session N] or [S-N]
  const bracketPattern = /\[(?:session\s*|s-)(\d+)\]/i;
  const matchBracket = title.match(bracketPattern);
  if (matchBracket) {
    const num = parseInt(matchBracket[1], 10);
    return num > 0 ? num : null;
  }

  // Pattern: Session N:
  const colonPattern = /session\s+(\d+)\s*:/i;
  const matchColon = title.match(colonPattern);
  if (matchColon) {
    const num = parseInt(matchColon[1], 10);
    return num > 0 ? num : null;
  }

  return null;
}

// ============================================================================
// CICD SERVICE CLASS
// ============================================================================

/**
 * Service for CI/CD integration and automatic session status updates.
 */
export class CICDService {
  private sessionToIssueMapping: Record<number, number>;

  constructor(options: CICDServiceOptions = {}) {
    this.sessionToIssueMapping = options.sessionToIssueMapping || {};
  }

  // ==========================================================================
  // PR-TO-SESSION LINKING
  // ==========================================================================

  /**
   * Link a PR to a session by extracting session number from branch, title, or body.
   *
   * Priority: branch > title > body
   *
   * @param prInfo - PR information
   * @returns Session link result
   */
  linkPRToSession(prInfo: PRInfo): SessionLinkResult {
    // Try branch first
    const branchSession = extractSessionFromBranch(prInfo.branch);
    if (branchSession) {
      return { found: true, sessionNumber: branchSession, source: 'branch' };
    }

    // Try title next
    const titleSession = extractSessionFromPRTitle(prInfo.title);
    if (titleSession) {
      return { found: true, sessionNumber: titleSession, source: 'title' };
    }

    // Try body last
    const bodySession = extractSessionFromPRBody(prInfo.body || '');
    if (bodySession) {
      return { found: true, sessionNumber: bodySession, source: 'body' };
    }

    return { found: false };
  }

  // ==========================================================================
  // PR EVENT HANDLERS
  // ==========================================================================

  /**
   * Handle PR merge event and update session status.
   *
   * @param event - PR merge event details
   * @returns Processing result
   */
  async onPRMerged(event: PRMergeEvent): Promise<PRMergeResult> {
    const link = this.linkPRToSession({
      prNumber: event.prNumber,
      branch: event.branch,
      title: event.title,
      body: event.body,
    });

    if (!link.found || !link.sessionNumber) {
      return {
        processed: false,
        reason: 'No session reference found in PR branch, title, or body',
      };
    }

    const newStatus = event.targetStatus || 'completed';
    const issueNumber = this.getSessionIssueNumber(link.sessionNumber);
    const labels = this.getLabelsForStatus(newStatus);

    const comment = this.generateIssueComment('pr_merged', {
      prNumber: event.prNumber,
      prTitle: event.title,
      mergedBy: event.mergedBy,
      newStatus,
    });

    return {
      processed: true,
      sessionNumber: link.sessionNumber,
      issueNumber,
      newStatus,
      labelsToAdd: labels.add,
      labelsToRemove: labels.remove,
      comment,
    };
  }

  /**
   * Handle PR opened event.
   *
   * @param event - PR open event details
   * @returns Processing result
   */
  async onPROpened(event: PROpenEvent): Promise<PROpenResult> {
    const link = this.linkPRToSession({
      prNumber: event.prNumber,
      branch: event.branch,
      title: event.title,
      body: event.body,
    });

    if (!link.found || !link.sessionNumber) {
      return {
        processed: false,
        reason: 'No session reference found in PR branch, title, or body',
      };
    }

    // When a PR is opened, session is likely in refactor phase
    return {
      processed: true,
      sessionNumber: link.sessionNumber,
      suggestedStatus: 'refactor_phase',
    };
  }

  // ==========================================================================
  // ISSUE NUMBER MAPPING
  // ==========================================================================

  /**
   * Get the GitHub issue number for a session.
   *
   * @param sessionNumber - Session number
   * @returns Issue number
   */
  getSessionIssueNumber(sessionNumber: number): number {
    return this.sessionToIssueMapping[sessionNumber] || sessionNumber;
  }

  // ==========================================================================
  // LABEL MANAGEMENT
  // ==========================================================================

  /**
   * Get labels to add and remove for a session status change.
   *
   * @param status - New session status
   * @returns Labels to add and remove
   */
  getLabelsForStatus(status: SessionStatus): LabelChanges {
    const statusLabels: Record<SessionStatus, LabelChanges> = {
      not_started: {
        add: ['not-started'],
        remove: ['in-progress', 'completed', 'blocked'],
      },
      in_progress: {
        add: ['in-progress'],
        remove: ['not-started', 'completed', 'blocked'],
      },
      red_phase: {
        add: ['red-phase', 'in-progress'],
        remove: ['not-started', 'green-phase', 'refactor-phase', 'completed'],
      },
      green_phase: {
        add: ['green-phase', 'in-progress'],
        remove: ['red-phase', 'refactor-phase', 'completed'],
      },
      refactor_phase: {
        add: ['refactor-phase', 'in-progress'],
        remove: ['red-phase', 'green-phase', 'completed'],
      },
      awaiting_approval: {
        add: ['awaiting-approval'],
        remove: ['in-progress', 'red-phase', 'green-phase', 'refactor-phase'],
      },
      completed: {
        add: ['completed'],
        remove: ['in-progress', 'red-phase', 'green-phase', 'refactor-phase', 'awaiting-approval', 'blocked'],
      },
      blocked: {
        add: ['blocked'],
        remove: ['in-progress'],
      },
      skipped: {
        add: ['skipped'],
        remove: ['in-progress', 'not-started'],
      },
    };

    return statusLabels[status] || { add: [], remove: [] };
  }

  // ==========================================================================
  // COMMENT GENERATION
  // ==========================================================================

  /**
   * Generate a comment to post on the session issue.
   *
   * @param eventType - Type of event
   * @param data - Event data
   * @returns Comment markdown
   */
  generateIssueComment(
    eventType: 'pr_merged' | 'pr_opened',
    data: {
      prNumber: number;
      prTitle: string;
      mergedBy?: string;
      author?: string;
      newStatus?: SessionStatus;
    }
  ): string {
    if (eventType === 'pr_merged') {
      return `## 🎉 PR #${data.prNumber} merged

**${data.prTitle}**

Merged by: @${data.mergedBy}
Session status updated to: \`${data.newStatus}\`

---
*Automatically updated by CI/CD integration*`;
    }

    if (eventType === 'pr_opened') {
      return `## 📝 PR #${data.prNumber} opened

**${data.prTitle}**

Author: @${data.author}

---
*Automatically tracked by CI/CD integration*`;
    }

    return '';
  }

  // ==========================================================================
  // GITHUB EVENT PARSING
  // ==========================================================================

  /**
   * Parse a GitHub webhook event payload.
   *
   * @param eventType - GitHub event type
   * @param payload - Event payload
   * @returns Parsed event data
   */
  parseGitHubEventPayload(
    _eventType: string,
    payload: Record<string, unknown>
  ): GitHubEventPayload {
    const pr = payload.pull_request as Record<string, unknown> || {};
    const repo = payload.repository as Record<string, unknown> || {};
    const owner = repo.owner as Record<string, unknown> || {};
    const head = pr.head as Record<string, unknown> || {};
    const user = pr.user as Record<string, unknown> || {};
    const mergedBy = pr.merged_by as Record<string, unknown> || {};

    const action = payload.action as string;
    const merged = pr.merged as boolean;

    let parsedEventType: 'pr_merged' | 'pr_opened' | 'pr_closed';
    if (action === 'opened') {
      parsedEventType = 'pr_opened';
    } else if (action === 'closed' && merged) {
      parsedEventType = 'pr_merged';
    } else {
      parsedEventType = 'pr_closed';
    }

    return {
      eventType: parsedEventType,
      owner: owner.login as string || '',
      repo: repo.name as string || '',
      prNumber: pr.number as number || 0,
      branch: head.ref as string || '',
      title: pr.title as string || '',
      body: pr.body as string || '',
      author: user.login as string,
      mergedBy: mergedBy.login as string,
      mergedAt: pr.merged_at as string,
    };
  }

  // ==========================================================================
  // GITHUB ACTIONS WORKFLOW GENERATION
  // ==========================================================================

  /**
   * Generate a GitHub Actions workflow for session tracking.
   *
   * @param options - Workflow customization options
   * @returns YAML workflow content
   */
  generateGitHubActionsWorkflow(options: WorkflowOptions = {}): string {
    const {
      workflowName = 'Session Status Tracker',
      branches = ['main'],
    } = options;

    const branchList = branches.map(b => `'${b}'`).join(', ');

    return `# ${workflowName}
# Automatically updates session status when PRs are merged

name: ${workflowName}

on:
  pull_request:
    types: [opened, closed]
    branches: [${branchList}]

jobs:
  track-session:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Extract session from PR
        id: session
        run: |
          BRANCH="\${{ github.head_ref }}"
          # Extract session number from branch name
          SESSION=$(echo "$BRANCH" | grep -oP 'session-\\K\\d+' || echo "")
          if [ -z "$SESSION" ]; then
            # Try title
            SESSION=$(echo "\${{ github.event.pull_request.title }}" | grep -oP '\\[Session\\s*\\K\\d+' || echo "")
          fi
          echo "session=$SESSION" >> $GITHUB_OUTPUT
          echo "Found session: $SESSION"

      - name: Update session status on merge
        if: github.event.pull_request.merged == true && steps.session.outputs.session != ''
        uses: actions/github-script@v7
        with:
          script: |
            const sessionNumber = \${{ steps.session.outputs.session }};
            const issueNumber = sessionNumber; // Adjust if mapping differs

            // Add completed label
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              labels: ['completed']
            });

            // Remove in-progress labels
            const labelsToRemove = ['in-progress', 'red-phase', 'green-phase', 'refactor-phase'];
            for (const label of labelsToRemove) {
              try {
                await github.rest.issues.removeLabel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issueNumber,
                  name: label
                });
              } catch (e) {
                // Label might not exist
              }
            }

            // Add comment
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              body: \`## 🎉 Session \${sessionNumber} Completed\\n\\nPR #\${{ github.event.pull_request.number }} merged by @\${{ github.event.pull_request.merged_by.login }}\\n\\n---\\n*Automatically updated by CI/CD integration*\`
            });

      - name: Track PR opened
        if: github.event.action == 'opened' && steps.session.outputs.session != ''
        uses: actions/github-script@v7
        with:
          script: |
            const sessionNumber = \${{ steps.session.outputs.session }};
            const issueNumber = sessionNumber;

            // Add refactor-phase label (PR opened usually means implementation done)
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issueNumber,
              labels: ['refactor-phase']
            });

            // Remove earlier phase labels
            const labelsToRemove = ['red-phase', 'green-phase'];
            for (const label of labelsToRemove) {
              try {
                await github.rest.issues.removeLabel({
                  owner: context.repo.owner,
                  repo: context.repo.repo,
                  issue_number: issueNumber,
                  name: label
                });
              } catch (e) {
                // Label might not exist
              }
            }
`;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: CICDService | null = null;

/**
 * Get the singleton CI/CD service instance.
 */
export function getCICDService(): CICDService {
  if (!instance) {
    instance = new CICDService();
  }
  return instance;
}

/**
 * Reset the singleton instance (useful for testing).
 */
export function resetCICDService(): void {
  instance = null;
}
