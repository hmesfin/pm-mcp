// src/prompts/__tests__/prompts.test.ts
// Tests for MCP prompt handlers

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listPrompts,
  getPrompt,
  generateDiscoveryQuestionsPrompt,
  generateArchitectureReviewPrompt,
  generateEstimateEffortPrompt,
} from '../index.js';

describe('Prompt Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listPrompts', () => {
    it('should return all available prompts', () => {
      const prompts = listPrompts();

      expect(prompts).toHaveLength(3);
    });

    it('should include discovery-questions prompt', () => {
      const prompts = listPrompts();

      const discoveryPrompt = prompts.find((p) => p.name === 'discovery-questions');
      expect(discoveryPrompt).toBeDefined();
      expect(discoveryPrompt?.description).toContain('discovery');
    });

    it('should include architecture-review prompt', () => {
      const prompts = listPrompts();

      const archPrompt = prompts.find((p) => p.name === 'architecture-review');
      expect(archPrompt).toBeDefined();
      expect(archPrompt?.description).toContain('architecture');
    });

    it('should include estimate-effort prompt', () => {
      const prompts = listPrompts();

      const estimatePrompt = prompts.find((p) => p.name === 'estimate-effort');
      expect(estimatePrompt).toBeDefined();
      expect(estimatePrompt?.description).toContain('estimation');
    });

    it('should have required arguments defined for each prompt', () => {
      const prompts = listPrompts();

      prompts.forEach((p) => {
        expect(p.arguments).toBeDefined();
        expect(Array.isArray(p.arguments)).toBe(true);
      });
    });

    it('should mark required arguments appropriately', () => {
      const prompts = listPrompts();

      const discoveryPrompt = prompts.find((p) => p.name === 'discovery-questions');
      const projectTypeArg = discoveryPrompt?.arguments?.find(
        (a) => a.name === 'projectType'
      );
      expect(projectTypeArg?.required).toBe(true);
    });
  });

  describe('getPrompt', () => {
    it('should return prompt messages for valid prompt name', () => {
      const result = getPrompt('discovery-questions', { projectType: 'blog' });

      expect(result).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(result.messages.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown prompt name', () => {
      expect(() => getPrompt('unknown-prompt', {})).toThrow();
    });

    it('should return user role message', () => {
      const result = getPrompt('discovery-questions', { projectType: 'blog' });

      expect(result.messages[0].role).toBe('user');
    });

    it('should include text content in message', () => {
      const result = getPrompt('discovery-questions', { projectType: 'blog' });

      expect(result.messages[0].content.type).toBe('text');
      expect(result.messages[0].content.text).toBeTruthy();
    });
  });

  describe('generateDiscoveryQuestionsPrompt', () => {
    it('should generate prompt for blog project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'blog',
      });

      expect(result.messages[0].content.text).toContain('blog');
    });

    it('should generate prompt for ecommerce project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'ecommerce',
      });

      expect(result.messages[0].content.text).toContain('ecommerce');
    });

    it('should generate prompt for saas project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'saas',
      });

      expect(result.messages[0].content.text).toContain('saas');
    });

    it('should generate prompt for social project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'social',
      });

      expect(result.messages[0].content.text).toContain('social');
    });

    it('should generate prompt for projectmanagement project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'projectmanagement',
      });

      expect(result.messages[0].content.text).toContain('project');
    });

    it('should generate prompt for custom project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'custom',
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should include previous answers in context when provided', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'blog',
        previousAnswers: {
          targetAudience: 'tech professionals',
          mainFeature: 'code snippets',
        },
      });

      expect(result.messages[0].content.text).toContain('tech professionals');
      expect(result.messages[0].content.text).toContain('code snippets');
    });

    it('should generate follow-up questions based on previous answers', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'blog',
        previousAnswers: {
          hasAuthentication: 'yes',
        },
      });

      // Should include context about authentication
      expect(result.messages[0].content.text.toLowerCase()).toContain('authentication');
    });

    it('should include domain-specific questions for project type', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'ecommerce',
      });

      const text = result.messages[0].content.text.toLowerCase();
      // Ecommerce should mention payment, products, or cart
      expect(
        text.includes('payment') ||
        text.includes('product') ||
        text.includes('cart') ||
        text.includes('commerce')
      ).toBe(true);
    });

    it('should include TDD-related questions', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'blog',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(
        text.includes('test') ||
        text.includes('coverage') ||
        text.includes('tdd')
      ).toBe(true);
    });

    it('should include scalability considerations', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'saas',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(
        text.includes('scale') ||
        text.includes('user') ||
        text.includes('performance')
      ).toBe(true);
    });
  });

  describe('generateArchitectureReviewPrompt', () => {
    const samplePlan = `# Project Plan: My App
## Phases
### Phase 1: Core Infrastructure
- Set up database
- Create API endpoints`;

    const sampleRequirements = `# Requirements
## Features
- User authentication
- Data management`;

    it('should generate prompt with plan and requirements', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      expect(result.messages[0].content.text).toContain('My App');
      expect(result.messages[0].content.text).toContain('User authentication');
    });

    it('should include plan content in prompt', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      expect(result.messages[0].content.text).toContain('Phase 1');
    });

    it('should include requirements content in prompt', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      expect(result.messages[0].content.text).toContain('Data management');
    });

    it('should focus on backend when focus=backend', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
        focus: 'backend',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('backend');
    });

    it('should focus on frontend when focus=frontend', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
        focus: 'frontend',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('frontend');
    });

    it('should focus on mobile when focus=mobile', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
        focus: 'mobile',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('mobile');
    });

    it('should focus on infrastructure when focus=infrastructure', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
        focus: 'infrastructure',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('infrastructure');
    });

    it('should review all areas when focus=all', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
        focus: 'all',
      });

      const text = result.messages[0].content.text.toLowerCase();
      // Should mention multiple areas or comprehensive review
      expect(
        text.includes('comprehensive') ||
        text.includes('all') ||
        (text.includes('backend') && text.includes('frontend'))
      ).toBe(true);
    });

    it('should default to all areas when focus not specified', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should include security review instructions', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('security');
    });

    it('should include scalability review instructions', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('scal');
    });

    it('should include pattern recognition instructions', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('pattern');
    });

    it('should include testability review instructions', () => {
      const result = generateArchitectureReviewPrompt({
        plan: samplePlan,
        requirements: sampleRequirements,
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(
        text.includes('test') ||
        text.includes('tdd')
      ).toBe(true);
    });
  });

  describe('generateEstimateEffortPrompt', () => {
    const sampleRequirements = `# Requirements
## Features
- User authentication
- Data management
- Dashboard`;

    it('should generate prompt with requirements', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      expect(result.messages[0].content.text).toContain('User authentication');
    });

    it('should include complexity level in prompt', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'advanced',
      });

      expect(result.messages[0].content.text.toLowerCase()).toContain('advanced');
    });

    it('should handle basic complexity', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'basic',
      });

      expect(result.messages[0].content.text.toLowerCase()).toContain('basic');
    });

    it('should handle intermediate complexity', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      expect(result.messages[0].content.text.toLowerCase()).toContain('intermediate');
    });

    it('should include similar projects when provided', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
        similarProjects: ['project-alpha', 'project-beta'],
      });

      expect(result.messages[0].content.text).toContain('project-alpha');
      expect(result.messages[0].content.text).toContain('project-beta');
    });

    it('should work without similar projects', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should include estimation guidelines', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(
        text.includes('estimate') ||
        text.includes('time') ||
        text.includes('session') ||
        text.includes('hour')
      ).toBe(true);
    });

    it('should include phase breakdown instructions', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(
        text.includes('phase') ||
        text.includes('session') ||
        text.includes('breakdown')
      ).toBe(true);
    });

    it('should include risk assessment instructions', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'advanced',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('risk');
    });

    it('should include confidence level instructions', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(text).toContain('confidence');
    });

    it('should include TDD time considerations', () => {
      const result = generateEstimateEffortPrompt({
        requirements: sampleRequirements,
        complexity: 'intermediate',
      });

      const text = result.messages[0].content.text.toLowerCase();
      expect(
        text.includes('tdd') ||
        text.includes('test') ||
        text.includes('red') ||
        text.includes('green')
      ).toBe(true);
    });
  });

  describe('Prompt Message Structure', () => {
    it('should return consistent message structure for all prompts', () => {
      const prompts = listPrompts();

      prompts.forEach((prompt) => {
        const args: Record<string, any> = {};

        // Provide required arguments
        prompt.arguments?.forEach((arg) => {
          if (arg.required) {
            if (arg.name === 'projectType') args.projectType = 'blog';
            if (arg.name === 'plan') args.plan = '# Plan';
            if (arg.name === 'requirements') args.requirements = '# Requirements';
            if (arg.name === 'complexity') args.complexity = 'intermediate';
          }
        });

        const result = getPrompt(prompt.name, args);

        expect(result.messages).toBeDefined();
        expect(result.messages.length).toBeGreaterThan(0);
        expect(result.messages[0]).toHaveProperty('role');
        expect(result.messages[0]).toHaveProperty('content');
        expect(result.messages[0].content).toHaveProperty('type');
        expect(result.messages[0].content).toHaveProperty('text');
      });
    });

    it('should produce non-empty text content', () => {
      const result = getPrompt('discovery-questions', { projectType: 'blog' });

      expect(result.messages[0].content.text.length).toBeGreaterThan(100);
    });

    it('should handle special characters in arguments', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'blog',
        previousAnswers: {
          description: 'A blog with "quotes" and <special> characters & more',
        },
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty previousAnswers object', () => {
      const result = generateDiscoveryQuestionsPrompt({
        projectType: 'blog',
        previousAnswers: {},
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should handle minimal plan content', () => {
      const result = generateArchitectureReviewPrompt({
        plan: '# Plan',
        requirements: '# Requirements',
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should handle minimal requirements content', () => {
      const result = generateEstimateEffortPrompt({
        requirements: 'Simple app',
        complexity: 'basic',
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should handle empty similarProjects array', () => {
      const result = generateEstimateEffortPrompt({
        requirements: '# Requirements',
        complexity: 'basic',
        similarProjects: [],
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should handle very long requirements', () => {
      const longRequirements = '# Requirements\n' + 'Feature description. '.repeat(1000);

      const result = generateEstimateEffortPrompt({
        requirements: longRequirements,
        complexity: 'advanced',
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });

    it('should handle very long plan', () => {
      const longPlan = '# Plan\n' + 'Session content. '.repeat(1000);

      const result = generateArchitectureReviewPrompt({
        plan: longPlan,
        requirements: '# Requirements',
      });

      expect(result.messages[0].content.text).toBeTruthy();
    });
  });
});
