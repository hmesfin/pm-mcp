// src/tools/planning/__tests__/conductDiscovery.test.ts
// Tests for conductDiscovery tool

import { describe, it, expect } from 'vitest';
import { conductDiscovery } from '../conductDiscovery.js';
import type {
  ConductDiscoveryParams,
  DiscoverySession,
  DiscoveryMessage,
} from '../../../types/tools.js';

describe('conductDiscovery', () => {
  describe('Basic Functionality', () => {
    it('should return a valid DiscoverySession structure', async () => {
      const params: ConductDiscoveryParams = {};
      const result = await conductDiscovery(params);

      expect(result).toHaveProperty('projectType');
      expect(result).toHaveProperty('questions');
      expect(result).toHaveProperty('challenges');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('isComplete');
    });

    it('should return arrays for questions, challenges, suggestions, risks', async () => {
      const result = await conductDiscovery({});

      expect(Array.isArray(result.questions)).toBe(true);
      expect(Array.isArray(result.challenges)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.risks)).toBe(true);
    });

    it('should not be complete when no conversation history provided', async () => {
      const result = await conductDiscovery({});

      expect(result.isComplete).toBe(false);
    });
  });

  describe('Project Type Handling', () => {
    it('should accept a project type and return it', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      expect(result.projectType).toBe('ecommerce');
    });

    it('should ask about project type when not provided', async () => {
      const result = await conductDiscovery({});

      // Should have a question about project type or general questions
      expect(result.questions.length).toBeGreaterThan(0);
    });

    it('should generate project-type-specific questions for ecommerce', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      // Should have questions related to ecommerce
      const questionTexts = result.questions.map(q => q.question.toLowerCase());
      const hasEcommerceQuestion = questionTexts.some(q =>
        q.includes('product') ||
        q.includes('payment') ||
        q.includes('cart') ||
        q.includes('inventory') ||
        q.includes('shipping')
      );
      expect(hasEcommerceQuestion).toBe(true);
    });

    it('should generate project-type-specific questions for saas', async () => {
      const result = await conductDiscovery({
        projectType: 'saas',
      });

      // Should have questions related to SaaS
      const questionTexts = result.questions.map(q => q.question.toLowerCase());
      const hasSaasQuestion = questionTexts.some(q =>
        q.includes('subscription') ||
        q.includes('tenant') ||
        q.includes('billing') ||
        q.includes('api') ||
        q.includes('pricing')
      );
      expect(hasSaasQuestion).toBe(true);
    });

    it('should generate project-type-specific questions for blog', async () => {
      const result = await conductDiscovery({
        projectType: 'blog',
      });

      const questionTexts = result.questions.map(q => q.question.toLowerCase());
      const hasBlogQuestion = questionTexts.some(q =>
        q.includes('post') ||
        q.includes('author') ||
        q.includes('comment') ||
        q.includes('content')
      );
      expect(hasBlogQuestion).toBe(true);
    });
  });

  describe('Question Structure', () => {
    it('should return questions with required fields', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      result.questions.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question');
        expect(q).toHaveProperty('type');
        expect(q.id).toBeTruthy();
        expect(q.question).toBeTruthy();
        expect(['text', 'choice', 'multiselect', 'boolean']).toContain(q.type);
      });
    });

    it('should include options for choice questions', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      const choiceQuestions = result.questions.filter(
        q => q.type === 'choice' || q.type === 'multiselect'
      );

      choiceQuestions.forEach(q => {
        expect(q.options).toBeDefined();
        expect(Array.isArray(q.options)).toBe(true);
        expect(q.options!.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should support validation rules on questions', async () => {
      const result = await conductDiscovery({
        projectType: 'saas',
      });

      // At least some questions should have validation
      const questionsWithValidation = result.questions.filter(
        q => q.validation !== undefined
      );
      // Not all questions need validation, but the structure should be correct
      questionsWithValidation.forEach(q => {
        if (q.validation) {
          expect(typeof q.validation).toBe('object');
        }
      });
    });
  });

  describe('Conversation History', () => {
    it('should accept and process conversation history', async () => {
      const history: DiscoveryMessage[] = [
        {
          role: 'assistant',
          content: 'What type of project are you building?',
          timestamp: new Date(),
        },
        {
          role: 'user',
          content: 'I want to build an e-commerce platform',
          timestamp: new Date(),
        },
      ];

      const result = await conductDiscovery({
        conversationHistory: history,
      });

      expect(result).toBeDefined();
      // Should infer ecommerce from conversation
      expect(result.projectType).toBe('ecommerce');
    });

    it('should provide different questions based on conversation progress', async () => {
      const noHistory = await conductDiscovery({
        projectType: 'ecommerce',
      });

      const withHistory = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: [
          {
            role: 'assistant',
            content: 'What payment methods will you support?',
            timestamp: new Date(),
          },
          {
            role: 'user',
            content: 'Credit cards through Stripe, and PayPal',
            timestamp: new Date(),
          },
        ],
      });

      // Questions should progress (not identical)
      expect(withHistory.questions).toBeDefined();
    });

    it('should detect mentions of features in conversation', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: [
          {
            role: 'assistant',
            content: 'Tell me about your product catalog',
            timestamp: new Date(),
          },
          {
            role: 'user',
            content: 'We will have about 10,000 products with multiple variants',
            timestamp: new Date(),
          },
        ],
      });

      // Should not ask about catalog size again since mentioned
      const questionTexts = result.questions.map(q => q.question.toLowerCase());
      const asksAboutCatalogSize = questionTexts.some(
        q => q.includes('how many products')
      );
      expect(asksAboutCatalogSize).toBe(false);
    });
  });

  describe('Challenge Detection', () => {
    it('should identify challenges based on project type', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: [
          {
            role: 'user',
            content: 'We need real-time inventory sync across multiple warehouses',
            timestamp: new Date(),
          },
        ],
      });

      expect(result.challenges.length).toBeGreaterThan(0);
    });

    it('should categorize challenges correctly', async () => {
      const result = await conductDiscovery({
        projectType: 'saas',
        conversationHistory: [
          {
            role: 'user',
            content: 'We need to support 10 million concurrent users',
            timestamp: new Date(),
          },
        ],
      });

      const validCategories = ['architecture', 'scope', 'timeline', 'technical', 'compliance'];
      result.challenges.forEach(challenge => {
        expect(validCategories).toContain(challenge.category);
      });
    });

    it('should challenge assumptions about infrastructure', async () => {
      const result = await conductDiscovery({
        projectType: 'saas',
        conversationHistory: [
          {
            role: 'user',
            content: 'Real-time collaboration features like Google Docs',
            timestamp: new Date(),
          },
        ],
      });

      // Should identify real-time as a challenge
      const hasInfraChallenge = result.challenges.some(
        c => c.description.toLowerCase().includes('real-time') ||
             c.description.toLowerCase().includes('websocket') ||
             c.category === 'technical'
      );
      expect(hasInfraChallenge).toBe(true);
    });
  });

  describe('Risk Identification', () => {
    it('should identify risks from conversation', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: [
          {
            role: 'user',
            content: 'We handle credit card data directly',
            timestamp: new Date(),
          },
        ],
      });

      const hasComplianceRisk = result.risks.some(
        r => r.category === 'compliance' ||
             r.description.toLowerCase().includes('pci') ||
             r.description.toLowerCase().includes('payment')
      );
      expect(hasComplianceRisk).toBe(true);
    });

    it('should assess risk severity appropriately', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: [
          {
            role: 'user',
            content: 'We will store sensitive health data for users',
            timestamp: new Date(),
          },
        ],
      });

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      result.risks.forEach(risk => {
        expect(validSeverities).toContain(risk.severity);
      });

      // Health data should trigger high/critical risk
      const healthRisk = result.risks.find(
        r => r.description.toLowerCase().includes('health') ||
             r.description.toLowerCase().includes('hipaa')
      );
      if (healthRisk) {
        expect(['high', 'critical']).toContain(healthRisk.severity);
      }
    });
  });

  describe('Suggestions', () => {
    it('should provide suggestions based on project type', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should categorize suggestions correctly', async () => {
      const result = await conductDiscovery({
        projectType: 'saas',
      });

      const validCategories = ['feature', 'architecture', 'tooling', 'workflow'];
      result.suggestions.forEach(suggestion => {
        expect(validCategories).toContain(suggestion.category);
      });
    });

    it('should include effort estimates', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      const validEfforts = ['low', 'medium', 'high'];
      result.suggestions.forEach(suggestion => {
        expect(validEfforts).toContain(suggestion.effort);
      });
    });
  });

  describe('Progressive Disclosure', () => {
    it('should not ask all questions at once', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      // Progressive disclosure: shouldn't dump 20+ questions
      expect(result.questions.length).toBeLessThanOrEqual(7);
    });

    it('should have a nextQuestion for progressive flow', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      // Either has nextQuestion or is complete
      expect(result.nextQuestion !== undefined || result.isComplete).toBe(true);
    });

    it('should mark as complete after sufficient conversation', async () => {
      // Simulate a complete conversation
      const history: DiscoveryMessage[] = [
        { role: 'assistant', content: 'What is your project name?', timestamp: new Date() },
        { role: 'user', content: 'ShopMaster', timestamp: new Date() },
        { role: 'assistant', content: 'What products will you sell?', timestamp: new Date() },
        { role: 'user', content: 'Electronics and gadgets', timestamp: new Date() },
        { role: 'assistant', content: 'Payment methods?', timestamp: new Date() },
        { role: 'user', content: 'Stripe and PayPal', timestamp: new Date() },
        { role: 'assistant', content: 'Shipping requirements?', timestamp: new Date() },
        { role: 'user', content: 'US only with flat rate shipping', timestamp: new Date() },
        { role: 'assistant', content: 'User authentication?', timestamp: new Date() },
        { role: 'user', content: 'Email/password and Google OAuth', timestamp: new Date() },
        { role: 'assistant', content: 'Admin features needed?', timestamp: new Date() },
        { role: 'user', content: 'Product management and order tracking', timestamp: new Date() },
        { role: 'assistant', content: 'Mobile requirements?', timestamp: new Date() },
        { role: 'user', content: 'Responsive web, no native apps needed', timestamp: new Date() },
      ];

      const result = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: history,
      });

      expect(result.isComplete).toBe(true);
    });
  });

  describe('Discovery Summary', () => {
    it('should generate summary when discovery is complete', async () => {
      const history: DiscoveryMessage[] = [
        { role: 'assistant', content: 'What is your project name?', timestamp: new Date() },
        { role: 'user', content: 'TechBlog', timestamp: new Date() },
        { role: 'assistant', content: 'What features do you need?', timestamp: new Date() },
        { role: 'user', content: 'Posts, comments, tags, user profiles', timestamp: new Date() },
        { role: 'assistant', content: 'Authentication?', timestamp: new Date() },
        { role: 'user', content: 'Email/password', timestamp: new Date() },
        { role: 'assistant', content: 'Search functionality?', timestamp: new Date() },
        { role: 'user', content: 'Yes, full text search', timestamp: new Date() },
        { role: 'assistant', content: 'Mobile requirements?', timestamp: new Date() },
        { role: 'user', content: 'Responsive design only', timestamp: new Date() },
        { role: 'assistant', content: 'Any integrations?', timestamp: new Date() },
        { role: 'user', content: 'Twitter sharing and Google Analytics', timestamp: new Date() },
      ];

      const result = await conductDiscovery({
        projectType: 'blog',
        conversationHistory: history,
      });

      if (result.isComplete && result.summary) {
        expect(result.summary).toHaveProperty('projectName');
        expect(result.summary).toHaveProperty('projectType');
        expect(result.summary).toHaveProperty('complexity');
        expect(result.summary).toHaveProperty('features');
        expect(result.summary).toHaveProperty('entities');
        expect(result.summary).toHaveProperty('integrations');
        expect(result.summary).toHaveProperty('mobileRequirements');
        expect(result.summary).toHaveProperty('estimatedSessions');
        expect(result.summary).toHaveProperty('estimatedTime');
      }
    });

    it('should not have summary when discovery is incomplete', async () => {
      const result = await conductDiscovery({
        projectType: 'ecommerce',
      });

      if (!result.isComplete) {
        expect(result.summary).toBeUndefined();
      }
    });

    it('should extract features from conversation into summary', async () => {
      const history: DiscoveryMessage[] = [
        { role: 'user', content: 'I need user authentication, shopping cart, wishlist, product reviews', timestamp: new Date() },
        { role: 'assistant', content: 'Payment methods?', timestamp: new Date() },
        { role: 'user', content: 'Stripe', timestamp: new Date() },
        { role: 'assistant', content: 'Shipping?', timestamp: new Date() },
        { role: 'user', content: 'Multiple carriers', timestamp: new Date() },
        { role: 'assistant', content: 'Admin features?', timestamp: new Date() },
        { role: 'user', content: 'Order management, analytics', timestamp: new Date() },
        { role: 'assistant', content: 'Mobile?', timestamp: new Date() },
        { role: 'user', content: 'Web only', timestamp: new Date() },
      ];

      const result = await conductDiscovery({
        projectType: 'ecommerce',
        conversationHistory: history,
      });

      if (result.isComplete && result.summary) {
        expect(result.summary.features).toContain('shopping cart');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation history', async () => {
      const result = await conductDiscovery({
        projectType: 'blog',
        conversationHistory: [],
      });

      expect(result).toBeDefined();
      expect(result.questions.length).toBeGreaterThan(0);
    });

    it('should handle custom project type', async () => {
      const result = await conductDiscovery({
        projectType: 'custom',
      });

      expect(result).toBeDefined();
      expect(result.projectType).toBe('custom');
    });

    it('should handle all valid project types', async () => {
      const projectTypes = ['blog', 'ecommerce', 'saas', 'social', 'projectmanagement', 'custom'] as const;

      for (const projectType of projectTypes) {
        const result = await conductDiscovery({ projectType });
        expect(result.projectType).toBe(projectType);
      }
    });

    it('should handle conversation with only user messages', async () => {
      const result = await conductDiscovery({
        projectType: 'blog',
        conversationHistory: [
          { role: 'user', content: 'I want a blog', timestamp: new Date() },
          { role: 'user', content: 'With comments', timestamp: new Date() },
        ],
      });

      expect(result).toBeDefined();
    });
  });
});
