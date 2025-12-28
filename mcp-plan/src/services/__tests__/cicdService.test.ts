// src/services/__tests__/cicdService.test.ts
// Tests for CI/CD integration service

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CICDService,
  extractSessionFromBranch,
  extractSessionFromPRBody,
  extractSessionFromPRTitle,
  SessionLinkResult,
} from '../cicdService.js';
import type { SessionStatus } from '../../types/common.js';

// Mock the webhook service
vi.mock('../webhookService.js', () => ({
  getWebhookService: () => ({
    triggerEvent: vi.fn().mockResolvedValue([]),
    onSessionStatusChange: vi.fn().mockResolvedValue([]),
  }),
}));

describe('Session Extraction', () => {
  describe('extractSessionFromBranch', () => {
    it('should extract session number from session-N branch pattern', () => {
      expect(extractSessionFromBranch('session-5')).toBe(5);
      expect(extractSessionFromBranch('session-12')).toBe(12);
      expect(extractSessionFromBranch('session-1')).toBe(1);
    });

    it('should extract session number from feature/session-N pattern', () => {
      expect(extractSessionFromBranch('feature/session-3')).toBe(3);
      expect(extractSessionFromBranch('feature/session-15')).toBe(15);
    });

    it('should extract session number from session/N pattern', () => {
      expect(extractSessionFromBranch('session/7')).toBe(7);
      expect(extractSessionFromBranch('session/42')).toBe(42);
    });

    it('should extract session number from s-N shorthand', () => {
      expect(extractSessionFromBranch('s-4')).toBe(4);
      expect(extractSessionFromBranch('s-10')).toBe(10);
    });

    it('should handle branch names with additional suffixes', () => {
      expect(extractSessionFromBranch('session-5-auth-implementation')).toBe(5);
      expect(extractSessionFromBranch('session-3-fix-tests')).toBe(3);
      expect(extractSessionFromBranch('feature/session-8-api-endpoints')).toBe(8);
    });

    it('should return null for non-matching branch names', () => {
      expect(extractSessionFromBranch('main')).toBeNull();
      expect(extractSessionFromBranch('develop')).toBeNull();
      expect(extractSessionFromBranch('feature/auth')).toBeNull();
      expect(extractSessionFromBranch('fix/bug-123')).toBeNull();
    });

    it('should return null for invalid session numbers', () => {
      expect(extractSessionFromBranch('session-0')).toBeNull();
      expect(extractSessionFromBranch('session--1')).toBeNull();
      expect(extractSessionFromBranch('session-abc')).toBeNull();
    });
  });

  describe('extractSessionFromPRBody', () => {
    it('should extract session from "Session #N" pattern', () => {
      expect(extractSessionFromPRBody('This PR implements Session #5')).toBe(5);
      expect(extractSessionFromPRBody('Completes Session #12 objectives')).toBe(12);
    });

    it('should extract session from "Session: N" pattern', () => {
      expect(extractSessionFromPRBody('Session: 7\nImplements auth flow')).toBe(7);
      expect(extractSessionFromPRBody('Details:\nSession: 3')).toBe(3);
    });

    it('should extract session from "Implements session N" pattern', () => {
      expect(extractSessionFromPRBody('This PR implements session 4')).toBe(4);
      expect(extractSessionFromPRBody('Implements session 10 features')).toBe(10);
    });

    it('should extract session from "Closes session N" pattern', () => {
      expect(extractSessionFromPRBody('Closes session 6')).toBe(6);
      expect(extractSessionFromPRBody('This closes session 15')).toBe(15);
    });

    it('should extract session from "Completes session N" pattern', () => {
      expect(extractSessionFromPRBody('Completes session 8')).toBe(8);
    });

    it('should extract session from markdown checkbox format', () => {
      expect(extractSessionFromPRBody('- [x] Session 5 complete')).toBe(5);
      expect(extractSessionFromPRBody('## Session 12\n- Done')).toBe(12);
    });

    it('should return the first session number found', () => {
      expect(extractSessionFromPRBody('Session #5 and Session #7')).toBe(5);
    });

    it('should return null for body without session reference', () => {
      expect(extractSessionFromPRBody('Fixed some bugs')).toBeNull();
      expect(extractSessionFromPRBody('Added new feature')).toBeNull();
      expect(extractSessionFromPRBody('')).toBeNull();
    });

    it('should handle case-insensitive matching', () => {
      expect(extractSessionFromPRBody('SESSION #5')).toBe(5);
      expect(extractSessionFromPRBody('session #5')).toBe(5);
      expect(extractSessionFromPRBody('Session #5')).toBe(5);
    });
  });

  describe('extractSessionFromPRTitle', () => {
    it('should extract session from "[Session N]" pattern', () => {
      expect(extractSessionFromPRTitle('[Session 5] Implement auth')).toBe(5);
      expect(extractSessionFromPRTitle('[Session 12] Add API endpoints')).toBe(12);
    });

    it('should extract session from "[S-N]" shorthand', () => {
      expect(extractSessionFromPRTitle('[S-3] Fix tests')).toBe(3);
      expect(extractSessionFromPRTitle('[S-15] Database models')).toBe(15);
    });

    it('should extract session from "Session N:" prefix', () => {
      expect(extractSessionFromPRTitle('Session 7: Auth implementation')).toBe(7);
      expect(extractSessionFromPRTitle('Session 4: Setup project')).toBe(4);
    });

    it('should return null for titles without session reference', () => {
      expect(extractSessionFromPRTitle('Fix authentication bug')).toBeNull();
      expect(extractSessionFromPRTitle('Add new feature')).toBeNull();
    });
  });
});

describe('CICDService', () => {
  let service: CICDService;

  beforeEach(() => {
    service = new CICDService();
  });

  describe('linkPRToSession', () => {
    it('should link PR to session from branch name', () => {
      const result = service.linkPRToSession({
        prNumber: 123,
        branch: 'session-5',
        title: 'Some PR title',
        body: 'Some description',
      });

      expect(result.found).toBe(true);
      expect(result.sessionNumber).toBe(5);
      expect(result.source).toBe('branch');
    });

    it('should link PR to session from title if branch has no match', () => {
      const result = service.linkPRToSession({
        prNumber: 123,
        branch: 'feature/auth',
        title: '[Session 7] Implement auth',
        body: 'Some description',
      });

      expect(result.found).toBe(true);
      expect(result.sessionNumber).toBe(7);
      expect(result.source).toBe('title');
    });

    it('should link PR to session from body if branch and title have no match', () => {
      const result = service.linkPRToSession({
        prNumber: 123,
        branch: 'feature/auth',
        title: 'Implement auth',
        body: 'This implements Session #3',
      });

      expect(result.found).toBe(true);
      expect(result.sessionNumber).toBe(3);
      expect(result.source).toBe('body');
    });

    it('should prioritize branch over title over body', () => {
      const result = service.linkPRToSession({
        prNumber: 123,
        branch: 'session-5',
        title: '[Session 7] Different session',
        body: 'Implements Session #9',
      });

      expect(result.sessionNumber).toBe(5);
      expect(result.source).toBe('branch');
    });

    it('should return not found when no session reference exists', () => {
      const result = service.linkPRToSession({
        prNumber: 123,
        branch: 'main',
        title: 'Some changes',
        body: 'Fixed bugs',
      });

      expect(result.found).toBe(false);
      expect(result.sessionNumber).toBeUndefined();
    });
  });

  describe('onPRMerged', () => {
    it('should return session update result when PR is linked to session', async () => {
      const result = await service.onPRMerged({
        owner: 'testuser',
        repo: 'testrepo',
        prNumber: 123,
        branch: 'session-5',
        title: 'Implement feature',
        body: 'Description',
        mergedBy: 'developer',
        mergedAt: new Date(),
      });

      expect(result.processed).toBe(true);
      expect(result.sessionNumber).toBe(5);
      expect(result.newStatus).toBe('completed');
    });

    it('should skip processing when PR has no session link', async () => {
      const result = await service.onPRMerged({
        owner: 'testuser',
        repo: 'testrepo',
        prNumber: 123,
        branch: 'main',
        title: 'Fix something',
        body: 'Description',
        mergedBy: 'developer',
        mergedAt: new Date(),
      });

      expect(result.processed).toBe(false);
      expect(result.reason).toContain('No session');
    });

    it('should include labels to update', async () => {
      const result = await service.onPRMerged({
        owner: 'testuser',
        repo: 'testrepo',
        prNumber: 123,
        branch: 'session-5',
        title: 'Implement feature',
        body: 'Description',
        mergedBy: 'developer',
        mergedAt: new Date(),
      });

      expect(result.labelsToAdd).toContain('completed');
      expect(result.labelsToRemove).toContain('in-progress');
    });

    it('should support custom status mapping', async () => {
      const result = await service.onPRMerged({
        owner: 'testuser',
        repo: 'testrepo',
        prNumber: 123,
        branch: 'session-5',
        title: 'Implement feature',
        body: 'Description',
        mergedBy: 'developer',
        mergedAt: new Date(),
        targetStatus: 'awaiting_approval',
      });

      expect(result.newStatus).toBe('awaiting_approval');
    });
  });

  describe('onPROpened', () => {
    it('should link PR to session and suggest status change', async () => {
      const result = await service.onPROpened({
        owner: 'testuser',
        repo: 'testrepo',
        prNumber: 123,
        branch: 'session-5',
        title: 'Implement feature',
        body: 'Description',
        author: 'developer',
      });

      expect(result.processed).toBe(true);
      expect(result.sessionNumber).toBe(5);
      expect(result.suggestedStatus).toBe('refactor_phase');
    });

    it('should skip when no session link found', async () => {
      const result = await service.onPROpened({
        owner: 'testuser',
        repo: 'testrepo',
        prNumber: 123,
        branch: 'feature/something',
        title: 'Add feature',
        body: 'Description',
        author: 'developer',
      });

      expect(result.processed).toBe(false);
    });
  });

  describe('generateIssueComment', () => {
    it('should generate PR merged comment', () => {
      const comment = service.generateIssueComment('pr_merged', {
        prNumber: 123,
        prTitle: 'Implement auth',
        mergedBy: 'developer',
        newStatus: 'completed',
      });

      expect(comment).toContain('PR #123');
      expect(comment).toContain('merged');
      expect(comment).toContain('completed');
    });

    it('should generate PR opened comment', () => {
      const comment = service.generateIssueComment('pr_opened', {
        prNumber: 456,
        prTitle: 'Add feature',
        author: 'contributor',
      });

      expect(comment).toContain('PR #456');
      expect(comment).toContain('opened');
    });
  });

  describe('getSessionIssueNumber', () => {
    it('should calculate issue number from session number', () => {
      // Default mapping: issue number = session number
      expect(service.getSessionIssueNumber(1)).toBe(1);
      expect(service.getSessionIssueNumber(5)).toBe(5);
    });

    it('should use custom mapping when provided', () => {
      const customService = new CICDService({
        sessionToIssueMapping: { 1: 10, 2: 20, 3: 30 },
      });

      expect(customService.getSessionIssueNumber(1)).toBe(10);
      expect(customService.getSessionIssueNumber(2)).toBe(20);
      expect(customService.getSessionIssueNumber(4)).toBe(4); // Fallback to default
    });
  });
});

describe('GitHub Actions Integration', () => {
  let service: CICDService;

  beforeEach(() => {
    service = new CICDService();
  });

  describe('parseGitHubEventPayload', () => {
    it('should parse pull_request merged event', () => {
      const payload = {
        action: 'closed',
        pull_request: {
          number: 123,
          merged: true,
          merged_at: '2024-01-15T10:00:00Z',
          merged_by: { login: 'developer' },
          head: { ref: 'session-5' },
          title: 'Implement feature',
          body: 'Description',
        },
        repository: {
          owner: { login: 'testuser' },
          name: 'testrepo',
        },
      };

      const result = service.parseGitHubEventPayload('pull_request', payload);

      expect(result.eventType).toBe('pr_merged');
      expect(result.prNumber).toBe(123);
      expect(result.branch).toBe('session-5');
      expect(result.owner).toBe('testuser');
      expect(result.repo).toBe('testrepo');
    });

    it('should parse pull_request opened event', () => {
      const payload = {
        action: 'opened',
        pull_request: {
          number: 456,
          head: { ref: 'session-7' },
          title: 'Add API',
          body: 'Description',
          user: { login: 'contributor' },
        },
        repository: {
          owner: { login: 'testuser' },
          name: 'testrepo',
        },
      };

      const result = service.parseGitHubEventPayload('pull_request', payload);

      expect(result.eventType).toBe('pr_opened');
      expect(result.prNumber).toBe(456);
      expect(result.author).toBe('contributor');
    });

    it('should return null for closed but not merged PR', () => {
      const payload = {
        action: 'closed',
        pull_request: {
          number: 123,
          merged: false,
          head: { ref: 'session-5' },
          title: 'Implement feature',
          body: 'Description',
        },
        repository: {
          owner: { login: 'testuser' },
          name: 'testrepo',
        },
      };

      const result = service.parseGitHubEventPayload('pull_request', payload);

      expect(result.eventType).toBe('pr_closed');
    });

    it('should handle missing fields gracefully', () => {
      const payload = {
        action: 'opened',
        pull_request: {
          number: 123,
          head: { ref: 'main' },
          title: 'Fix',
        },
        repository: {
          owner: { login: 'user' },
          name: 'repo',
        },
      };

      const result = service.parseGitHubEventPayload('pull_request', payload);

      expect(result.prNumber).toBe(123);
      expect(result.body).toBe('');
    });
  });

  describe('generateGitHubActionsWorkflow', () => {
    it('should generate a valid YAML workflow', () => {
      const workflow = service.generateGitHubActionsWorkflow();

      expect(workflow).toContain('name:');
      expect(workflow).toContain('on:');
      expect(workflow).toContain('pull_request:');
      expect(workflow).toContain('types: [opened, closed]');
      expect(workflow).toContain('jobs:');
    });

    it('should include session update steps', () => {
      const workflow = service.generateGitHubActionsWorkflow();

      expect(workflow).toContain('Update session status');
      expect(workflow).toContain('github.event.pull_request.merged');
    });

    it('should be customizable with options', () => {
      const workflow = service.generateGitHubActionsWorkflow({
        workflowName: 'Custom Session Tracker',
        branches: ['main', 'develop'],
      });

      expect(workflow).toContain('Custom Session Tracker');
      expect(workflow).toContain('main');
      expect(workflow).toContain('develop');
    });
  });
});

describe('Label Management', () => {
  let service: CICDService;

  beforeEach(() => {
    service = new CICDService();
  });

  describe('getLabelsForStatus', () => {
    it('should return correct labels for completed status', () => {
      const labels = service.getLabelsForStatus('completed');

      expect(labels.add).toContain('completed');
      expect(labels.remove).toContain('in-progress');
      expect(labels.remove).toContain('red-phase');
      expect(labels.remove).toContain('green-phase');
      expect(labels.remove).toContain('refactor-phase');
    });

    it('should return correct labels for in_progress status', () => {
      const labels = service.getLabelsForStatus('in_progress');

      expect(labels.add).toContain('in-progress');
      expect(labels.remove).toContain('not-started');
    });

    it('should return correct labels for blocked status', () => {
      const labels = service.getLabelsForStatus('blocked');

      expect(labels.add).toContain('blocked');
    });

    it('should return labels for TDD phases', () => {
      expect(service.getLabelsForStatus('red_phase').add).toContain('red-phase');
      expect(service.getLabelsForStatus('green_phase').add).toContain('green-phase');
      expect(service.getLabelsForStatus('refactor_phase').add).toContain('refactor-phase');
    });
  });
});
