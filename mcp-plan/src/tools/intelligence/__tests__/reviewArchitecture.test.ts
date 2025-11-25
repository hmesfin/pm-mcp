// src/tools/intelligence/__tests__/reviewArchitecture.test.ts
// Tests for reviewArchitecture tool

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reviewArchitecture } from '../reviewArchitecture.js';
import type {
  ReviewArchitectureParams,
  ArchitectureReview,
} from '../../../types/tools.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  access: vi.fn(),
}));

// Sample plan with good architecture
const wellArchitectedPlan = `# Project Plan: Blog Platform

## Technical Stack
- **Backend**: Django REST Framework
- **Frontend**: Vue.js 3 with Composition API
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT tokens

## Architecture
- RESTful API design
- Repository pattern for data access
- Service layer for business logic
- Component-based UI architecture

## Sessions

### Session 1: Database Models
- User model with authentication
- Post model with relationships
- Comment model with threading

### Session 2: API Endpoints
- CRUD operations for posts
- Pagination and filtering
- Rate limiting

### Session 3: Frontend Components
- Reusable form components
- Lazy loading for images
- State management with Pinia
`;

// Sample requirements
const sampleRequirements = `# Requirements

## Functional
- User authentication
- Blog post CRUD
- Comments with replies
- Search functionality

## Non-Functional
- Page load < 2s
- Support 1000 concurrent users
- HTTPS required
- GDPR compliance
`;

// Plan with anti-patterns
const planWithAntiPatterns = `# Project Plan

## Technical Stack
- **Backend**: PHP (no framework)
- **Database**: MySQL with raw queries

## Architecture
- All logic in controllers (fat controllers)
- Global variables for state
- No caching strategy
- Single monolithic file structure

## Sessions

### Session 1: Everything
- Build entire app in one session
- No tests needed
- Deploy directly to production
`;

// Plan with security concerns
const planWithSecurityIssues = `# Project Plan

## Technical Stack
- **Backend**: Node.js Express
- **Database**: MongoDB

## Features
- Store passwords in plain text
- No input validation
- Admin panel without authentication
- API keys in frontend code
- No rate limiting
- SQL queries built with string concatenation
`;

// Plan missing scalability considerations
const planWithScalabilityIssues = `# Project Plan

## Technical Stack
- **Backend**: Python Flask
- **Database**: SQLite

## Architecture
- Single server deployment
- Session storage in memory
- No database indexing strategy
- Synchronous file processing
- No CDN for static assets
`;

describe('reviewArchitecture', () => {
  const defaultParams: ReviewArchitectureParams = {
    plan: wellArchitectedPlan,
    requirements: sampleRequirements,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(wellArchitectedPlan);
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  describe('Basic Functionality', () => {
    it('should return a valid ArchitectureReview structure', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result).toHaveProperty('overall');
      expect(result).toHaveProperty('patterns');
      expect(result).toHaveProperty('techStack');
      expect(result).toHaveProperty('scalability');
      expect(result).toHaveProperty('security');
      expect(result).toHaveProperty('testability');
    });

    it('should return overall score between 0 and 100', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.overall.score).toBeGreaterThanOrEqual(0);
      expect(result.overall.score).toBeLessThanOrEqual(100);
    });

    it('should include strengths and concerns arrays', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(Array.isArray(result.overall.strengths)).toBe(true);
      expect(Array.isArray(result.overall.concerns)).toBe(true);
    });

    it('should work with file paths', async () => {
      vi.mocked(fs.readFile)
        .mockResolvedValueOnce(wellArchitectedPlan)
        .mockResolvedValueOnce(sampleRequirements);

      const result = await reviewArchitecture({
        planPath: '/path/to/plan.md',
        requirementsPath: '/path/to/requirements.md',
      });

      expect(result.overall.score).toBeGreaterThan(0);
    });

    it('should work with direct content', async () => {
      const result = await reviewArchitecture({
        plan: wellArchitectedPlan,
        requirements: sampleRequirements,
      });

      expect(result.overall.score).toBeGreaterThan(0);
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize architectural patterns', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.patterns.recognized.length).toBeGreaterThan(0);
    });

    it('should categorize recognized patterns', async () => {
      const result = await reviewArchitecture(defaultParams);

      const validCategories = ['architecture', 'design', 'data', 'api'];
      result.patterns.recognized.forEach((pattern) => {
        expect(validCategories).toContain(pattern.category);
      });
    });

    it('should include pattern benefits', async () => {
      const result = await reviewArchitecture(defaultParams);

      result.patterns.recognized.forEach((pattern) => {
        expect(Array.isArray(pattern.benefits)).toBe(true);
      });
    });

    it('should recommend patterns', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(Array.isArray(result.patterns.recommended)).toBe(true);
    });

    it('should include effort level for recommended patterns', async () => {
      const result = await reviewArchitecture(defaultParams);

      const validEfforts = ['low', 'medium', 'high'];
      result.patterns.recommended.forEach((pattern) => {
        expect(validEfforts).toContain(pattern.effort);
      });
    });

    it('should detect anti-patterns', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      expect(result.patterns.antiPatterns.length).toBeGreaterThan(0);
    });

    it('should provide alternatives for anti-patterns', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      result.patterns.antiPatterns.forEach((antiPattern) => {
        expect(antiPattern.alternative).toBeTruthy();
      });
    });
  });

  describe('Tech Stack Analysis', () => {
    it('should assess tech stack appropriateness', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(typeof result.techStack.appropriate).toBe('boolean');
    });

    it('should provide tech recommendations', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(Array.isArray(result.techStack.recommendations)).toBe(true);
    });

    it('should categorize tech recommendations', async () => {
      const result = await reviewArchitecture(defaultParams);

      const validCategories = ['backend', 'frontend', 'mobile', 'infrastructure', 'tooling'];
      result.techStack.recommendations.forEach((rec) => {
        expect(validCategories).toContain(rec.category);
      });
    });

    it('should identify current tech being used', async () => {
      const result = await reviewArchitecture(defaultParams);

      result.techStack.recommendations.forEach((rec) => {
        expect(rec.current).toBeTruthy();
      });
    });

    it('should flag inappropriate tech choices', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      // PHP without framework for a modern app should be flagged
      expect(result.techStack.appropriate).toBe(false);
    });
  });

  describe('Scalability Analysis', () => {
    it('should provide scalability score', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.scalability.score).toBeGreaterThanOrEqual(0);
      expect(result.scalability.score).toBeLessThanOrEqual(100);
    });

    it('should identify scalability concerns', async () => {
      const result = await reviewArchitecture({
        plan: planWithScalabilityIssues,
      });

      expect(result.scalability.concerns.length).toBeGreaterThan(0);
    });

    it('should provide scalability recommendations', async () => {
      const result = await reviewArchitecture({
        plan: planWithScalabilityIssues,
      });

      expect(result.scalability.recommendations.length).toBeGreaterThan(0);
    });

    it('should give higher scalability score for well-designed systems', async () => {
      const wellDesigned = await reviewArchitecture(defaultParams);
      const poorlyDesigned = await reviewArchitecture({
        plan: planWithScalabilityIssues,
      });

      expect(wellDesigned.scalability.score).toBeGreaterThan(
        poorlyDesigned.scalability.score
      );
    });

    it('should flag SQLite for production concerns', async () => {
      const result = await reviewArchitecture({
        plan: planWithScalabilityIssues,
      });

      const hasSqliteConcern = result.scalability.concerns.some(
        (c) => c.toLowerCase().includes('sqlite')
      );
      expect(hasSqliteConcern).toBe(true);
    });
  });

  describe('Security Analysis', () => {
    it('should provide security score', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.security.score).toBeGreaterThanOrEqual(0);
      expect(result.security.score).toBeLessThanOrEqual(100);
    });

    it('should identify security vulnerabilities', async () => {
      const result = await reviewArchitecture({
        plan: planWithSecurityIssues,
      });

      expect(result.security.vulnerabilities.length).toBeGreaterThan(0);
    });

    it('should categorize security concerns', async () => {
      const result = await reviewArchitecture({
        plan: planWithSecurityIssues,
      });

      const validCategories = ['authentication', 'authorization', 'data', 'api', 'infrastructure'];
      result.security.vulnerabilities.forEach((vuln) => {
        expect(validCategories).toContain(vuln.category);
      });
    });

    it('should assign severity to vulnerabilities', async () => {
      const result = await reviewArchitecture({
        plan: planWithSecurityIssues,
      });

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      result.security.vulnerabilities.forEach((vuln) => {
        expect(validSeverities).toContain(vuln.severity);
      });
    });

    it('should provide mitigation for vulnerabilities', async () => {
      const result = await reviewArchitecture({
        plan: planWithSecurityIssues,
      });

      result.security.vulnerabilities.forEach((vuln) => {
        expect(vuln.mitigation).toBeTruthy();
      });
    });

    it('should detect plain text password storage', async () => {
      const result = await reviewArchitecture({
        plan: planWithSecurityIssues,
      });

      const hasPasswordIssue = result.security.vulnerabilities.some(
        (v) =>
          v.description.toLowerCase().includes('password') ||
          v.title.toLowerCase().includes('password')
      );
      expect(hasPasswordIssue).toBe(true);
    });

    it('should provide security recommendations', async () => {
      const result = await reviewArchitecture({
        plan: planWithSecurityIssues,
      });

      expect(result.security.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Testability Analysis', () => {
    it('should provide testability score', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.testability.score).toBeGreaterThanOrEqual(0);
      expect(result.testability.score).toBeLessThanOrEqual(100);
    });

    it('should identify testability concerns', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      expect(result.testability.concerns.length).toBeGreaterThan(0);
    });

    it('should provide testability recommendations', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(Array.isArray(result.testability.recommendations)).toBe(true);
    });

    it('should penalize plans without testing strategy', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      // "No tests needed" should lower testability score
      expect(result.testability.score).toBeLessThan(70);
    });
  });

  describe('Focus Area Filtering', () => {
    it('should filter analysis by backend focus', async () => {
      const result = await reviewArchitecture({
        ...defaultParams,
        focus: 'backend',
      });

      // Should still have all sections but backend-focused
      expect(result.overall.score).toBeGreaterThan(0);
    });

    it('should filter analysis by frontend focus', async () => {
      const result = await reviewArchitecture({
        ...defaultParams,
        focus: 'frontend',
      });

      expect(result.overall.score).toBeGreaterThan(0);
    });

    it('should analyze all areas when focus is "all"', async () => {
      const result = await reviewArchitecture({
        ...defaultParams,
        focus: 'all',
      });

      expect(result.overall.score).toBeGreaterThan(0);
    });
  });

  describe('Overall Score Calculation', () => {
    it('should give high scores to well-architected plans', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.overall.score).toBeGreaterThan(70);
    });

    it('should give lower scores to plans with anti-patterns', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      expect(result.overall.score).toBeLessThan(60);
    });

    it('should identify strengths in well-architected plans', async () => {
      const result = await reviewArchitecture(defaultParams);

      expect(result.overall.strengths.length).toBeGreaterThan(0);
    });

    it('should identify concerns in problematic plans', async () => {
      const result = await reviewArchitecture({
        plan: planWithAntiPatterns,
      });

      expect(result.overall.concerns.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing plan content', async () => {
      const result = await reviewArchitecture({});

      expect(result.overall.score).toBe(0);
    });

    it('should handle empty plan', async () => {
      const result = await reviewArchitecture({ plan: '' });

      expect(result.overall.score).toBe(0);
    });

    it('should handle file not found', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('ENOENT'));

      await expect(
        reviewArchitecture({ planPath: '/nonexistent/path.md' })
      ).rejects.toThrow();
    });
  });
});
