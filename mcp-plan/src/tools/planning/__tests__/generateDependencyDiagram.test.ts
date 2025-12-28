// src/tools/planning/__tests__/generateDependencyDiagram.test.ts
// Tests for Mermaid diagram generation

import { describe, it, expect } from 'vitest';
import {
  generateDependencyDiagram,
  DiagramOptions,
  DependencyDiagram,
} from '../generateDependencyDiagram.js';

// Sample session data for testing
const simpleSessions = [
  { number: 1, title: 'Project Setup', dependencies: [], domain: 'infrastructure' },
  { number: 2, title: 'Database Models', dependencies: [1], domain: 'backend' },
  { number: 3, title: 'API Endpoints', dependencies: [2], domain: 'backend' },
];

const parallelSessions = [
  { number: 1, title: 'Project Setup', dependencies: [], domain: 'infrastructure' },
  { number: 2, title: 'Backend Models', dependencies: [1], domain: 'backend' },
  { number: 3, title: 'Frontend Setup', dependencies: [1], domain: 'frontend' },
  { number: 4, title: 'Mobile Setup', dependencies: [1], domain: 'mobile' },
  { number: 5, title: 'Integration', dependencies: [2, 3, 4], domain: 'e2e' },
];

const complexSessions = [
  { number: 1, title: 'Setup', dependencies: [], estimatedTime: '2h', domain: 'infrastructure' },
  { number: 2, title: 'Auth Backend', dependencies: [1], estimatedTime: '4h', domain: 'backend' },
  { number: 3, title: 'Auth Frontend', dependencies: [2], estimatedTime: '3h', domain: 'frontend' },
  { number: 4, title: 'Products API', dependencies: [1], estimatedTime: '5h', domain: 'backend' },
  { number: 5, title: 'Products UI', dependencies: [4], estimatedTime: '4h', domain: 'frontend' },
  { number: 6, title: 'Cart Backend', dependencies: [2, 4], estimatedTime: '4h', domain: 'backend' },
  { number: 7, title: 'Cart Frontend', dependencies: [3, 5, 6], estimatedTime: '5h', domain: 'frontend' },
  { number: 8, title: 'E2E Tests', dependencies: [7], estimatedTime: '3h', domain: 'e2e' },
];

describe('generateDependencyDiagram', () => {
  describe('Basic Functionality', () => {
    it('should return a valid DependencyDiagram structure', () => {
      const result = generateDependencyDiagram(simpleSessions);

      expect(result).toHaveProperty('mermaid');
      expect(result).toHaveProperty('criticalPath');
      expect(result).toHaveProperty('parallelGroups');
      expect(result).toHaveProperty('totalNodes');
      expect(result).toHaveProperty('totalEdges');
    });

    it('should generate valid Mermaid flowchart syntax', () => {
      const result = generateDependencyDiagram(simpleSessions);

      expect(result.mermaid).toContain('flowchart');
      expect(result.mermaid).toContain('S1');
      expect(result.mermaid).toContain('S2');
      expect(result.mermaid).toContain('S3');
    });

    it('should include session titles in nodes', () => {
      const result = generateDependencyDiagram(simpleSessions);

      expect(result.mermaid).toContain('Project Setup');
      expect(result.mermaid).toContain('Database Models');
      expect(result.mermaid).toContain('API Endpoints');
    });

    it('should show correct node and edge counts', () => {
      const result = generateDependencyDiagram(simpleSessions);

      expect(result.totalNodes).toBe(3);
      expect(result.totalEdges).toBe(2); // S1->S2, S2->S3
    });
  });

  describe('Dependency Edges', () => {
    it('should create edges for dependencies', () => {
      const result = generateDependencyDiagram(simpleSessions);

      // S1 -> S2 (Session 2 depends on Session 1)
      expect(result.mermaid).toMatch(/S1\s*-->\s*S2/);
      // S2 -> S3 (Session 3 depends on Session 2)
      expect(result.mermaid).toMatch(/S2\s*-->\s*S3/);
    });

    it('should handle multiple dependencies', () => {
      const result = generateDependencyDiagram(parallelSessions);

      // Session 5 depends on 2, 3, 4
      expect(result.mermaid).toMatch(/S2\s*-->\s*S5/);
      expect(result.mermaid).toMatch(/S3\s*-->\s*S5/);
      expect(result.mermaid).toMatch(/S4\s*-->\s*S5/);
    });

    it('should handle sessions with no dependencies', () => {
      const sessions = [
        { number: 1, title: 'Independent 1', dependencies: [], domain: 'backend' },
        { number: 2, title: 'Independent 2', dependencies: [], domain: 'frontend' },
      ];

      const result = generateDependencyDiagram(sessions);

      expect(result.totalNodes).toBe(2);
      expect(result.totalEdges).toBe(0);
    });
  });

  describe('Critical Path', () => {
    it('should identify the critical path', () => {
      const result = generateDependencyDiagram(complexSessions);

      expect(result.criticalPath).toBeDefined();
      expect(result.criticalPath.length).toBeGreaterThan(0);
    });

    it('should include start and end sessions in critical path', () => {
      const result = generateDependencyDiagram(complexSessions);

      // Critical path should start from a root node (no dependencies)
      expect(result.criticalPath[0]).toBe(1);
      // Critical path should end at a leaf node (no dependents)
      expect(result.criticalPath[result.criticalPath.length - 1]).toBe(8);
    });

    it('should highlight critical path in mermaid when option enabled', () => {
      const result = generateDependencyDiagram(complexSessions, {
        highlightCriticalPath: true,
      });

      // Should have style definitions for critical path
      expect(result.mermaid).toContain('style');
      // Or use link styling
      expect(result.mermaid).toMatch(/linkStyle|style\s+S\d/);
    });

    it('should calculate critical path based on longest duration', () => {
      const result = generateDependencyDiagram(complexSessions);

      // The critical path should be the longest path through the graph
      // In complexSessions: 1->4->5->7->8 or 1->2->6->7->8 could be critical
      expect(result.criticalPath.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Parallel Groups', () => {
    it('should identify sessions that can run in parallel', () => {
      const result = generateDependencyDiagram(parallelSessions);

      expect(result.parallelGroups).toBeDefined();
      expect(result.parallelGroups.length).toBeGreaterThan(0);
    });

    it('should group sessions with same dependencies', () => {
      const result = generateDependencyDiagram(parallelSessions);

      // Sessions 2, 3, 4 all depend only on session 1
      const parallelGroup = result.parallelGroups.find(
        g => g.sessions.includes(2) && g.sessions.includes(3) && g.sessions.includes(4)
      );
      expect(parallelGroup).toBeDefined();
    });

    it('should show parallel groups in subgraphs when option enabled', () => {
      const result = generateDependencyDiagram(parallelSessions, {
        showParallelGroups: true,
      });

      expect(result.mermaid).toContain('subgraph');
    });
  });

  describe('Domain Styling', () => {
    it('should apply domain-based styling when enabled', () => {
      const result = generateDependencyDiagram(parallelSessions, {
        colorByDomain: true,
      });

      // Should have class definitions for domains
      expect(result.mermaid).toContain('classDef');
    });

    it('should have different styles for different domains', () => {
      const result = generateDependencyDiagram(parallelSessions, {
        colorByDomain: true,
      });

      expect(result.mermaid).toContain('backend');
      expect(result.mermaid).toContain('frontend');
    });
  });

  describe('Diagram Direction', () => {
    it('should default to top-to-bottom direction', () => {
      const result = generateDependencyDiagram(simpleSessions);

      expect(result.mermaid).toContain('flowchart TB');
    });

    it('should support left-to-right direction', () => {
      const result = generateDependencyDiagram(simpleSessions, {
        direction: 'LR',
      });

      expect(result.mermaid).toContain('flowchart LR');
    });

    it('should support all valid directions', () => {
      const directions = ['TB', 'BT', 'LR', 'RL'] as const;

      for (const direction of directions) {
        const result = generateDependencyDiagram(simpleSessions, { direction });
        expect(result.mermaid).toContain(`flowchart ${direction}`);
      }
    });
  });

  describe('Node Shapes', () => {
    it('should use different shapes for different session types', () => {
      const result = generateDependencyDiagram(complexSessions, {
        showNodeShapes: true,
      });

      // Root nodes (no dependencies) could be stadium shape
      // Leaf nodes (no dependents) could be hexagon
      // Normal nodes default to rectangle
      expect(result.mermaid).toMatch(/\[\[|\(\[|\{\{|\[\(/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty session list', () => {
      const result = generateDependencyDiagram([]);

      expect(result.mermaid).toContain('flowchart');
      expect(result.totalNodes).toBe(0);
      expect(result.totalEdges).toBe(0);
      expect(result.criticalPath).toEqual([]);
    });

    it('should handle single session', () => {
      const result = generateDependencyDiagram([
        { number: 1, title: 'Only Session', dependencies: [], domain: 'backend' },
      ]);

      expect(result.totalNodes).toBe(1);
      expect(result.totalEdges).toBe(0);
      expect(result.criticalPath).toEqual([1]);
    });

    it('should handle sessions with special characters in titles', () => {
      const sessions = [
        { number: 1, title: 'Setup & Config', dependencies: [], domain: 'infrastructure' },
        { number: 2, title: 'API "Endpoints"', dependencies: [1], domain: 'backend' },
      ];

      const result = generateDependencyDiagram(sessions);

      // Should escape or handle special characters
      expect(result.mermaid).toBeDefined();
      expect(() => result.mermaid).not.toThrow();
    });

    it('should handle very long session titles', () => {
      const sessions = [
        {
          number: 1,
          title: 'This is a very long session title that might need to be truncated for display purposes',
          dependencies: [],
          domain: 'backend',
        },
      ];

      const result = generateDependencyDiagram(sessions, {
        maxTitleLength: 30,
      });

      // Title should be truncated
      expect(result.mermaid).toContain('...');
    });

    it('should handle missing dependencies gracefully', () => {
      const sessions = [
        { number: 1, title: 'First', dependencies: [], domain: 'backend' },
        { number: 3, title: 'Third', dependencies: [2], domain: 'backend' }, // Session 2 doesn't exist
      ];

      const result = generateDependencyDiagram(sessions);

      // Should not crash, might skip invalid edge
      expect(result.totalNodes).toBe(2);
    });
  });

  describe('Output Formats', () => {
    it('should include markdown code block when requested', () => {
      const result = generateDependencyDiagram(simpleSessions, {
        wrapInCodeBlock: true,
      });

      expect(result.mermaid).toMatch(/^```mermaid\n/);
      expect(result.mermaid).toMatch(/\n```$/);
    });

    it('should include legend when requested', () => {
      const result = generateDependencyDiagram(parallelSessions, {
        includeLegend: true,
        colorByDomain: true,
      });

      expect(result.mermaid).toContain('Legend');
    });
  });

  describe('Integration with critiquePlan data', () => {
    it('should accept sessions in critiquePlan format', () => {
      // Format from critiquePlan's parseSessions
      const critiqueSessions = [
        {
          number: 1,
          title: 'Setup',
          estimatedTime: '2h',
          domain: 'infrastructure',
          dependencies: [],
          objectives: ['Setup project', 'Configure tools'],
        },
        {
          number: 2,
          title: 'Implementation',
          estimatedTime: '4h',
          domain: 'backend',
          dependencies: [1],
          objectives: ['Build features'],
        },
      ];

      const result = generateDependencyDiagram(critiqueSessions);

      expect(result.totalNodes).toBe(2);
      expect(result.totalEdges).toBe(1);
    });
  });
});
