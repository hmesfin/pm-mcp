// src/tools/github/trackProgress.ts
/**
 * Track project progress by querying GitHub issues, milestones, and PRs.
 *
 * This tool provides comprehensive project tracking by:
 * - Querying GitHub issues to identify session status
 * - Calculating overall, phase-based, and domain-based progress
 * - Tracking pull requests (open, merged, draft)
 * - Detecting blocked sessions
 * - Calculating velocity and estimated completion dates
 * - Generating actionable recommendations
 *
 * @module trackProgress
 */

import { Octokit } from "@octokit/rest";
import {
  TrackProgressParams,
  ProgressReport,
  ProgressMetrics,
  PhaseProgress,
  DomainProgress,
  PRSummary,
  Blocker,
} from "../../types/tools.js";
import { Domain, Session } from "../../types/common.js";

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  labels: Array<{ name: string }>;
  milestone: { number: number; title: string } | null;
  created_at: string;
  closed_at?: string;
}

interface GitHubMilestone {
  number: number;
  title: string;
  description: string;
  state: string;
  open_issues: number;
  closed_issues: number;
}

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  draft: boolean;
  created_at: string;
  merged_at?: string;
  user: { login: string };
  requested_reviewers: Array<{ login: string }>;
  head: { ref: string };
}

/**
 * Track project progress by querying GitHub for issues, milestones, and PRs.
 *
 * @param params - The parameters for tracking progress
 * @param params.owner - GitHub repository owner
 * @param params.repo - GitHub repository name
 * @param params.format - Output format: 'summary', 'detailed', or 'json'
 * @returns A comprehensive progress report
 *
 * @example
 * ```typescript
 * const report = await trackProgress({
 *   owner: 'myorg',
 *   repo: 'myproject',
 *   format: 'summary'
 * });
 * console.log(`Progress: ${report.progress.overall.percentComplete}%`);
 * ```
 */
export async function trackProgress(
  params: TrackProgressParams
): Promise<ProgressReport> {
  const { owner, repo } = params;

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  // Fetch data from GitHub
  const [issuesResponse, milestonesResponse, prsResponse] = await Promise.all([
    octokit.issues.listForRepo({
      owner,
      repo,
      state: "all",
      per_page: 100,
    }),
octokit.issues.listMilestones({
      owner,
      repo,
      state: "all",
      per_page: 100,
    }),
    octokit.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: 100,
    }),
  ]);

  const allIssues = issuesResponse.data as GitHubIssue[];
  const milestones = milestonesResponse.data as GitHubMilestone[];
  const pullRequests = prsResponse.data as GitHubPR[];

  // Filter to only session issues (title starts with "Session X:")
  const sessionIssues = allIssues.filter((issue) =>
    /^Session\s+\d+:/i.test(issue.title)
  );

  // Calculate overall progress
  const overall = calculateOverallProgress(sessionIssues);

  // Calculate progress by phase
  const byPhase = calculatePhaseProgress(sessionIssues, milestones);

  // Calculate progress by domain
  const byDomain = calculateDomainProgress(sessionIssues);

  // Process pull requests
  const prSummaries = processPullRequests(pullRequests, owner, repo);

  // Detect blockers
  const blockers = detectBlockers(sessionIssues);

  // Calculate metrics
  const metrics = calculateMetrics(sessionIssues, overall);

  // Determine project status
  const status = determineProjectStatus(overall);

  // Find next session
  const upNext = findNextSession(sessionIssues);

  // Generate recommendations
  const recommendations = generateRecommendations(
    overall,
    blockers,
    sessionIssues
  );

  return {
    project: repo,
    status,
    lastUpdated: new Date(),
    progress: {
      overall,
      byPhase,
      byDomain,
    },
    metrics,
    pullRequests: prSummaries,
    blockers,
    upNext,
    recommendations,
  };
}

function calculateOverallProgress(issues: GitHubIssue[]): ProgressMetrics {
  const totalSessions = issues.length;
  const completed = issues.filter((i) => i.state === "closed").length;
  const inProgress = issues.filter(
    (i) =>
      i.state === "open" &&
      i.labels.some((l) => l.name === "in-progress") &&
      !i.labels.some((l) => l.name === "blocked")
  ).length;
  const blocked = issues.filter((i) =>
    i.labels.some((l) => l.name === "blocked")
  ).length;
  const notStarted = totalSessions - completed - inProgress - blocked;
  const percentComplete =
    totalSessions > 0 ? Math.round((completed / totalSessions) * 100) : 0;

  return {
    totalSessions,
    completed,
    inProgress,
    blocked,
    notStarted,
    percentComplete,
  };
}

function calculatePhaseProgress(
  issues: GitHubIssue[],
  milestones: GitHubMilestone[]
): Record<string, PhaseProgress> {
  const byPhase: Record<string, PhaseProgress> = {};

  // Group issues by phase label
  const phaseGroups: Record<string, GitHubIssue[]> = {};

  for (const issue of issues) {
    const phaseLabel = issue.labels.find((l) => /^phase-\d+$/.test(l.name));
    if (phaseLabel) {
      const phaseNum = phaseLabel.name.replace("phase-", "");
      const phaseKey = `Phase ${phaseNum}`;
      if (!phaseGroups[phaseKey]) {
        phaseGroups[phaseKey] = [];
      }
      phaseGroups[phaseKey].push(issue);
    }
  }

  // Calculate progress for each phase
  for (const [phaseName, phaseIssues] of Object.entries(phaseGroups)) {
    const sessions = phaseIssues.length;
    const completed = phaseIssues.filter((i) => i.state === "closed").length;
    const inProgress = phaseIssues.filter(
      (i) =>
        i.state === "open" &&
        i.labels.some((l) => l.name === "in-progress") &&
        !i.labels.some((l) => l.name === "blocked")
    ).length;
    const blocked = phaseIssues.filter((i) =>
      i.labels.some((l) => l.name === "blocked")
    ).length;
    const percentComplete =
      sessions > 0 ? Math.round((completed / sessions) * 100) : 0;

    // Try to find estimated time from milestone
    const phaseNum = phaseName.replace("Phase ", "");
    const milestone = milestones.find((m) =>
      m.title.toLowerCase().includes(`phase ${phaseNum}`)
    );
    let estimatedTime = "Unknown";
    if (milestone?.description) {
      const timeMatch = milestone.description.match(
        /Estimated Time:\s*([\d\-]+h)/i
      );
      if (timeMatch) {
        estimatedTime = timeMatch[1];
      }
    }

    byPhase[phaseName] = {
      name: phaseName,
      sessions,
      completed,
      inProgress,
      blocked,
      percentComplete,
      estimatedTime,
    };
  }

  return byPhase;
}

function calculateDomainProgress(
  issues: GitHubIssue[]
): Record<Domain, DomainProgress> {
  const domains: Domain[] = [
    "backend",
    "frontend",
    "mobile",
    "e2e",
    "infrastructure",
  ];
  const byDomain: Record<Domain, DomainProgress> = {} as Record<
    Domain,
    DomainProgress
  >;

  for (const domain of domains) {
    const domainIssues = issues.filter((i) =>
      i.labels.some((l) => l.name === domain)
    );
    const sessions = domainIssues.length;
    const completed = domainIssues.filter((i) => i.state === "closed").length;
    const percentComplete =
      sessions > 0 ? Math.round((completed / sessions) * 100) : 0;

    byDomain[domain] = {
      sessions,
      completed,
      percentComplete,
    };
  }

  return byDomain;
}

function processPullRequests(
  prs: GitHubPR[],
  owner: string,
  repo: string
): {
  open: PRSummary[];
  merged: PRSummary[];
  draft: PRSummary[];
} {
  const open: PRSummary[] = [];
  const merged: PRSummary[] = [];
  const draft: PRSummary[] = [];

  for (const pr of prs) {
    const sessionNumber = extractSessionNumber(pr.title, pr.head.ref);

    const summary: PRSummary = {
      number: pr.number,
      title: pr.title,
      sessionNumber,
      status: pr.merged_at ? "merged" : pr.draft ? "draft" : "open",
      reviewers: pr.requested_reviewers.map((r) => r.login),
      createdAt: new Date(pr.created_at),
      mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
      url: `https://github.com/${owner}/${repo}/pull/${pr.number}`,
    };

    if (pr.merged_at) {
      merged.push(summary);
    } else if (pr.draft) {
      draft.push(summary);
    } else if (pr.state === "open") {
      open.push(summary);
    }
  }

  return { open, merged, draft };
}

function extractSessionNumber(
  title: string,
  branch: string
): number | undefined {
  // Try to extract from title (e.g., "feat: implement session 1")
  const titleMatch = title.match(/session\s*(\d+)/i);
  if (titleMatch) {
    return parseInt(titleMatch[1], 10);
  }

  // Try to extract from branch (e.g., "session-1")
  const branchMatch = branch.match(/session-?(\d+)/i);
  if (branchMatch) {
    return parseInt(branchMatch[1], 10);
  }

  return undefined;
}

function detectBlockers(issues: GitHubIssue[]): Blocker[] {
  const blockers: Blocker[] = [];

  for (const issue of issues) {
    if (issue.labels.some((l) => l.name === "blocked")) {
      // Extract session number from title
      const sessionMatch = issue.title.match(/Session\s+(\d+):/i);
      const sessionNumber = sessionMatch ? parseInt(sessionMatch[1], 10) : 0;

      blockers.push({
        sessionNumber,
        title: issue.title,
        category: "technical", // Default category
        description: `Issue #${issue.number} is marked as blocked`,
        blockedSince: new Date(issue.created_at),
      });
    }
  }

  return blockers;
}

function calculateMetrics(
  issues: GitHubIssue[],
  overall: ProgressMetrics
): {
  totalTests: number;
  avgCoverage: number;
  timeSpent: string;
  timeEstimated: string;
  velocity: number;
  estimatedCompletion?: Date;
} {
  // Estimate ~3h per session (average)
  const avgTimePerSession = 3;
  const timeSpent = `${overall.completed * avgTimePerSession}h`;
  const remaining = overall.totalSessions - overall.completed;
  const timeEstimated = `${remaining * avgTimePerSession}h`;

  // Calculate velocity (sessions completed per day)
  const completedIssues = issues.filter((i) => i.state === "closed");
  let velocity = 0;

  if (completedIssues.length >= 2) {
    const dates = completedIssues
      .filter((i) => i.closed_at)
      .map((i) => new Date(i.closed_at!).getTime())
      .sort((a, b) => a - b);

    if (dates.length >= 2) {
      const firstDate = dates[0];
      const lastDate = dates[dates.length - 1];
      const daysDiff = Math.max(
        1,
        (lastDate - firstDate) / (1000 * 60 * 60 * 24)
      );
      velocity = Math.round((completedIssues.length / daysDiff) * 100) / 100;
    }
  }

  // Calculate estimated completion
  let estimatedCompletion: Date | undefined;
  if (velocity > 0 && remaining > 0) {
    const daysRemaining = remaining / velocity;
    estimatedCompletion = new Date();
    estimatedCompletion.setDate(
      estimatedCompletion.getDate() + Math.ceil(daysRemaining)
    );
  }

  return {
    totalTests: overall.completed * 20, // Estimate ~20 tests per session
    avgCoverage: 85, // Target coverage
    timeSpent,
    timeEstimated,
    velocity,
    estimatedCompletion,
  };
}

function determineProjectStatus(
  overall: ProgressMetrics
): "not_started" | "in_progress" | "completed" | "paused" {
  if (overall.totalSessions === 0) {
    return "not_started";
  }
  if (overall.completed === overall.totalSessions) {
    return "completed";
  }
  if (overall.completed > 0 || overall.inProgress > 0) {
    return "in_progress";
  }
  return "not_started";
}

function findNextSession(issues: GitHubIssue[]): Session | undefined {
  // Find the first open issue that's not blocked or in-progress
  const nextIssue = issues.find(
    (i) =>
      i.state === "open" &&
      !i.labels.some((l) => l.name === "blocked") &&
      !i.labels.some((l) => l.name === "in-progress")
  );

  if (!nextIssue) {
    return undefined;
  }

  // Extract session number and create a minimal Session object
  const sessionMatch = nextIssue.title.match(/Session\s+(\d+):\s*(.+)/i);
  if (!sessionMatch) {
    return undefined;
  }

  const sessionNumber = parseInt(sessionMatch[1], 10);
  const title = sessionMatch[2].trim();

  // Determine domain from labels
  const domainLabel = nextIssue.labels.find((l) =>
    ["backend", "frontend", "mobile", "e2e", "infrastructure"].includes(l.name)
  );
  const domain = (domainLabel?.name as Domain) || "infrastructure";

  // Extract phase from labels
  const phaseLabel = nextIssue.labels.find((l) => /^phase-\d+$/.test(l.name));
  const phaseNumber = phaseLabel
    ? parseInt(phaseLabel.name.replace("phase-", ""), 10)
    : 1;

  return {
    number: sessionNumber,
    title,
    phase: phaseNumber,
    phaseName: `Phase ${phaseNumber}`,
    domain,
    objectives: [],
    tddWorkflow: {
      redPhase: [],
      greenPhase: [],
      refactorPhase: [],
    },
    filesToCreate: [],
    filesToModify: [],
    dependencies: [],
    exitCriteria: [],
    estimatedTime: { estimated: "3h" },
    estimatedTests: 20,
    status: "not_started",
    githubIssue: nextIssue.number,
  };
}

function generateRecommendations(
  overall: ProgressMetrics,
  blockers: Blocker[],
  _issues: GitHubIssue[]
): string[] {
  const recommendations: string[] = [];

  // Check for blockers
  if (blockers.length > 0) {
    recommendations.push(
      `Address ${blockers.length} blocked session(s) to unblock progress`
    );
  }

  // Check for stalled progress
  if (overall.inProgress === 0 && overall.notStarted > 0) {
    recommendations.push("Start the next available session to maintain momentum");
  }

  // Check if too many sessions in progress
  if (overall.inProgress > 2) {
    recommendations.push(
      "Consider completing current in-progress sessions before starting new ones"
    );
  }

  // Check progress percentage
  if (overall.percentComplete > 0 && overall.percentComplete < 50) {
    recommendations.push("Project is less than 50% complete - stay focused on core features");
  }

  if (overall.percentComplete >= 75) {
    recommendations.push("Project is nearing completion - prioritize testing and documentation");
  }

  // Default recommendation if empty
  if (recommendations.length === 0) {
    recommendations.push("Project is on track - continue following the plan");
  }

  return recommendations;
}
