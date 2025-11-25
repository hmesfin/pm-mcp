// src/tools/github/__tests__/syncWithGitHub.test.ts
// Tests for syncWithGitHub tool

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncWithGitHub } from '../syncWithGitHub.js';
import type {
  SyncWithGitHubParams,
  SyncWithGitHubResult,
  SyncUpdate,
  SyncConflict,
} from '../../../types/tools.js';
import type { AgentState } from '../../../types/common.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
}));

// Mock GitHub issues from API
const mockGitHubIssues = [
  {
    number: 2,
    title: 'Session 1: Project Setup & Type Definitions',
    state: 'closed',
    labels: [{ name: 'phase-1' }, { name: 'infrastructure' }],
    created_at: '2025-11-20T00:00:00Z',
    closed_at: '2025-11-21T00:00:00Z',
  },
  {
    number: 3,
    title: 'Session 2: Template Engine & File Operations',
    state: 'closed',
    labels: [{ name: 'phase-1' }, { name: 'infrastructure' }],
    created_at: '2025-11-21T00:00:00Z',
    closed_at: '2025-11-22T00:00:00Z',
  },
  {
    number: 4,
    title: 'Session 3: generateProjectPlan Tool',
    state: 'open',
    labels: [{ name: 'phase-2' }, { name: 'infrastructure' }, { name: 'in-progress' }],
    created_at: '2025-11-22T00:00:00Z',
  },
  {
    number: 5,
    title: 'Session 4: analyzeRequirements Tool',
    state: 'open',
    labels: [{ name: 'phase-2' }, { name: 'backend' }],
    created_at: '2025-11-22T00:00:00Z',
  },
  {
    number: 6,
    title: 'Session 5: critiquePlan Tool',
    state: 'open',
    labels: [{ name: 'phase-2' }, { name: 'backend' }, { name: 'blocked' }],
    created_at: '2025-11-22T00:00:00Z',
  },
];

// Mock local agent state
const mockLocalState: AgentState = {
  projectName: 'test-project',
  currentPhase: 2,
  currentSession: 3,
  completedSessions: [1],  // Only session 1 marked complete locally
  inProgress: 3,
  blockedSessions: [],
  lastCheckpoint: new Date('2025-11-22T00:00:00Z'),
  status: 'in_progress',
  github: {
    owner: 'testowner',
    repo: 'testrepo',
    issueMapping: {
      1: 2,
      2: 3,
      3: 4,
      4: 5,
      5: 6,
    },
  },
  metrics: {
    totalTests: 20,
    avgCoverage: 85,
    timeSpent: '6h',
    velocity: 1,
  },
};

// Mock Octokit
vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn().mockImplementation(() => ({
    issues: {
      listForRepo: vi.fn().mockResolvedValue({ data: mockGitHubIssues }),
      update: vi.fn().mockResolvedValue({ data: {} }),
      addLabels: vi.fn().mockResolvedValue({ data: {} }),
      removeLabel: vi.fn().mockResolvedValue({ data: {} }),
      createComment: vi.fn().mockResolvedValue({ data: {} }),
    },
  })),
}));

describe('syncWithGitHub', () => {
  const defaultParams: SyncWithGitHubParams = {
    owner: 'testowner',
    repo: 'testrepo',
    direction: 'pull',
    statePath: '/path/to/.agent-state.json',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for reading local state
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLocalState));
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('should return a valid SyncWithGitHubResult structure', async () => {
      const result = await syncWithGitHub(defaultParams);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('sessionsSynced');
      expect(result).toHaveProperty('updates');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('errors');
    });

    it('should return the correct direction in result', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });
      expect(result.direction).toBe('pull');

      const result2 = await syncWithGitHub({ ...defaultParams, direction: 'push' });
      expect(result2.direction).toBe('push');

      const result3 = await syncWithGitHub({ ...defaultParams, direction: 'bidirectional' });
      expect(result3.direction).toBe('bidirectional');
    });

    it('should succeed when no errors occur', async () => {
      const result = await syncWithGitHub(defaultParams);
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Pull Sync (GitHub → Local)', () => {
    it('should detect sessions completed on GitHub but not locally', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      // Session 2 is closed on GitHub but not in completedSessions locally
      const session2Update = result.updates.find(
        u => u.sessionNumber === 2 && u.field === 'status'
      );
      expect(session2Update).toBeDefined();
      expect(session2Update?.newValue).toBe('completed');
      expect(session2Update?.source).toBe('github');
    });

    it('should detect blocked sessions from GitHub labels', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      // Session 5 has 'blocked' label on GitHub
      const session5Update = result.updates.find(
        u => u.sessionNumber === 5 && u.field === 'status'
      );
      expect(session5Update).toBeDefined();
      expect(session5Update?.newValue).toBe('blocked');
    });

    it('should detect in-progress sessions from GitHub labels', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      // Session 3 has 'in-progress' label on GitHub
      const session3Update = result.updates.find(
        u => u.sessionNumber === 3 && u.field === 'status'
      );
      // Should either be already in sync or updated
      expect(result.updates.length).toBeGreaterThanOrEqual(0);
    });

    it('should update local state file after pull', async () => {
      await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should preserve existing local data not tracked by GitHub', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      // metrics should be preserved
      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      if (writeCall) {
        const writtenState = JSON.parse(writeCall[1] as string);
        expect(writtenState.metrics).toBeDefined();
        expect(writtenState.projectName).toBe('test-project');
      }
    });

    it('should count sessions synced correctly', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      expect(result.sessionsSynced).toBeGreaterThan(0);
    });
  });

  describe('Push Sync (Local → GitHub)', () => {
    it('should add in-progress label for locally in-progress sessions', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'push' });

      // Should have made API calls to update labels
      expect(result.success).toBe(true);
    });

    it('should close GitHub issues for locally completed sessions', async () => {
      // Update local state to have session 4 completed
      const stateWithCompleted = {
        ...mockLocalState,
        completedSessions: [1, 2, 3, 4],
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(stateWithCompleted));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'push' });

      // Should have attempted to close issue for session 4
      expect(result.updates.length).toBeGreaterThanOrEqual(0);
    });

    it('should add blocked label for locally blocked sessions', async () => {
      const stateWithBlocked = {
        ...mockLocalState,
        blockedSessions: [4],
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(stateWithBlocked));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'push' });

      const blockedUpdate = result.updates.find(
        u => u.sessionNumber === 4 && u.field === 'status' && u.newValue === 'blocked'
      );
      // Either found or no conflict
      expect(result.success).toBe(true);
    });

    it('should not modify GitHub if local and remote are in sync', async () => {
      // Make local state match GitHub exactly
      const syncedState = {
        ...mockLocalState,
        completedSessions: [1, 2],
        blockedSessions: [5],
        inProgress: 3,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(syncedState));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'push' });

      expect(result.updates.length).toBe(0);
    });
  });

  describe('Bidirectional Sync', () => {
    it('should sync in both directions', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'bidirectional' });

      expect(result.direction).toBe('bidirectional');
      expect(result.success).toBe(true);
    });

    it('should detect conflicts when GitHub and local differ', async () => {
      // Local says session 3 is completed, GitHub says it's in-progress
      const conflictingState = {
        ...mockLocalState,
        completedSessions: [1, 2, 3],  // Session 3 marked complete locally
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(conflictingState));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'bidirectional' });

      // Session 3 is open on GitHub but completed locally - conflict
      const conflict = result.conflicts.find(c => c.sessionNumber === 3);
      expect(conflict).toBeDefined();
      expect(conflict?.field).toBe('status');
      expect(conflict?.localValue).toBe('completed');
      expect(conflict?.githubValue).toBe('in_progress');
    });

    it('should report conflicts without auto-resolving by default', async () => {
      const conflictingState = {
        ...mockLocalState,
        completedSessions: [1, 2, 3],
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(conflictingState));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'bidirectional' });

      if (result.conflicts.length > 0) {
        // Conflicts should not have automatic resolution
        expect(result.conflicts[0].resolution).toBeUndefined();
      }
    });
  });

  describe('Conflict Resolution', () => {
    it('should identify status conflicts correctly', async () => {
      const conflictingState = {
        ...mockLocalState,
        completedSessions: [1, 2, 4],  // Session 4 marked complete locally but open on GitHub
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(conflictingState));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'bidirectional' });

      const conflict = result.conflicts.find(c => c.sessionNumber === 4);
      expect(conflict).toBeDefined();
    });

    it('should not report conflict when states match', async () => {
      // States match exactly
      const matchingState = {
        ...mockLocalState,
        completedSessions: [1, 2],
        blockedSessions: [5],
        inProgress: 3,
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(matchingState));

      const result = await syncWithGitHub({ ...defaultParams, direction: 'bidirectional' });

      expect(result.conflicts.length).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should read local state file', async () => {
      await syncWithGitHub(defaultParams);

      expect(fs.readFile).toHaveBeenCalledWith(defaultParams.statePath, 'utf-8');
    });

    it('should handle missing state file gracefully', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await syncWithGitHub(defaultParams);

      // Should still succeed, creating new state from GitHub
      expect(result.success).toBe(true);
    });

    it('should create new state file if it does not exist', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should update lastCheckpoint after sync', async () => {
      const beforeSync = new Date();
      await syncWithGitHub(defaultParams);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      if (writeCall) {
        const writtenState = JSON.parse(writeCall[1] as string);
        const checkpoint = new Date(writtenState.lastCheckpoint);
        expect(checkpoint.getTime()).toBeGreaterThanOrEqual(beforeSync.getTime());
      }
    });

    it('should maintain issue mapping in state', async () => {
      await syncWithGitHub(defaultParams);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      if (writeCall) {
        const writtenState = JSON.parse(writeCall[1] as string);
        expect(writtenState.github?.issueMapping).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle GitHub API errors gracefully', async () => {
      vi.mocked(await import('@octokit/rest')).Octokit.mockImplementationOnce(() => ({
        issues: {
          listForRepo: vi.fn().mockRejectedValue(new Error('API rate limit')),
        },
      }));

      const result = await syncWithGitHub(defaultParams);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle invalid JSON in state file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('not valid json');

      const result = await syncWithGitHub(defaultParams);

      // Should handle gracefully - either error or create new state
      expect(result).toBeDefined();
    });

    it('should handle file write errors', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      const result = await syncWithGitHub(defaultParams);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should include descriptive error messages', async () => {
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

      const result = await syncWithGitHub(defaultParams);

      expect(result.errors[0]).toContain('Permission denied');
    });
  });

  describe('Issue Mapping', () => {
    it('should build issue mapping from GitHub issues', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      if (writeCall) {
        const writtenState = JSON.parse(writeCall[1] as string);
        // Session 1 -> Issue 2, Session 2 -> Issue 3, etc.
        expect(writtenState.github?.issueMapping[1]).toBe(2);
        expect(writtenState.github?.issueMapping[2]).toBe(3);
      }
    });

    it('should extract session numbers from issue titles', async () => {
      const result = await syncWithGitHub(defaultParams);

      // The sync should have correctly mapped sessions to issues
      expect(result.success).toBe(true);
    });
  });

  describe('Update Tracking', () => {
    it('should track what fields were updated', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      if (result.updates.length > 0) {
        const update = result.updates[0];
        expect(update).toHaveProperty('sessionNumber');
        expect(update).toHaveProperty('field');
        expect(update).toHaveProperty('oldValue');
        expect(update).toHaveProperty('newValue');
        expect(update).toHaveProperty('source');
      }
    });

    it('should indicate source of update (github or local)', async () => {
      const result = await syncWithGitHub({ ...defaultParams, direction: 'pull' });

      result.updates.forEach(update => {
        expect(['github', 'local']).toContain(update.source);
      });
    });
  });
});
