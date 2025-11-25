// src/__tests__/e2e.test.ts
// End-to-end workflow tests

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Import tools for E2E testing
import { analyzeRequirements } from '../tools/planning/analyzeRequirements.js';
import { critiquePlan } from '../tools/planning/critiquePlan.js';
import { reviewArchitecture } from '../tools/intelligence/reviewArchitecture.js';
import { estimateEffort } from '../tools/intelligence/estimateEffort.js';

// Sample test data
const sampleRequirements = `# Task Manager App

## Overview
A simple task management application for personal productivity.

## Core Entities
- User (email, password, name, created_at)
- Task (title, description, due_date, priority, status, user_id)
- Category (name, color, user_id)
- Tag (name, task_id)

## Features
- User authentication (register, login, logout)
- CRUD operations for tasks
- Task categorization and tagging
- Task filtering and search
- Due date reminders

## Technical Requirements
- Backend: Django REST Framework
- Frontend: Vue 3 with Composition API
- Database: PostgreSQL
- Authentication: JWT

## Complexity
Intermediate
`;

const samplePlan = `# Project Plan: Task Manager

## Project Overview
- **Name:** Task Manager
- **Type:** projectmanagement
- **Complexity:** intermediate
- **Total Sessions:** 12
- **Total Time:** 40h

## Phase 1: Core Infrastructure

### Session 1: Project Setup
**Objectives:**
- Initialize Django project
- Setup PostgreSQL database
- Configure JWT authentication

**Estimated Time:** 3h
**Domain:** backend
**Dependencies:** None

**TDD Workflow:**
#### RED Phase
- Test Django project initialization
- Test database connection
- Test auth endpoints

#### GREEN Phase
- Create Django project
- Setup database models
- Implement auth

#### REFACTOR Phase
- Optimize settings
- Add documentation

**Exit Criteria:**
- All tests passing
- Type checking passes
- Django server runs

### Session 2: User Model & API
**Objectives:**
- Create User model
- User registration endpoint
- User profile endpoint

**Estimated Time:** 3h
**Domain:** backend
**Dependencies:** Session 1

**TDD Workflow:**
#### RED Phase
- Test user registration
- Test user profile
- Test user validation

#### GREEN Phase
- Create User model
- Create UserSerializer
- Create UserViewSet

#### REFACTOR Phase
- Add validation
- Optimize queries

**Exit Criteria:**
- All tests passing
- User CRUD works

## Phase 2: Feature Implementation

### Session 3: Task Model & API
**Objectives:**
- Create Task model
- CRUD endpoints for tasks
- Task filtering

**Estimated Time:** 4h
**Domain:** backend
**Dependencies:** Session 2

**TDD Workflow:**
#### RED Phase
- Test task CRUD
- Test task filtering
- Test task validation

#### GREEN Phase
- Create Task model
- Create TaskSerializer
- Create TaskViewSet

#### REFACTOR Phase
- Add pagination
- Optimize filtering

**Exit Criteria:**
- All tests passing
- Task CRUD works
`;

// Test fixture for temp files
let tempDir: string;

beforeAll(async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'e2e-test-'));
});

afterAll(async () => {
  if (tempDir) {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

describe('E2E: Complete Planning Workflow', () => {
  describe('Step 1: Analyze Requirements', () => {
    it('should analyze requirements document successfully', async () => {
      const result = await analyzeRequirements({
        requirements: sampleRequirements,
        projectType: 'projectmanagement',
      });

      // Check structure (analyzeRequirements returns RequirementsAnalysis)
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('completeness');
      expect(result).toHaveProperty('clarity');
      expect(result).toHaveProperty('feasibility');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('estimatedComplexity');

      // Should be valid with reasonable completeness
      expect(result.completeness).toBeGreaterThan(0);
    });

    it('should detect complexity level from requirements', async () => {
      const result = await analyzeRequirements({
        requirements: sampleRequirements,
      });

      expect(result.estimatedComplexity).toBeDefined();
      expect(['basic', 'intermediate', 'advanced']).toContain(
        result.estimatedComplexity
      );
    });

    it('should identify gaps in requirements', async () => {
      const result = await analyzeRequirements({
        requirements: sampleRequirements,
      });

      // Gaps array should exist
      expect(Array.isArray(result.gaps)).toBe(true);

      // Each gap should have required properties
      for (const gap of result.gaps) {
        expect(gap).toHaveProperty('category');
        expect(gap).toHaveProperty('title');
        expect(gap).toHaveProperty('severity');
      }
    });
  });

  describe('Step 2: Critique Plan', () => {
    let planPath: string;

    beforeAll(async () => {
      planPath = path.join(tempDir, 'PROJECT_PLAN.md');
      await fs.writeFile(planPath, samplePlan, 'utf-8');
    });

    it('should critique plan and provide overall score', async () => {
      const result = await critiquePlan({
        planPath,
      });

      expect(result).toHaveProperty('overall');
      expect(result.overall).toHaveProperty('score');
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
    });

    it('should verify session structure', async () => {
      const result = await critiquePlan({
        planPath,
      });

      expect(result.sessions).toBeDefined();
      expect(Array.isArray(result.sessions)).toBe(true);
      expect(result.sessions.length).toBeGreaterThan(0);

      // Each session critique should have required properties
      for (const session of result.sessions) {
        expect(session).toHaveProperty('sessionNumber');
        expect(session).toHaveProperty('score');
        expect(session).toHaveProperty('issues');
      }
    });

    it('should analyze dependencies', async () => {
      const result = await critiquePlan({
        planPath,
      });

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies).toHaveProperty('valid');
      expect(result.dependencies).toHaveProperty('circularDependencies');
      expect(result.dependencies).toHaveProperty('missingDependencies');
    });

    it('should identify parallelization opportunities', async () => {
      const result = await critiquePlan({
        planPath,
      });

      expect(result.parallelization).toBeDefined();
      expect(result.parallelization).toHaveProperty('opportunities');
      expect(result.parallelization).toHaveProperty('estimatedTimeSavings');
    });
  });

  describe('Step 3: Review Architecture', () => {
    it('should review architecture from requirements', async () => {
      const result = await reviewArchitecture({
        requirements: sampleRequirements,
      });

      expect(result).toHaveProperty('overall');
      expect(result.overall).toHaveProperty('score');
      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
    });

    it('should identify patterns and anti-patterns', async () => {
      const result = await reviewArchitecture({
        requirements: sampleRequirements,
        plan: samplePlan,
      });

      expect(result.patterns).toBeDefined();
      expect(result.patterns).toHaveProperty('recognized');
      expect(result.patterns).toHaveProperty('antiPatterns');
      expect(Array.isArray(result.patterns.recognized)).toBe(true);
      expect(Array.isArray(result.patterns.antiPatterns)).toBe(true);
    });

    it('should assess security', async () => {
      const result = await reviewArchitecture({
        requirements: sampleRequirements,
      });

      expect(result.security).toBeDefined();
      expect(result.security).toHaveProperty('score');
      expect(result.security).toHaveProperty('vulnerabilities');
      expect(result.security).toHaveProperty('recommendations');
    });

    it('should assess scalability', async () => {
      const result = await reviewArchitecture({
        requirements: sampleRequirements,
      });

      expect(result.scalability).toBeDefined();
      expect(result.scalability).toHaveProperty('score');
      expect(result.scalability).toHaveProperty('concerns');
      expect(result.scalability).toHaveProperty('recommendations');
    });

    it('should assess testability', async () => {
      const result = await reviewArchitecture({
        requirements: sampleRequirements,
      });

      expect(result.testability).toBeDefined();
      expect(result.testability).toHaveProperty('score');
    });
  });

  describe('Step 4: Estimate Effort', () => {
    it('should estimate effort from requirements', async () => {
      const result = await estimateEffort({
        requirements: sampleRequirements,
      });

      expect(result).toHaveProperty('total');
      expect(result.total).toHaveProperty('sessions');
      expect(result.total).toHaveProperty('time');
      expect(result.total).toHaveProperty('confidence');
      expect(result.total.sessions).toBeGreaterThan(0);
    });

    it('should provide confidence level', async () => {
      const result = await estimateEffort({
        requirements: sampleRequirements,
      });

      expect(result.total.confidence).toBeGreaterThanOrEqual(0);
      expect(result.total.confidence).toBeLessThanOrEqual(100);
    });

    it('should break down by phase', async () => {
      const result = await estimateEffort({
        requirements: sampleRequirements,
        plan: samplePlan,
      });

      expect(result.byPhase).toBeDefined();
      expect(Array.isArray(result.byPhase)).toBe(true);
      expect(result.byPhase.length).toBeGreaterThan(0);

      // Each phase should have structure
      for (const phase of result.byPhase) {
        expect(phase).toHaveProperty('phase');
        expect(phase).toHaveProperty('sessions');
        expect(phase).toHaveProperty('time');
      }
    });

    it('should break down by domain', async () => {
      const result = await estimateEffort({
        requirements: sampleRequirements,
      });

      expect(result.byDomain).toBeDefined();
      expect(Array.isArray(result.byDomain)).toBe(true);

      // Each domain entry should have structure
      for (const domain of result.byDomain) {
        expect(domain).toHaveProperty('domain');
        expect(domain).toHaveProperty('sessions');
        expect(domain).toHaveProperty('time');
      }
    });

    it('should provide feature breakdown', async () => {
      const result = await estimateEffort({
        requirements: sampleRequirements,
      });

      expect(result.breakdown).toBeDefined();
      expect(Array.isArray(result.breakdown)).toBe(true);
    });

    it('should identify risks', async () => {
      const result = await estimateEffort({
        requirements: sampleRequirements,
      });

      expect(result.risks).toBeDefined();
      expect(Array.isArray(result.risks)).toBe(true);
    });
  });
});

describe('E2E: Requirements -> Analysis -> Critique Flow', () => {
  let planPath: string;

  beforeAll(async () => {
    planPath = path.join(tempDir, 'flow-test-plan.md');
    await fs.writeFile(planPath, samplePlan, 'utf-8');
  });

  it('should complete full analysis pipeline', async () => {
    // Step 1: Analyze requirements
    const analysisResult = await analyzeRequirements({
      requirements: sampleRequirements,
    });
    expect(analysisResult.completeness).toBeGreaterThan(0);

    // Step 2: Get effort estimate
    const effortResult = await estimateEffort({
      requirements: sampleRequirements,
      complexity: analysisResult.estimatedComplexity,
    });
    expect(effortResult.total.sessions).toBeGreaterThan(0);

    // Step 3: Review architecture
    const archResult = await reviewArchitecture({
      requirements: sampleRequirements,
    });
    expect(archResult.overall.score).toBeGreaterThanOrEqual(0);

    // Step 4: Critique the plan
    const critiqueResult = await critiquePlan({
      planPath,
    });
    expect(critiqueResult.overall.score).toBeGreaterThanOrEqual(0);

    // Verify pipeline produced consistent results
    expect(['basic', 'intermediate', 'advanced']).toContain(
      analysisResult.estimatedComplexity
    );
    expect(effortResult.total.sessions).toBeGreaterThan(0);
  });

  it('should handle complex requirements', async () => {
    const complexRequirements = `# E-commerce Platform

## Overview
Full-featured e-commerce platform with real-time features.

## Core Entities
- Product (name, description, price, inventory, images)
- Category (name, parent_category, featured)
- User (email, addresses, payment_methods)
- Order (items, total, status, shipping)
- Cart (user, items, expiry)
- Review (product, user, rating, content)
- Coupon (code, discount, conditions)
- Wishlist (user, products)

## Features
- Product catalog with advanced search
- Shopping cart with persistence
- Checkout with multiple payment methods
- Order tracking and history
- Product reviews and ratings
- Wishlist management
- Admin dashboard
- Real-time inventory updates
- Email notifications
- Multi-currency support

## Technical Requirements
- Backend: Django REST Framework
- Frontend: Vue 3 + Pinia
- Database: PostgreSQL
- Cache: Redis
- Search: Elasticsearch
- Payments: Stripe
- Storage: S3

## Complexity
Advanced
`;

    const analysisResult = await analyzeRequirements({
      requirements: complexRequirements,
      projectType: 'ecommerce',
    });

    expect(analysisResult.estimatedComplexity).toBe('advanced');

    const effortResult = await estimateEffort({
      requirements: complexRequirements,
    });

    expect(effortResult.total.sessions).toBeGreaterThan(0);
    // Complex projects should have adjustments
    expect(Array.isArray(effortResult.adjustments)).toBe(true);
  });
});

describe('E2E: Error Handling', () => {
  it('should handle empty requirements gracefully', async () => {
    const result = await analyzeRequirements({
      requirements: '',
    });

    expect(result.valid).toBe(false);
    expect(result.completeness).toBe(0);
  });

  it('should handle malformed plan gracefully', async () => {
    const malformedPlanPath = path.join(tempDir, 'malformed-plan.md');
    await fs.writeFile(
      malformedPlanPath,
      'This is not a valid plan format',
      'utf-8'
    );

    const result = await critiquePlan({
      planPath: malformedPlanPath,
    });

    // Should still return a result with empty sessions
    expect(result).toBeDefined();
    expect(result.overall).toBeDefined();
    expect(Array.isArray(result.sessions)).toBe(true);
  });

  it('should handle missing sections in requirements', async () => {
    const incompleteRequirements = `# App Name

## Overview
Just an overview, nothing else.
`;

    const result = await analyzeRequirements({
      requirements: incompleteRequirements,
    });

    // Should have gaps for missing sections
    expect(result.gaps.length).toBeGreaterThan(0);
  });

  it('should handle empty effort estimation input', async () => {
    const result = await estimateEffort({
      requirements: '',
    });

    expect(result.total.sessions).toBe(0);
    expect(result.total.confidence).toBe(0);
  });

  it('should handle empty architecture review input', async () => {
    const result = await reviewArchitecture({
      requirements: '',
    });

    expect(result.overall.score).toBe(0);
    expect(result.overall.concerns.length).toBeGreaterThan(0);
  });
});

describe('E2E: Consistency Checks', () => {
  it('should produce consistent estimates across calls', async () => {
    const results = await Promise.all([
      estimateEffort({ requirements: sampleRequirements }),
      estimateEffort({ requirements: sampleRequirements }),
      estimateEffort({ requirements: sampleRequirements }),
    ]);

    // All calls should produce same session count (deterministic)
    const sessions = results.map((r) => r.total.sessions);
    expect(sessions[0]).toBe(sessions[1]);
    expect(sessions[1]).toBe(sessions[2]);
  });

  it('should maintain analysis consistency', async () => {
    const result1 = await analyzeRequirements({
      requirements: sampleRequirements,
    });
    const result2 = await analyzeRequirements({
      requirements: sampleRequirements,
    });

    // Should produce same completeness score
    expect(result1.completeness).toBe(result2.completeness);
    expect(result1.estimatedComplexity).toBe(result2.estimatedComplexity);
    expect(result1.gaps.length).toBe(result2.gaps.length);
  });

  it('should maintain architecture review consistency', async () => {
    const result1 = await reviewArchitecture({
      requirements: sampleRequirements,
    });
    const result2 = await reviewArchitecture({
      requirements: sampleRequirements,
    });

    expect(result1.overall.score).toBe(result2.overall.score);
    expect(result1.patterns.recognized.length).toBe(
      result2.patterns.recognized.length
    );
  });
});

describe('E2E: Integration Tests', () => {
  it('should flow data between analyze and estimate tools', async () => {
    // Analyze first
    const analysis = await analyzeRequirements({
      requirements: sampleRequirements,
    });

    // Use analysis output for estimation
    const estimate = await estimateEffort({
      requirements: sampleRequirements,
      complexity: analysis.estimatedComplexity,
    });

    // Complexity should influence estimates
    expect(estimate.total.sessions).toBeGreaterThan(0);

    // Confidence should reflect detected complexity
    if (analysis.estimatedComplexity === 'basic') {
      expect(estimate.total.confidence).toBeGreaterThanOrEqual(70);
    } else if (analysis.estimatedComplexity === 'advanced') {
      expect(estimate.total.confidence).toBeLessThanOrEqual(80);
    }
  });

  it('should flow data between architecture and critique tools', async () => {
    const planPath = path.join(tempDir, 'integration-plan.md');
    await fs.writeFile(planPath, samplePlan, 'utf-8');

    // Review architecture first
    const archReview = await reviewArchitecture({
      requirements: sampleRequirements,
      plan: samplePlan,
    });

    // Critique the plan
    const critique = await critiquePlan({
      planPath,
    });

    // Both should produce valid results
    expect(archReview.overall.score).toBeGreaterThanOrEqual(0);
    expect(critique.overall.score).toBeGreaterThanOrEqual(0);

    // Both tools analyze the same plan
    expect(archReview.patterns).toBeDefined();
    expect(critique.sessions.length).toBeGreaterThan(0);
  });

  it('should handle full tool chain execution', async () => {
    const planPath = path.join(tempDir, 'full-chain-plan.md');
    await fs.writeFile(planPath, samplePlan, 'utf-8');

    // Execute all tools in sequence
    const [analysis, estimate, architecture, critique] = await Promise.all([
      analyzeRequirements({ requirements: sampleRequirements }),
      estimateEffort({ requirements: sampleRequirements }),
      reviewArchitecture({ requirements: sampleRequirements, plan: samplePlan }),
      critiquePlan({ planPath }),
    ]);

    // All should return valid results
    expect(analysis.completeness).toBeGreaterThan(0);
    expect(estimate.total.sessions).toBeGreaterThan(0);
    expect(architecture.overall.score).toBeGreaterThanOrEqual(0);
    expect(critique.overall.score).toBeGreaterThanOrEqual(0);

    // Results should be coherent
    const detected = analysis.estimatedComplexity;
    expect(['basic', 'intermediate', 'advanced']).toContain(detected);
  });
});
