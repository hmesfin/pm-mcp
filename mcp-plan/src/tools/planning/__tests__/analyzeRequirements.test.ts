// src/tools/planning/__tests__/analyzeRequirements.test.ts
// Tests for analyzeRequirements tool

import { describe, it, expect } from 'vitest';
import { analyzeRequirements } from '../analyzeRequirements.js';
import type {
  AnalyzeRequirementsParams,
  RequirementsAnalysis,
} from '../../../types/tools.js';

// Sample well-formed requirements document
const wellFormedRequirements = `# Project Requirements: Blog Platform

## Overview
A modern blog platform with user authentication, post management, and commenting.

## Functional Requirements

### User Management
- Users can register with email and password
- Users can login and logout
- Users can reset their password via email
- Users have profiles with avatar and bio

### Blog Posts
- Authenticated users can create, edit, and delete posts
- Posts have title, content, featured image, and tags
- Posts can be published or saved as drafts
- Posts support markdown formatting

### Comments
- Authenticated users can comment on posts
- Comment authors can edit or delete their comments
- Comments support threaded replies

### Search
- Users can search posts by title and content
- Users can filter posts by tags

## Non-Functional Requirements

### Performance
- Page load time < 2 seconds
- Support 1000 concurrent users

### Security
- HTTPS required
- Password hashing with bcrypt
- CSRF protection
- Rate limiting on API endpoints

## Technical Stack
- Backend: Django REST Framework
- Frontend: Vue.js 3
- Database: PostgreSQL
- Cache: Redis
`;

// Requirements with gaps
const requirementsWithGaps = `# Project Requirements: E-commerce Platform

## Overview
An e-commerce platform for selling products online.

## Functional Requirements

### Products
- Admin can add, edit, and delete products
- Products have name, description, price, and images

### Shopping Cart
- Users can add products to cart
- Users can update quantities

### Checkout
- Users can checkout with credit card

## Technical Stack
- Backend: FastAPI
`;

// Requirements with conflicts
const requirementsWithConflicts = `# Project Requirements: Social App

## Overview
A social networking application.

## Functional Requirements

### Users
- Users must be 18+ to register
- Users of any age can register
- All user data stored indefinitely
- User data deleted after 30 days of inactivity

### Posts
- Posts are private by default
- All posts are public and visible to everyone

## Performance
- Real-time updates required
- Batch processing only, no real-time features
`;

// Requirements with ambiguities
const requirementsWithAmbiguities = `# Project Requirements

## Features
- The system should be fast
- Users should have a good experience
- Data should be secure
- The application should scale well
- Support for multiple platforms
`;

// Minimal requirements
const minimalRequirements = `# My App

Build an app.
`;

describe('analyzeRequirements', () => {
  describe('Basic Functionality', () => {
    it('should return a valid RequirementsAnalysis structure', async () => {
      const params: AnalyzeRequirementsParams = {
        requirements: wellFormedRequirements,
      };

      const result = await analyzeRequirements(params);

      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('completeness');
      expect(result).toHaveProperty('clarity');
      expect(result).toHaveProperty('feasibility');
      expect(result).toHaveProperty('gaps');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('ambiguities');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('risks');
      expect(result).toHaveProperty('estimatedComplexity');
    });

    it('should return numeric scores between 0 and 100', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(result.completeness).toBeGreaterThanOrEqual(0);
      expect(result.completeness).toBeLessThanOrEqual(100);
      expect(result.clarity).toBeGreaterThanOrEqual(0);
      expect(result.clarity).toBeLessThanOrEqual(100);
      expect(result.feasibility).toBeGreaterThanOrEqual(0);
      expect(result.feasibility).toBeLessThanOrEqual(100);
    });

    it('should return arrays for gaps, conflicts, ambiguities, suggestions, risks', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(Array.isArray(result.gaps)).toBe(true);
      expect(Array.isArray(result.conflicts)).toBe(true);
      expect(Array.isArray(result.ambiguities)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.risks)).toBe(true);
    });

    it('should return a valid complexity level', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(['basic', 'intermediate', 'advanced']).toContain(
        result.estimatedComplexity
      );
    });
  });

  describe('Completeness Analysis', () => {
    it('should score well-formed requirements higher', async () => {
      const wellFormed = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });
      const minimal = await analyzeRequirements({
        requirements: minimalRequirements,
      });

      expect(wellFormed.completeness).toBeGreaterThan(minimal.completeness);
    });

    it('should mark requirements as valid when completeness is high', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(result.valid).toBe(true);
    });

    it('should mark minimal requirements as invalid', async () => {
      const result = await analyzeRequirements({
        requirements: minimalRequirements,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Gap Detection', () => {
    it('should detect missing sections in requirements', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      expect(result.gaps.length).toBeGreaterThan(0);
    });

    it('should categorize gaps correctly', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      const validCategories = [
        'data-model',
        'api',
        'ui',
        'workflow',
        'security',
        'testing',
      ];
      result.gaps.forEach((gap) => {
        expect(validCategories).toContain(gap.category);
      });
    });

    it('should assign severity to gaps', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      const validSeverities = ['minor', 'major', 'critical'];
      result.gaps.forEach((gap) => {
        expect(validSeverities).toContain(gap.severity);
      });
    });

    it('should provide recommendations for each gap', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      result.gaps.forEach((gap) => {
        expect(gap.recommendation).toBeTruthy();
        expect(gap.recommendation.length).toBeGreaterThan(0);
      });
    });

    it('should detect missing security requirements', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      const securityGap = result.gaps.find((g) => g.category === 'security');
      expect(securityGap).toBeDefined();
    });

    it('should detect missing testing requirements', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      // No testing section in requirementsWithGaps
      const testingGap = result.gaps.find((g) => g.category === 'testing');
      expect(testingGap).toBeDefined();
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflicting requirements', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithConflicts,
      });

      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should categorize conflicts correctly', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithConflicts,
      });

      const validCategories = ['technical', 'business', 'timeline', 'scope'];
      result.conflicts.forEach((conflict) => {
        expect(validCategories).toContain(conflict.category);
      });
    });

    it('should identify conflicting items', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithConflicts,
      });

      result.conflicts.forEach((conflict) => {
        expect(conflict.conflictingItems.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should provide recommendations for resolving conflicts', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithConflicts,
      });

      result.conflicts.forEach((conflict) => {
        expect(conflict.recommendation).toBeTruthy();
      });
    });

    it('should have no conflicts in well-formed requirements', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(result.conflicts.length).toBe(0);
    });
  });

  describe('Ambiguity Detection', () => {
    it('should detect ambiguous requirements', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });

      expect(result.ambiguities.length).toBeGreaterThan(0);
    });

    it('should identify location of ambiguity', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });

      result.ambiguities.forEach((ambiguity) => {
        expect(ambiguity.location).toBeTruthy();
      });
    });

    it('should identify the ambiguous text', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });

      result.ambiguities.forEach((ambiguity) => {
        expect(ambiguity.text).toBeTruthy();
      });
    });

    it('should explain why the text is ambiguous', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });

      result.ambiguities.forEach((ambiguity) => {
        expect(ambiguity.issue).toBeTruthy();
      });
    });

    it('should suggest clarification needed', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });

      result.ambiguities.forEach((ambiguity) => {
        expect(ambiguity.clarificationNeeded).toBeTruthy();
      });
    });

    it('should detect vague terms like "fast" and "good"', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });

      const vagueTerms = ['fast', 'good', 'secure', 'scale', 'multiple'];
      const foundVague = result.ambiguities.some((a) =>
        vagueTerms.some(
          (term) =>
            a.text.toLowerCase().includes(term) ||
            a.issue.toLowerCase().includes(term)
        )
      );
      expect(foundVague).toBe(true);
    });
  });

  describe('Clarity Score', () => {
    it('should give lower clarity scores for ambiguous requirements', async () => {
      const ambiguous = await analyzeRequirements({
        requirements: requirementsWithAmbiguities,
      });
      const clear = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(clear.clarity).toBeGreaterThan(ambiguous.clarity);
    });
  });

  describe('Feasibility Analysis', () => {
    it('should assess feasibility of requirements', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(result.feasibility).toBeGreaterThan(0);
    });

    it('should have lower feasibility for conflicting requirements', async () => {
      const conflicting = await analyzeRequirements({
        requirements: requirementsWithConflicts,
      });
      const wellFormed = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(wellFormed.feasibility).toBeGreaterThan(conflicting.feasibility);
    });
  });

  describe('Suggestions', () => {
    it('should provide improvement suggestions', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should categorize suggestions', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      const validCategories = ['feature', 'architecture', 'tooling', 'workflow'];
      result.suggestions.forEach((suggestion) => {
        expect(validCategories).toContain(suggestion.category);
      });
    });

    it('should include effort estimates for suggestions', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      const validEfforts = ['low', 'medium', 'high'];
      result.suggestions.forEach((suggestion) => {
        expect(validEfforts).toContain(suggestion.effort);
      });
    });
  });

  describe('Risk Assessment', () => {
    it('should identify risks in requirements', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should categorize risks correctly', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

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

    it('should assign severity to risks', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      const validSeverities = ['low', 'medium', 'high', 'critical'];
      result.risks.forEach((risk) => {
        expect(validSeverities).toContain(risk.severity);
      });
    });

    it('should provide mitigation for each risk', async () => {
      const result = await analyzeRequirements({
        requirements: requirementsWithGaps,
      });

      result.risks.forEach((risk) => {
        expect(risk.mitigation).toBeTruthy();
      });
    });
  });

  describe('Complexity Estimation', () => {
    it('should estimate basic complexity for simple requirements', async () => {
      const result = await analyzeRequirements({
        requirements: minimalRequirements,
      });

      expect(result.estimatedComplexity).toBe('basic');
    });

    it('should estimate higher complexity for detailed requirements', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
      });

      expect(['intermediate', 'advanced']).toContain(result.estimatedComplexity);
    });
  });

  describe('Project Type Analysis', () => {
    it('should use project type for domain-specific analysis', async () => {
      const blogResult = await analyzeRequirements({
        requirements: wellFormedRequirements,
        projectType: 'blog',
      });

      const ecommerceResult = await analyzeRequirements({
        requirements: wellFormedRequirements,
        projectType: 'ecommerce',
      });

      // E-commerce analysis should find more gaps when analyzing blog reqs
      expect(ecommerceResult.gaps.length).toBeGreaterThanOrEqual(
        blogResult.gaps.length
      );
    });

    it('should detect missing e-commerce features when projectType is ecommerce', async () => {
      const result = await analyzeRequirements({
        requirements: wellFormedRequirements,
        projectType: 'ecommerce',
      });

      // Blog requirements missing payment, inventory, shipping
      const hasEcommerceGaps = result.gaps.some(
        (g) =>
          g.description.toLowerCase().includes('payment') ||
          g.description.toLowerCase().includes('inventory') ||
          g.description.toLowerCase().includes('order')
      );
      expect(hasEcommerceGaps).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty requirements string', async () => {
      const result = await analyzeRequirements({
        requirements: '',
      });

      expect(result.valid).toBe(false);
      expect(result.completeness).toBe(0);
    });

    it('should handle requirements with only whitespace', async () => {
      const result = await analyzeRequirements({
        requirements: '   \n\n   \t   ',
      });

      expect(result.valid).toBe(false);
    });

    it('should handle very long requirements', async () => {
      const longRequirements = wellFormedRequirements.repeat(10);
      const result = await analyzeRequirements({
        requirements: longRequirements,
      });

      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
    });

    it('should handle requirements with special characters', async () => {
      const specialChars = `# Requirements

## Features
- Support for emoji: 🎉 🚀 ✅
- Handle <html> tags & entities
- Process "quoted" strings and 'apostrophes'
- Deal with \`code blocks\`
`;
      const result = await analyzeRequirements({
        requirements: specialChars,
      });

      expect(result).toBeDefined();
    });

    it('should handle requirements in different markdown formats', async () => {
      const alternativeFormat = `
# Title

**Bold section**

1. Numbered item
2. Another item

* Bullet point
* Another bullet

| Table | Header |
|-------|--------|
| Cell  | Cell   |

> Blockquote

\`\`\`javascript
const code = 'block';
\`\`\`
`;
      const result = await analyzeRequirements({
        requirements: alternativeFormat,
      });

      expect(result).toBeDefined();
    });
  });
});
