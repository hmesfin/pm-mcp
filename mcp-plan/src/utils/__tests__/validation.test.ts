// src/utils/__tests__/validation.test.ts
// Tests for input validation utilities

import { describe, it, expect } from 'vitest';
import {
  validateGenerateProjectPlanParams,
  validateSetupGitHubProjectParams,
  validateTrackProgressParams,
  validateSyncWithGitHubParams,
  validateAnalyzeRequirementsParams,
  validateCritiquePlanParams,
  validateReviewArchitectureParams,
  validateEstimateEffortParams,
  validateDiscoveryQuestionsPromptParams,
  validateArchitectureReviewPromptParams,
  validateEstimateEffortPromptParams,
  ValidationError,
} from '../validation.js';

describe('Validation Utilities', () => {
  describe('validateGenerateProjectPlanParams', () => {
    it('should pass with valid requirementsPath', () => {
      const result = validateGenerateProjectPlanParams({
        requirementsPath: '/path/to/REQUIREMENTS.md',
        outputPath: '/path/to/output',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should pass with valid requirements content', () => {
      const result = validateGenerateProjectPlanParams({
        requirements: '# My Requirements',
        outputPath: '/path/to/output',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without outputPath', () => {
      const result = validateGenerateProjectPlanParams({
        requirements: '# My Requirements',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outputPath');
    });

    it('should fail without requirements or requirementsPath', () => {
      const result = validateGenerateProjectPlanParams({
        outputPath: '/path/to/output',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate templateType enum', () => {
      const result = validateGenerateProjectPlanParams({
        requirements: '# My Requirements',
        outputPath: '/path/to/output',
        templateType: 'invalid' as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('templateType');
    });

    it('should accept valid templateType', () => {
      const result = validateGenerateProjectPlanParams({
        requirements: '# My Requirements',
        outputPath: '/path/to/output',
        templateType: 'blog',
      });

      expect(result.success).toBe(true);
    });

    it('should return sanitized data', () => {
      const result = validateGenerateProjectPlanParams({
        requirements: '# My Requirements  ',
        outputPath: '  /path/to/output  ',
      });

      expect(result.success).toBe(true);
      expect(result.data?.outputPath).toBe('/path/to/output');
    });
  });

  describe('validateSetupGitHubProjectParams', () => {
    it('should pass with valid params', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'myuser',
        repo: 'myrepo',
        planPath: '/path/to/PROJECT_PLAN.md',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without owner', () => {
      const result = validateSetupGitHubProjectParams({
        repo: 'myrepo',
        planPath: '/path/to/PROJECT_PLAN.md',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('owner');
    });

    it('should fail without repo', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'myuser',
        planPath: '/path/to/PROJECT_PLAN.md',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('repo');
    });

    it('should fail without planPath', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'myuser',
        repo: 'myrepo',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('planPath');
    });

    it('should validate owner format (no spaces)', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'my user',
        repo: 'myrepo',
        planPath: '/path/to/PROJECT_PLAN.md',
      });

      expect(result.success).toBe(false);
    });

    it('should validate repo format (no spaces)', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'myuser',
        repo: 'my repo',
        planPath: '/path/to/PROJECT_PLAN.md',
      });

      expect(result.success).toBe(false);
    });

    it('should accept optional createProject boolean', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'myuser',
        repo: 'myrepo',
        planPath: '/path/to/PROJECT_PLAN.md',
        createProject: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.createProject).toBe(false);
    });

    it('should accept optional createMilestones boolean', () => {
      const result = validateSetupGitHubProjectParams({
        owner: 'myuser',
        repo: 'myrepo',
        planPath: '/path/to/PROJECT_PLAN.md',
        createMilestones: false,
      });

      expect(result.success).toBe(true);
      expect(result.data?.createMilestones).toBe(false);
    });
  });

  describe('validateTrackProgressParams', () => {
    it('should pass with valid params', () => {
      const result = validateTrackProgressParams({
        owner: 'myuser',
        repo: 'myrepo',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without owner', () => {
      const result = validateTrackProgressParams({
        repo: 'myrepo',
      });

      expect(result.success).toBe(false);
    });

    it('should fail without repo', () => {
      const result = validateTrackProgressParams({
        owner: 'myuser',
      });

      expect(result.success).toBe(false);
    });

    it('should validate format enum', () => {
      const result = validateTrackProgressParams({
        owner: 'myuser',
        repo: 'myrepo',
        format: 'invalid' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid format', () => {
      const result = validateTrackProgressParams({
        owner: 'myuser',
        repo: 'myrepo',
        format: 'detailed',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('validateSyncWithGitHubParams', () => {
    it('should pass with valid params', () => {
      const result = validateSyncWithGitHubParams({
        owner: 'myuser',
        repo: 'myrepo',
        direction: 'pull',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without direction', () => {
      const result = validateSyncWithGitHubParams({
        owner: 'myuser',
        repo: 'myrepo',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('direction');
    });

    it('should validate direction enum', () => {
      const result = validateSyncWithGitHubParams({
        owner: 'myuser',
        repo: 'myrepo',
        direction: 'invalid' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should accept all valid directions', () => {
      const directions = ['pull', 'push', 'bidirectional'] as const;

      directions.forEach((direction) => {
        const result = validateSyncWithGitHubParams({
          owner: 'myuser',
          repo: 'myrepo',
          direction,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateAnalyzeRequirementsParams', () => {
    it('should pass with valid requirements', () => {
      const result = validateAnalyzeRequirementsParams({
        requirements: '# My Requirements\n\n## Features',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without requirements', () => {
      const result = validateAnalyzeRequirementsParams({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('requirements');
    });

    it('should fail with empty requirements', () => {
      const result = validateAnalyzeRequirementsParams({
        requirements: '',
      });

      expect(result.success).toBe(false);
    });

    it('should fail with whitespace-only requirements', () => {
      const result = validateAnalyzeRequirementsParams({
        requirements: '   \n\t  ',
      });

      expect(result.success).toBe(false);
    });

    it('should validate projectType enum', () => {
      const result = validateAnalyzeRequirementsParams({
        requirements: '# My Requirements',
        projectType: 'invalid' as any,
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateCritiquePlanParams', () => {
    it('should pass with valid planPath', () => {
      const result = validateCritiquePlanParams({
        planPath: '/path/to/PROJECT_PLAN.md',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without planPath', () => {
      const result = validateCritiquePlanParams({});

      expect(result.success).toBe(false);
      expect(result.error).toContain('planPath');
    });

    it('should fail with empty planPath', () => {
      const result = validateCritiquePlanParams({
        planPath: '',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('validateReviewArchitectureParams', () => {
    it('should pass with planPath and requirementsPath', () => {
      const result = validateReviewArchitectureParams({
        planPath: '/path/to/PROJECT_PLAN.md',
        requirementsPath: '/path/to/REQUIREMENTS.md',
      });

      expect(result.success).toBe(true);
    });

    it('should pass with plan and requirements content', () => {
      const result = validateReviewArchitectureParams({
        plan: '# Project Plan',
        requirements: '# Requirements',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without any plan source', () => {
      const result = validateReviewArchitectureParams({
        requirements: '# Requirements',
      });

      expect(result.success).toBe(false);
    });

    it('should fail without any requirements source', () => {
      const result = validateReviewArchitectureParams({
        plan: '# Project Plan',
      });

      expect(result.success).toBe(false);
    });

    it('should validate focus enum', () => {
      const result = validateReviewArchitectureParams({
        plan: '# Project Plan',
        requirements: '# Requirements',
        focus: 'invalid' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should accept all valid focus values', () => {
      const focusValues = ['backend', 'frontend', 'mobile', 'infrastructure', 'all'] as const;

      focusValues.forEach((focus) => {
        const result = validateReviewArchitectureParams({
          plan: '# Project Plan',
          requirements: '# Requirements',
          focus,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validateEstimateEffortParams', () => {
    it('should pass with requirements', () => {
      const result = validateEstimateEffortParams({
        requirements: '# Requirements',
      });

      expect(result.success).toBe(true);
    });

    it('should pass with plan', () => {
      const result = validateEstimateEffortParams({
        plan: '# Project Plan',
      });

      expect(result.success).toBe(true);
    });

    it('should fail without requirements or plan', () => {
      const result = validateEstimateEffortParams({});

      expect(result.success).toBe(false);
    });

    it('should validate complexity enum', () => {
      const result = validateEstimateEffortParams({
        requirements: '# Requirements',
        complexity: 'invalid' as any,
      });

      expect(result.success).toBe(false);
    });

    it('should accept valid features array', () => {
      const result = validateEstimateEffortParams({
        requirements: '# Requirements',
        features: ['auth', 'payments'],
      });

      expect(result.success).toBe(true);
    });

    it('should accept valid similarProjects array', () => {
      const result = validateEstimateEffortParams({
        requirements: '# Requirements',
        similarProjects: ['project-a', 'project-b'],
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Prompt Validation', () => {
    describe('validateDiscoveryQuestionsPromptParams', () => {
      it('should pass with valid projectType', () => {
        const result = validateDiscoveryQuestionsPromptParams({
          projectType: 'blog',
        });

        expect(result.success).toBe(true);
      });

      it('should fail without projectType', () => {
        const result = validateDiscoveryQuestionsPromptParams({});

        expect(result.success).toBe(false);
      });

      it('should validate projectType enum', () => {
        const result = validateDiscoveryQuestionsPromptParams({
          projectType: 'invalid' as any,
        });

        expect(result.success).toBe(false);
      });

      it('should accept previousAnswers object', () => {
        const result = validateDiscoveryQuestionsPromptParams({
          projectType: 'blog',
          previousAnswers: { question1: 'answer1' },
        });

        expect(result.success).toBe(true);
      });
    });

    describe('validateArchitectureReviewPromptParams', () => {
      it('should pass with valid params', () => {
        const result = validateArchitectureReviewPromptParams({
          plan: '# Plan',
          requirements: '# Requirements',
        });

        expect(result.success).toBe(true);
      });

      it('should fail without plan', () => {
        const result = validateArchitectureReviewPromptParams({
          requirements: '# Requirements',
        });

        expect(result.success).toBe(false);
      });

      it('should fail without requirements', () => {
        const result = validateArchitectureReviewPromptParams({
          plan: '# Plan',
        });

        expect(result.success).toBe(false);
      });
    });

    describe('validateEstimateEffortPromptParams', () => {
      it('should pass with valid params', () => {
        const result = validateEstimateEffortPromptParams({
          requirements: '# Requirements',
          complexity: 'intermediate',
        });

        expect(result.success).toBe(true);
      });

      it('should fail without requirements', () => {
        const result = validateEstimateEffortPromptParams({
          complexity: 'intermediate',
        });

        expect(result.success).toBe(false);
      });

      it('should fail without complexity', () => {
        const result = validateEstimateEffortPromptParams({
          requirements: '# Requirements',
        });

        expect(result.success).toBe(false);
      });

      it('should validate complexity enum', () => {
        const result = validateEstimateEffortPromptParams({
          requirements: '# Requirements',
          complexity: 'invalid' as any,
        });

        expect(result.success).toBe(false);
      });
    });
  });

  describe('ValidationError', () => {
    it('should create error with message', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });

    it('should create error with field and details', () => {
      const error = new ValidationError('Invalid input', 'username', {
        received: 'ab',
        expected: 'min 3 characters',
      });

      expect(error.field).toBe('username');
      expect(error.details).toEqual({
        received: 'ab',
        expected: 'min 3 characters',
      });
    });

    it('should be instanceof Error', () => {
      const error = new ValidationError('test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ValidationError).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new ValidationError('test');

      expect(error.stack).toBeDefined();
    });
  });
});
