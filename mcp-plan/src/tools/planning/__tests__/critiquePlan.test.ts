// src/tools/planning/__tests__/critiquePlan.test.ts
// Tests for critiquePlan tool

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { critiquePlan } from '../critiquePlan.js';
import type {
  CritiquePlanParams,
  PlanCritique,
} from '../../../types/tools.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
}));

// Sample well-structured project plan
const wellStructuredPlan = `# Project Plan: Blog Platform

## Phase 1: Foundation (Sessions 1-3)

### Session 1: Project Setup & Type Definitions
- **Estimated Time**: 3h
- **Domain**: infrastructure
- **Dependencies**: None

#### Objectives
- Initialize project structure
- Set up TypeScript configuration
- Define core types

#### Exit Criteria
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Project builds successfully

### Session 2: Database Models
- **Estimated Time**: 3h
- **Domain**: backend
- **Dependencies**: Session 1

#### Objectives
- Create User model
- Create Post model
- Set up migrations

### Session 3: Authentication
- **Estimated Time**: 3h
- **Domain**: backend
- **Dependencies**: Session 1, Session 2

#### Objectives
- Implement JWT authentication
- Create login/register endpoints

## Phase 2: Core Features (Sessions 4-6)

### Session 4: Post CRUD
- **Estimated Time**: 3h
- **Domain**: backend
- **Dependencies**: Session 2, Session 3

#### Objectives
- Create post endpoints
- Implement authorization

### Session 5: Comments System
- **Estimated Time**: 3h
- **Domain**: backend
- **Dependencies**: Session 4

#### Objectives
- Create comment model
- Implement comment endpoints

### Session 6: Frontend Setup
- **Estimated Time**: 3h
- **Domain**: frontend
- **Dependencies**: Session 1

#### Objectives
- Set up Vue.js project
- Configure routing

## Summary
- **Total Sessions**: 6
- **Total Time**: 18h
- **Complexity**: Intermediate
`;

// Plan with circular dependencies
const planWithCircularDeps = `# Project Plan

## Phase 1

### Session 1: Setup
- **Dependencies**: Session 3

### Session 2: Models
- **Dependencies**: Session 1

### Session 3: Auth
- **Dependencies**: Session 2
`;

// Plan with missing dependencies
const planWithMissingDeps = `# Project Plan

## Phase 1

### Session 1: Setup
- **Dependencies**: None

### Session 2: Models
- **Dependencies**: Session 1, Session 10

### Session 3: Auth
- **Dependencies**: Session 99
`;

// Plan with large sessions (scope issues)
const planWithScopeIssues = `# Project Plan

## Phase 1

### Session 1: Everything
- **Estimated Time**: 20h
- **Domain**: backend
- **Dependencies**: None

#### Objectives
- Set up project
- Create all models
- Implement all endpoints
- Add authentication
- Add authorization
- Create admin panel
- Set up monitoring
- Deploy to production
`;

// Plan with parallelization opportunities
const planWithParallelization = `# Project Plan

## Phase 1

### Session 1: Setup
- **Dependencies**: None
- **Domain**: infrastructure

### Session 2: Backend Models
- **Dependencies**: Session 1
- **Domain**: backend

### Session 3: Frontend Setup
- **Dependencies**: Session 1
- **Domain**: frontend

### Session 4: Mobile Setup
- **Dependencies**: Session 1
- **Domain**: mobile

### Session 5: Backend API
- **Dependencies**: Session 2
- **Domain**: backend

### Session 6: Frontend Components
- **Dependencies**: Session 3
- **Domain**: frontend
`;

describe('critiquePlan', () => {
  const defaultParams: CritiquePlanParams = {
    planPath: '/path/to/PROJECT_PLAN.md',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(wellStructuredPlan);
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('should return a valid PlanCritique structure', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('sessions');
      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('parallelization');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('recommendations');
    });

    it('should return overall score between 0 and 100', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
    });

    it('should include strengths and weaknesses', async () => {
      const result = await critiquePlan(defaultParams);

      expect(Array.isArray(result.overall.strengths)).toBe(true);
      expect(Array.isArray(result.overall.weaknesses)).toBe(true);
    });

    it('should analyze all sessions', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.sessions.length).toBeGreaterThan(0);
    });
  });

  describe('Session Critique', () => {
    it('should score each session', async () => {
      const result = await critiquePlan(defaultParams);

      result.sessions.forEach((session) => {
        expect(session.score).toBeGreaterThanOrEqual(0);
        expect(session.score).toBeLessThanOrEqual(100);
      });
    });

    it('should include session number', async () => {
      const result = await critiquePlan(defaultParams);

      result.sessions.forEach((session) => {
        expect(session.sessionNumber).toBeGreaterThan(0);
      });
    });

    it('should categorize issues correctly', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithScopeIssues);
      const result = await critiquePlan(defaultParams);

      const validCategories = ['scope', 'dependencies', 'testing', 'timeline'];
      result.sessions.forEach((session) => {
        session.issues.forEach((issue) => {
          expect(validCategories).toContain(issue.category);
        });
      });
    });

    it('should assign severity to issues', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithScopeIssues);
      const result = await critiquePlan(defaultParams);

      const validSeverities = ['low', 'medium', 'high'];
      result.sessions.forEach((session) => {
        session.issues.forEach((issue) => {
          expect(validSeverities).toContain(issue.severity);
        });
      });
    });

    it('should detect scope issues in large sessions', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithScopeIssues);
      const result = await critiquePlan(defaultParams);

      const hasScoreIssue = result.sessions.some((s) =>
        s.issues.some((i) => i.category === 'scope')
      );
      expect(hasScoreIssue).toBe(true);
    });

    it('should provide suggestions for each session', async () => {
      const result = await critiquePlan(defaultParams);

      result.sessions.forEach((session) => {
        expect(Array.isArray(session.suggestions)).toBe(true);
      });
    });
  });

  describe('Dependency Analysis', () => {
    it('should validate dependencies', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.dependencies).toHaveProperty('valid');
      expect(result.dependencies).toHaveProperty('circularDependencies');
      expect(result.dependencies).toHaveProperty('missingDependencies');
    });

    it('should report valid dependencies for well-structured plan', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.dependencies.valid).toBe(true);
    });

    it('should detect circular dependencies', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const result = await critiquePlan(defaultParams);

      expect(result.dependencies.valid).toBe(false);
      expect(result.dependencies.circularDependencies.length).toBeGreaterThan(0);
    });

    it('should report circular dependency chains', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const result = await critiquePlan(defaultParams);

      // Should report the cycle: 1 -> 3 -> 2 -> 1
      const cycle = result.dependencies.circularDependencies[0];
      expect(cycle.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect missing dependencies', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithMissingDeps);
      const result = await critiquePlan(defaultParams);

      expect(result.dependencies.missingDependencies.length).toBeGreaterThan(0);
    });

    it('should report which session has missing dependency', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithMissingDeps);
      const result = await critiquePlan(defaultParams);

      const missing = result.dependencies.missingDependencies[0];
      expect(missing.session).toBeDefined();
      expect(missing.requires).toBeDefined();
    });
  });

  describe('Parallelization Analysis', () => {
    it('should identify parallelization opportunities', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithParallelization);
      const result = await critiquePlan(defaultParams);

      expect(result.parallelization.opportunities.length).toBeGreaterThan(0);
    });

    it('should list sessions that can run in parallel', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithParallelization);
      const result = await critiquePlan(defaultParams);

      const opportunity = result.parallelization.opportunities[0];
      expect(opportunity.sessions.length).toBeGreaterThanOrEqual(2);
    });

    it('should explain why sessions can be parallelized', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithParallelization);
      const result = await critiquePlan(defaultParams);

      const opportunity = result.parallelization.opportunities[0];
      expect(opportunity.reason).toBeTruthy();
    });

    it('should estimate time savings from parallelization', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithParallelization);
      const result = await critiquePlan(defaultParams);

      expect(result.parallelization.estimatedTimeSavings).toBeTruthy();
    });

    it('should provide time savings per opportunity', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithParallelization);
      const result = await critiquePlan(defaultParams);

      result.parallelization.opportunities.forEach((opp) => {
        expect(opp.timeSavings).toBeTruthy();
      });
    });
  });

  describe('Risk Assessment', () => {
    it('should identify risks in the plan', async () => {
      const result = await critiquePlan(defaultParams);

      expect(Array.isArray(result.risks)).toBe(true);
    });

    it('should have higher risks for plans with issues', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const problematicResult = await critiquePlan(defaultParams);

      vi.mocked(fs.readFile).mockResolvedValue(wellStructuredPlan);
      const goodResult = await critiquePlan(defaultParams);

      expect(problematicResult.risks.length).toBeGreaterThanOrEqual(
        goodResult.risks.length
      );
    });

    it('should categorize risks', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const result = await critiquePlan(defaultParams);

      const validCategories = [
        'technical',
        'timeline',
        'scope',
        'dependency',
        'compliance',
      ];
      result.risks.forEach((risk) => {
        expect(validCategories).toContain(risk.category);
      });
    });

    it('should provide mitigation for risks', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const result = await critiquePlan(defaultParams);

      result.risks.forEach((risk) => {
        expect(risk.mitigation).toBeTruthy();
      });
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide actionable recommendations', async () => {
      const result = await critiquePlan(defaultParams);

      result.recommendations.forEach((rec) => {
        expect(rec.length).toBeGreaterThan(10); // Not too short
      });
    });

    it('should provide more recommendations for problematic plans', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const problematicResult = await critiquePlan(defaultParams);

      vi.mocked(fs.readFile).mockResolvedValue(wellStructuredPlan);
      const goodResult = await critiquePlan(defaultParams);

      expect(problematicResult.recommendations.length).toBeGreaterThanOrEqual(
        goodResult.recommendations.length
      );
    });
  });

  describe('Overall Score Calculation', () => {
    it('should give high scores to well-structured plans', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.overall.score).toBeGreaterThan(70);
    });

    it('should give lower scores to plans with circular dependencies', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const result = await critiquePlan(defaultParams);

      expect(result.overall.score).toBeLessThan(70);
    });

    it('should give lower scores to plans with scope issues', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithScopeIssues);
      const result = await critiquePlan(defaultParams);

      // Score should be penalized for oversized sessions
      expect(result.overall.score).toBeLessThan(95);
    });

    it('should identify strengths in well-structured plans', async () => {
      const result = await critiquePlan(defaultParams);

      expect(result.overall.strengths.length).toBeGreaterThan(0);
    });

    it('should identify weaknesses in problematic plans', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(planWithCircularDeps);
      const result = await critiquePlan(defaultParams);

      expect(result.overall.weaknesses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle file not found', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(critiquePlan(defaultParams)).rejects.toThrow();
    });

    it('should handle empty plan file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('');

      const result = await critiquePlan(defaultParams);
      expect(result.overall.score).toBe(0);
    });

    it('should handle plan with no sessions', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('# Project Plan\n\nNo sessions defined.');

      const result = await critiquePlan(defaultParams);
      expect(result.sessions.length).toBe(0);
    });

    it('should handle malformed markdown', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('###Invalid markdown\n-broken');

      const result = await critiquePlan(defaultParams);
      expect(result).toBeDefined();
    });
  });

  describe('Plan Parsing', () => {
    it('should extract session numbers correctly', async () => {
      const result = await critiquePlan(defaultParams);

      const sessionNumbers = result.sessions.map((s) => s.sessionNumber);
      expect(sessionNumbers).toContain(1);
      expect(sessionNumbers).toContain(2);
    });

    it('should handle different session title formats', async () => {
      const alternativeFormat = `# Plan

## Phase 1

### Session 1 - Setup
- **Dependencies**: None

### Session #2: Models
- **Dependencies**: Session 1
`;
      vi.mocked(fs.readFile).mockResolvedValue(alternativeFormat);
      const result = await critiquePlan(defaultParams);

      expect(result.sessions.length).toBeGreaterThanOrEqual(1);
    });
  });
});
