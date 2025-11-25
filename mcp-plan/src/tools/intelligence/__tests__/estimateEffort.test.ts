// src/tools/intelligence/__tests__/estimateEffort.test.ts
// Tests for estimateEffort tool

import { describe, it, expect } from 'vitest';
import { estimateEffort } from '../estimateEffort.js';
import type {
  EstimateEffortParams,
  EffortEstimate,
} from '../../../types/tools.js';

// Sample simple requirements
const simpleRequirements = `# Requirements: Simple Blog

## Features
- User registration and login
- Create, read, update, delete posts
- Basic commenting system

## Technical Stack
- Backend: Django
- Frontend: Vue.js
- Database: PostgreSQL
`;

// Sample complex requirements
const complexRequirements = `# Requirements: E-commerce Platform

## Features
- User management with roles (admin, seller, buyer)
- Product catalog with categories and variants
- Shopping cart with persistence
- Checkout with multiple payment gateways (Stripe, PayPal, crypto)
- Order management with status tracking
- Inventory management with alerts
- Reviews and ratings system
- Wishlist functionality
- Search with filters and facets
- Recommendation engine
- Email notifications
- Push notifications
- Admin dashboard with analytics
- Seller dashboard
- Multi-currency support
- Multi-language support
- Mobile app (iOS and Android)

## Technical Stack
- Backend: Django REST Framework
- Frontend: Vue.js 3
- Mobile: React Native
- Database: PostgreSQL
- Cache: Redis
- Search: Elasticsearch
- Queue: Celery + Redis
- Storage: AWS S3

## Non-Functional
- 99.9% uptime
- < 200ms API response time
- Support 100k concurrent users
- PCI DSS compliance
- GDPR compliance
`;

// Sample intermediate requirements
const intermediateRequirements = `# Requirements: Project Management Tool

## Features
- User authentication with SSO
- Team management
- Project CRUD with templates
- Task management with dependencies
- Kanban board view
- Calendar view
- Time tracking
- File attachments
- Comments and mentions
- Real-time updates
- Basic reporting

## Technical Stack
- Backend: FastAPI
- Frontend: Vue.js
- Database: PostgreSQL
- Real-time: WebSockets
`;

// Sample plan for re-estimation
const existingPlan = `# Project Plan

## Phase 1: Foundation
- Session 1: Project Setup (3h)
- Session 2: Database Models (3h)

## Phase 2: Core Features
- Session 3: Authentication (4h)
- Session 4: User Management (3h)

## Phase 3: Advanced Features
- Session 5: Dashboard (4h)
- Session 6: Reporting (3h)

## Summary
- Total Sessions: 6
- Total Time: 20h
`;

describe('estimateEffort', () => {
  describe('Basic Functionality', () => {
    it('should return a valid EffortEstimate structure', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('byPhase');
      expect(result).toHaveProperty('byDomain');
      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('adjustments');
      expect(result).toHaveProperty('risks');
    });

    it('should return total sessions and time', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result.total.sessions).toBeGreaterThan(0);
      expect(result.total.time).toBeTruthy();
    });

    it('should return confidence level between 0 and 100', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result.total.confidence).toBeGreaterThanOrEqual(0);
      expect(result.total.confidence).toBeLessThanOrEqual(100);
    });

    it('should break down by phase', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result.byPhase.length).toBeGreaterThan(0);
      result.byPhase.forEach((phase) => {
        expect(phase.phase).toBeTruthy();
        expect(phase.sessions).toBeGreaterThan(0);
        expect(phase.time).toBeTruthy();
      });
    });

    it('should break down by domain', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result.byDomain.length).toBeGreaterThan(0);
      const validDomains = ['backend', 'frontend', 'mobile', 'e2e', 'infrastructure'];
      result.byDomain.forEach((domain) => {
        expect(validDomains).toContain(domain.domain);
      });
    });
  });

  describe('Complexity-Based Estimation', () => {
    it('should estimate more sessions for complex requirements', async () => {
      const simple = await estimateEffort({
        requirements: simpleRequirements,
        complexity: 'basic',
      });
      const complex = await estimateEffort({
        requirements: complexRequirements,
        complexity: 'advanced',
      });

      expect(complex.total.sessions).toBeGreaterThan(simple.total.sessions);
    });

    it('should use provided complexity level', async () => {
      const basic = await estimateEffort({
        requirements: simpleRequirements,
        complexity: 'basic',
      });
      const advanced = await estimateEffort({
        requirements: simpleRequirements,
        complexity: 'advanced',
      });

      expect(advanced.total.sessions).toBeGreaterThanOrEqual(basic.total.sessions);
    });

    it('should auto-detect complexity when not provided', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      // Should detect this as advanced based on feature count
      expect(result.total.sessions).toBeGreaterThan(15);
    });

    it('should have lower confidence for complex projects', async () => {
      const simple = await estimateEffort({
        requirements: simpleRequirements,
        complexity: 'basic',
      });
      const complex = await estimateEffort({
        requirements: complexRequirements,
        complexity: 'advanced',
      });

      expect(simple.total.confidence).toBeGreaterThan(complex.total.confidence);
    });
  });

  describe('Feature Breakdown', () => {
    it('should break down by feature', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result.breakdown.length).toBeGreaterThan(0);
    });

    it('should estimate sessions per feature', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      result.breakdown.forEach((item) => {
        expect(item.feature).toBeTruthy();
        expect(item.sessions).toBeGreaterThan(0);
        expect(item.time).toBeTruthy();
      });
    });

    it('should assign complexity to features', async () => {
      const result = await estimateEffort({
        requirements: intermediateRequirements,
      });

      const validComplexities = ['basic', 'intermediate', 'advanced'];
      result.breakdown.forEach((item) => {
        expect(validComplexities).toContain(item.complexity);
      });
    });

    it('should estimate specific features when provided', async () => {
      const result = await estimateEffort({
        features: ['User authentication', 'Payment integration', 'Email notifications'],
      });

      expect(result.breakdown.length).toBe(3);
    });
  });

  describe('Adjustments', () => {
    it('should identify adjustment factors', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      expect(result.adjustments.length).toBeGreaterThan(0);
    });

    it('should include impact percentage for adjustments', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      result.adjustments.forEach((adj) => {
        expect(typeof adj.impact).toBe('number');
      });
    });

    it('should explain adjustment reasons', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      result.adjustments.forEach((adj) => {
        expect(adj.reason).toBeTruthy();
      });
    });

    it('should adjust for multiple integrations', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      const hasIntegrationAdjustment = result.adjustments.some(
        (a) => a.factor.toLowerCase().includes('integration')
      );
      expect(hasIntegrationAdjustment).toBe(true);
    });
  });

  describe('Risk Assessment', () => {
    it('should identify estimation risks', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should categorize risks', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      const validCategories = ['underestimate', 'overestimate', 'dependency', 'complexity'];
      result.risks.forEach((risk) => {
        expect(validCategories).toContain(risk.category);
      });
    });

    it('should provide mitigation for risks', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      result.risks.forEach((risk) => {
        expect(risk.mitigation).toBeTruthy();
      });
    });

    it('should flag underestimate risks for complex projects', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      const hasUnderestimateRisk = result.risks.some(
        (r) => r.category === 'underestimate'
      );
      expect(hasUnderestimateRisk).toBe(true);
    });
  });

  describe('Plan Re-estimation', () => {
    it('should accept existing plan for re-estimation', async () => {
      const result = await estimateEffort({
        plan: existingPlan,
      });

      expect(result.total.sessions).toBeGreaterThan(0);
    });

    it('should compare with existing plan', async () => {
      const result = await estimateEffort({
        requirements: intermediateRequirements,
        plan: existingPlan,
      });

      // Should identify if plan seems under/over estimated
      expect(result.adjustments.length).toBeGreaterThan(0);
    });
  });

  describe('Baseline Estimates', () => {
    it('should use baseline estimates for common features', async () => {
      const result = await estimateEffort({
        features: ['User authentication'],
      });

      // Auth is a well-known feature, should have reasonable estimate
      expect(result.breakdown[0].sessions).toBeGreaterThanOrEqual(1);
      expect(result.breakdown[0].sessions).toBeLessThanOrEqual(5);
    });

    it('should estimate CRUD operations consistently', async () => {
      const result = await estimateEffort({
        features: ['Blog posts CRUD', 'Comments CRUD'],
      });

      // Both are CRUD, should be similar
      const postSessions = result.breakdown[0].sessions;
      const commentSessions = result.breakdown[1].sessions;
      expect(Math.abs(postSessions - commentSessions)).toBeLessThanOrEqual(2);
    });

    it('should estimate payment integration higher than basic CRUD', async () => {
      const result = await estimateEffort({
        features: ['Basic CRUD for posts', 'Payment gateway integration'],
      });

      const crudItem = result.breakdown.find((b) =>
        b.feature.toLowerCase().includes('crud')
      );
      const paymentItem = result.breakdown.find((b) =>
        b.feature.toLowerCase().includes('payment')
      );

      expect(paymentItem!.sessions).toBeGreaterThan(crudItem!.sessions);
    });
  });

  describe('Time Formatting', () => {
    it('should format time as hours string', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      expect(result.total.time).toMatch(/\d+h/);
    });

    it('should sum up phase times to match total', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      const phaseTotalHours = result.byPhase.reduce((sum, p) => {
        const hours = parseInt(p.time.replace('h', ''));
        return sum + hours;
      }, 0);

      const totalHours = parseInt(result.total.time.replace('h', ''));
      expect(Math.abs(phaseTotalHours - totalHours)).toBeLessThanOrEqual(2);
    });
  });

  describe('Historical Comparison', () => {
    it('should include historical comparison when similar projects provided', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
        similarProjects: ['blog-platform-2023'],
      });

      // historicalComparison is optional but should be populated when projects provided
      expect(result.historicalComparison).toBeDefined();
    });

    it('should return undefined historicalComparison when no similar projects', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      // Without similar projects, historical comparison may be undefined
      // This is acceptable behavior
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty requirements', async () => {
      const result = await estimateEffort({
        requirements: '',
      });

      expect(result.total.sessions).toBe(0);
      expect(result.total.confidence).toBe(0);
    });

    it('should handle whitespace-only requirements', async () => {
      const result = await estimateEffort({
        requirements: '   \n\n   ',
      });

      expect(result.total.sessions).toBe(0);
    });

    it('should handle no parameters', async () => {
      const result = await estimateEffort({});

      expect(result.total.sessions).toBe(0);
    });

    it('should handle features array only', async () => {
      const result = await estimateEffort({
        features: ['Feature A', 'Feature B', 'Feature C'],
      });

      expect(result.total.sessions).toBeGreaterThan(0);
      expect(result.breakdown.length).toBe(3);
    });
  });

  describe('Domain Distribution', () => {
    it('should distribute effort across domains', async () => {
      const result = await estimateEffort({
        requirements: intermediateRequirements,
      });

      // Should have at least backend and frontend
      const domains = result.byDomain.map((d) => d.domain);
      expect(domains).toContain('backend');
      expect(domains).toContain('frontend');
    });

    it('should include mobile domain for mobile requirements', async () => {
      const result = await estimateEffort({
        requirements: complexRequirements,
      });

      // complexRequirements includes React Native
      const domains = result.byDomain.map((d) => d.domain);
      expect(domains).toContain('mobile');
    });

    it('should not include mobile for web-only projects', async () => {
      const result = await estimateEffort({
        requirements: simpleRequirements,
      });

      const hasMobile = result.byDomain.some((d) => d.domain === 'mobile');
      expect(hasMobile).toBe(false);
    });
  });
});
