// src/tools/github/__tests__/trackProgress.test.ts
// Tests for trackProgress tool

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackProgress } from '../trackProgress.js';
import type {
  TrackProgressParams,
  ProgressReport,
  ProgressMetrics,
  PhaseProgress,
  DomainProgress,
  PRSummary,
  Blocker,
} from '../../../types/tools.js';

// Mock GitHub API responses
const mockIssues = [
  {
    number: 1,
    title: 'Session 1: Project Setup & Type Definitions',
    state: 'closed',
    labels: [{ name: 'phase-1' }, { name: 'infrastructure' }, { name: 'session-1' }],
    milestone: { number: 1, title: 'Phase 1: Core Infrastructure' },
    created_at: '2025-11-20T00:00:00Z',
    closed_at: '2025-11-21T00:00:00Z',
  },
  {
    number: 2,
    title: 'Session 2: Template Engine & File Operations',
    state: 'closed',
    labels: [{ name: 'phase-1' }, { name: 'infrastructure' }, { name: 'session-2' }],
    milestone: { number: 1, title: 'Phase 1: Core Infrastructure' },
    created_at: '2025-11-21T00:00:00Z',
    closed_at: '2025-11-22T00:00:00Z',
  },
  {
    number: 3,
    title: 'Session 3: generateProjectPlan Tool',
    state: 'open',
    labels: [{ name: 'phase-2' }, { name: 'infrastructure' }, { name: 'session-3' }, { name: 'in-progress' }],
    milestone: { number: 2, title: 'Phase 2: Planning Tools' },
    created_at: '2025-11-22T00:00:00Z',
  },
  {
    number: 4,
    title: 'Session 4: analyzeRequirements Tool',
    state: 'open',
    labels: [{ name: 'phase-2' }, { name: 'backend' }, { name: 'session-4' }],
    milestone: { number: 2, title: 'Phase 2: Planning Tools' },
    created_at: '2025-11-22T00:00:00Z',
  },
  {
    number: 5,
    title: 'Session 5: critiquePlan Tool',
    state: 'open',
    labels: [{ name: 'phase-2' }, { name: 'backend' }, { name: 'session-5' }, { name: 'blocked' }],
    milestone: { number: 2, title: 'Phase 2: Planning Tools' },
    created_at: '2025-11-22T00:00:00Z',
  },
];

const mockMilestones = [
  {
    number: 1,
    title: 'Phase 1: Core Infrastructure',
    description: 'Set up foundation and basic tools\n\nSessions: 2\nEstimated Time: 6h',
    state: 'closed',
    open_issues: 0,
    closed_issues: 2,
  },
  {
    number: 2,
    title: 'Phase 2: Planning Tools',
    description: 'Implement core planning capabilities\n\nSessions: 3\nEstimated Time: 10h',
    state: 'open',
    open_issues: 2,
    closed_issues: 1,
  },
];

const mockPullRequests = [
  {
    number: 10,
    title: 'feat: implement session 1',
    state: 'merged',
    draft: false,
    created_at: '2025-11-20T12:00:00Z',
    merged_at: '2025-11-21T00:00:00Z',
    user: { login: 'developer' },
    requested_reviewers: [{ login: 'reviewer1' }],
    head: { ref: 'session-1' },
  },
  {
    number: 11,
    title: 'feat: implement session 2',
    state: 'merged',
    draft: false,
    created_at: '2025-11-21T12:00:00Z',
    merged_at: '2025-11-22T00:00:00Z',
    user: { login: 'developer' },
    requested_reviewers: [],
    head: { ref: 'session-2' },
  },
  {
    number: 12,
    title: 'feat: implement session 3 (WIP)',
    state: 'open',
    draft: true,
    created_at: '2025-11-22T12:00:00Z',
    user: { login: 'developer' },
    requested_reviewers: [],
    head: { ref: 'session-3' },
  },
];

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      listForRepo: vi.fn().mockResolvedValue({ data: mockIssues }),
      listMilestones: vi.fn().mockResolvedValue({ data: mockMilestones }),
    },
    pulls: {
      list: vi.fn().mockResolvedValue({ data: mockPullRequests }),
    },
  })),
}));

describe('trackProgress', () => {
  const defaultParams: TrackProgressParams = {
    owner: 'testowner',
    repo: 'testrepo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should return a valid ProgressReport structure', async () => {
      const result = await trackProgress(defaultParams);

      expect(result).toHaveProperty('project');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('pullRequests');
      expect(result).toHaveProperty('blockers');
      expect(result).toHaveProperty('recommendations');
    });

    it('should correctly identify project name from repo', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.project).toBe('testrepo');
    });

    it('should set correct project status based on issues', async () => {
      const result = await trackProgress(defaultParams);

      // Has completed and in-progress sessions, so status should be 'in_progress'
      expect(result.status).toBe('in_progress');
    });
  });

  describe('Overall Progress Metrics', () => {
    it('should calculate total sessions correctly', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.progress.overall.totalSessions).toBe(5);
    });

    it('should calculate completed sessions correctly', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.progress.overall.completed).toBe(2);
    });

    it('should calculate in-progress sessions correctly', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.progress.overall.inProgress).toBe(1);
    });

    it('should calculate blocked sessions correctly', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.progress.overall.blocked).toBe(1);
    });

    it('should calculate not-started sessions correctly', async () => {
      const result = await trackProgress(defaultParams);

      // 5 total - 2 completed - 1 in-progress - 1 blocked = 1 not started
      expect(result.progress.overall.notStarted).toBe(1);
    });

    it('should calculate percent complete correctly', async () => {
      const result = await trackProgress(defaultParams);

      // 2 completed out of 5 = 40%
      expect(result.progress.overall.percentComplete).toBe(40);
    });
  });

  describe('Phase Progress', () => {
    it('should track progress by phase', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.progress.byPhase).toBeDefined();
      expect(Object.keys(result.progress.byPhase).length).toBeGreaterThan(0);
    });

    it('should calculate phase 1 progress correctly', async () => {
      const result = await trackProgress(defaultParams);

      const phase1 = result.progress.byPhase['Phase 1'];
      expect(phase1).toBeDefined();
      expect(phase1.sessions).toBe(2);
      expect(phase1.completed).toBe(2);
      expect(phase1.percentComplete).toBe(100);
    });

    it('should calculate phase 2 progress correctly', async () => {
      const result = await trackProgress(defaultParams);

      const phase2 = result.progress.byPhase['Phase 2'];
      expect(phase2).toBeDefined();
      expect(phase2.sessions).toBe(3);
      expect(phase2.completed).toBe(0);
      expect(phase2.inProgress).toBe(1);
      expect(phase2.blocked).toBe(1);
    });

    it('should include estimated time for phases', async () => {
      const result = await trackProgress(defaultParams);

      const phase1 = result.progress.byPhase['Phase 1'];
      expect(phase1.estimatedTime).toBeDefined();
    });
  });

  describe('Domain Progress', () => {
    it('should track progress by domain', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.progress.byDomain).toBeDefined();
    });

    it('should calculate infrastructure domain progress', async () => {
      const result = await trackProgress(defaultParams);

      const infrastructure = result.progress.byDomain.infrastructure;
      expect(infrastructure).toBeDefined();
      expect(infrastructure.sessions).toBe(3); // Sessions 1, 2, 3
      expect(infrastructure.completed).toBe(2); // Sessions 1, 2
    });

    it('should calculate backend domain progress', async () => {
      const result = await trackProgress(defaultParams);

      const backend = result.progress.byDomain.backend;
      expect(backend).toBeDefined();
      expect(backend.sessions).toBe(2); // Sessions 4, 5
      expect(backend.completed).toBe(0);
    });
  });

  describe('Pull Request Tracking', () => {
    it('should track merged pull requests', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.pullRequests.merged.length).toBe(2);
    });

    it('should track open pull requests', async () => {
      const result = await trackProgress(defaultParams);

      // PR #12 is open but draft
      expect(result.pullRequests.open.length).toBe(0);
    });

    it('should track draft pull requests', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.pullRequests.draft.length).toBe(1);
    });

    it('should include PR details', async () => {
      const result = await trackProgress(defaultParams);

      const mergedPR = result.pullRequests.merged[0];
      expect(mergedPR.number).toBeDefined();
      expect(mergedPR.title).toBeDefined();
      expect(mergedPR.status).toBe('merged');
      expect(mergedPR.url).toContain('github.com');
    });

    it('should extract session number from PR title or branch', async () => {
      const result = await trackProgress(defaultParams);

      const mergedPR = result.pullRequests.merged[0];
      expect(mergedPR.sessionNumber).toBe(1);
    });
  });

  describe('Blocker Detection', () => {
    it('should identify blocked sessions', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.blockers.length).toBeGreaterThan(0);
    });

    it('should include blocker details', async () => {
      const result = await trackProgress(defaultParams);

      const blocker = result.blockers[0];
      expect(blocker.sessionNumber).toBeDefined();
      expect(blocker.title).toBeDefined();
      expect(blocker.category).toBeDefined();
      expect(blocker.blockedSince).toBeDefined();
    });
  });

  describe('Metrics Calculation', () => {
    it('should estimate time spent based on completed sessions', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.metrics.timeSpent).toBeDefined();
    });

    it('should estimate remaining time', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.metrics.timeEstimated).toBeDefined();
    });

    it('should calculate velocity', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.metrics.velocity).toBeDefined();
      expect(typeof result.metrics.velocity).toBe('number');
    });
  });

  describe('Next Session Recommendation', () => {
    it('should recommend next session when applicable', async () => {
      const result = await trackProgress(defaultParams);

      // Session 4 should be next (not blocked, not in progress)
      expect(result.upNext).toBeDefined();
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations based on project state', async () => {
      const result = await trackProgress(defaultParams);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should recommend unblocking when sessions are blocked', async () => {
      const result = await trackProgress(defaultParams);

      const hasUnblockRecommendation = result.recommendations.some(
        rec => rec.toLowerCase().includes('block')
      );
      expect(hasUnblockRecommendation).toBe(true);
    });
  });

  describe('Output Formats', () => {
    it('should support summary format (default)', async () => {
      const result = await trackProgress({
        ...defaultParams,
        format: 'summary',
      });

      expect(result).toBeDefined();
    });

    it('should support detailed format', async () => {
      const result = await trackProgress({
        ...defaultParams,
        format: 'detailed',
      });

      expect(result).toBeDefined();
    });

    it('should support json format', async () => {
      const result = await trackProgress({
        ...defaultParams,
        format: 'json',
      });

      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty repository (no issues)', async () => {
      vi.mocked(await import('@octokit/rest')).Octokit.mockImplementationOnce(() => ({
        issues: {
          listForRepo: vi.fn().mockResolvedValue({ data: [] }),
          listMilestones: vi.fn().mockResolvedValue({ data: [] }),
        },
        pulls: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      }));

      const result = await trackProgress(defaultParams);

      expect(result.status).toBe('not_started');
      expect(result.progress.overall.totalSessions).toBe(0);
    });

    it('should handle all completed sessions', async () => {
      const allClosedIssues = mockIssues.map(issue => ({
        ...issue,
        state: 'closed',
        closed_at: '2025-11-25T00:00:00Z',
        labels: issue.labels.filter(l => l.name !== 'in-progress' && l.name !== 'blocked'),
      }));

      vi.mocked(await import('@octokit/rest')).Octokit.mockImplementationOnce(() => ({
        issues: {
          listForRepo: vi.fn().mockResolvedValue({ data: allClosedIssues }),
          listMilestones: vi.fn().mockResolvedValue({ data: mockMilestones }),
        },
        pulls: {
          list: vi.fn().mockResolvedValue({ data: mockPullRequests }),
        },
      }));

      const result = await trackProgress(defaultParams);

      expect(result.status).toBe('completed');
      expect(result.progress.overall.percentComplete).toBe(100);
    });

    it('should handle missing milestone on issues', async () => {
      const issuesWithoutMilestones = mockIssues.map(issue => ({
        ...issue,
        milestone: null,
      }));

      vi.mocked(await import('@octokit/rest')).Octokit.mockImplementationOnce(() => ({
        issues: {
          listForRepo: vi.fn().mockResolvedValue({ data: issuesWithoutMilestones }),
          listMilestones: vi.fn().mockResolvedValue({ data: [] }),
        },
        pulls: {
          list: vi.fn().mockResolvedValue({ data: mockPullRequests }),
        },
      }));

      const result = await trackProgress(defaultParams);

      expect(result).toBeDefined();
      expect(result.progress.overall.totalSessions).toBe(5);
    });

    it('should handle GitHub API errors gracefully', async () => {
      vi.mocked(await import('@octokit/rest')).Octokit.mockImplementationOnce(() => ({
        issues: {
          listForRepo: vi.fn().mockRejectedValue(new Error('API rate limit exceeded')),
          listMilestones: vi.fn().mockResolvedValue({ data: [] }),
        },
        pulls: {
          list: vi.fn().mockResolvedValue({ data: [] }),
        },
      }));

      await expect(trackProgress(defaultParams)).rejects.toThrow();
    });
  });

  describe('Issue Classification', () => {
    it('should only count session issues (not regular issues)', async () => {
      const mixedIssues = [
        ...mockIssues,
        {
          number: 100,
          title: 'Bug: something is broken',
          state: 'open',
          labels: [{ name: 'bug' }],
          milestone: null,
          created_at: '2025-11-23T00:00:00Z',
        },
      ];

      vi.mocked(await import('@octokit/rest')).Octokit.mockImplementationOnce(() => ({
        issues: {
          listForRepo: vi.fn().mockResolvedValue({ data: mixedIssues }),
          listMilestones: vi.fn().mockResolvedValue({ data: mockMilestones }),
        },
        pulls: {
          list: vi.fn().mockResolvedValue({ data: mockPullRequests }),
        },
      }));

      const result = await trackProgress(defaultParams);

      // Should still be 5, not 6
      expect(result.progress.overall.totalSessions).toBe(5);
    });
  });

  describe('Date Handling', () => {
    it('should set lastUpdated to current time', async () => {
      const before = new Date();
      const result = await trackProgress(defaultParams);
      const after = new Date();

      const lastUpdated = new Date(result.lastUpdated);
      expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should calculate estimated completion date', async () => {
      const result = await trackProgress(defaultParams);

      // Only if project is in progress and there's velocity data
      if (result.status === 'in_progress' && result.metrics.velocity > 0) {
        expect(result.metrics.estimatedCompletion).toBeDefined();
      }
    });
  });
});
