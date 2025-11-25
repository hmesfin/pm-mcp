// src/resources/__tests__/resources.test.ts
// Tests for MCP resource handlers

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listResources,
  readResource,
  getProjectResource,
  getTemplateResource,
  getPatternResource,
  getMetricsResource,
} from '../index.js';
import * as fs from 'fs/promises';

// Mock fs module
vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  access: vi.fn(),
  stat: vi.fn(),
}));

describe('Resource Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listResources', () => {
    it('should return all available resource types', async () => {
      const resources = await listResources();

      expect(resources.length).toBeGreaterThanOrEqual(4);
    });

    it('should include project resource', async () => {
      const resources = await listResources();

      const projectResource = resources.find((r) => r.uri === 'project://list');
      expect(projectResource).toBeDefined();
      expect(projectResource?.name).toBe('All Projects');
    });

    it('should include template resource', async () => {
      const resources = await listResources();

      const templateResource = resources.find((r) => r.uri === 'template://list');
      expect(templateResource).toBeDefined();
      expect(templateResource?.name).toBe('Available Templates');
    });

    it('should include pattern resource', async () => {
      const resources = await listResources();

      const patternResource = resources.find((r) => r.uri === 'pattern://list');
      expect(patternResource).toBeDefined();
      expect(patternResource?.name).toBe('Best Practices Patterns');
    });

    it('should include metrics resource', async () => {
      const resources = await listResources();

      const metricsResource = resources.find((r) => r.uri === 'metrics://all');
      expect(metricsResource).toBeDefined();
      expect(metricsResource?.name).toBe('Historical Metrics');
    });

    it('should have correct mimeType for all resources', async () => {
      const resources = await listResources();

      resources.forEach((r) => {
        expect(['application/json', 'text/markdown']).toContain(r.mimeType);
      });
    });

    it('should have descriptions for all resources', async () => {
      const resources = await listResources();

      resources.forEach((r) => {
        expect(r.description).toBeTruthy();
        expect(r.description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('readResource', () => {
    it('should route to project handler for project:// URIs', async () => {
      const result = await readResource('project://list');

      expect(result).toBeDefined();
      expect(result.uri).toBe('project://list');
    });

    it('should route to template handler for template:// URIs', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['blog', 'ecommerce'] as any);

      const result = await readResource('template://list');

      expect(result).toBeDefined();
      expect(result.uri).toBe('template://list');
    });

    it('should route to pattern handler for pattern:// URIs', async () => {
      const result = await readResource('pattern://list');

      expect(result).toBeDefined();
      expect(result.uri).toBe('pattern://list');
    });

    it('should route to metrics handler for metrics:// URIs', async () => {
      const result = await readResource('metrics://all');

      expect(result).toBeDefined();
      expect(result.uri).toBe('metrics://all');
    });

    it('should throw error for unknown URI scheme', async () => {
      await expect(readResource('unknown://test')).rejects.toThrow();
    });

    it('should return proper mimeType', async () => {
      const result = await readResource('project://list');

      expect(result.mimeType).toBe('application/json');
    });
  });

  describe('getProjectResource', () => {
    it('should list all projects for project://list', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['project1', 'project2'] as any);
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);

      const result = await getProjectResource('project://list');

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
    });

    it('should return empty array when no projects exist', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([] as any);

      const result = await getProjectResource('project://list');

      expect(JSON.parse(result.text).projects).toEqual([]);
    });

    it('should get specific project by name', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify({
        name: 'my-project',
        status: 'in_progress',
      }));
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await getProjectResource('project://my-project');

      expect(result).toBeDefined();
      expect(result.uri).toBe('project://my-project');
    });

    it('should throw error for non-existent project', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      await expect(getProjectResource('project://nonexistent')).rejects.toThrow();
    });
  });

  describe('getTemplateResource', () => {
    it('should list all templates for template://list', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['blog', 'ecommerce', 'saas'] as any);
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);

      const result = await getTemplateResource('template://list');

      expect(result).toBeDefined();
      const templates = JSON.parse(result.text).templates;
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should return template metadata for specific template', async () => {
      vi.mocked(fs.readFile).mockResolvedValue(`# Blog Template

## Description
A modern blog platform template.

## Complexity
intermediate

## Features
- User authentication
- Post management
- Comments
`);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await getTemplateResource('template://blog');

      expect(result).toBeDefined();
      expect(result.uri).toBe('template://blog');
    });

    it('should return template file content for template://type/file', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('# Project Plan Template\n...');
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await getTemplateResource('template://blog/PROJECT_PLAN');

      expect(result).toBeDefined();
      expect(result.mimeType).toBe('text/markdown');
    });

    it('should include complexity in template list', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(['blog'] as any);
      vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } as any);
      vi.mocked(fs.readFile).mockResolvedValue(`# Blog Template
## Complexity
intermediate
`);

      const result = await getTemplateResource('template://list');

      const templates = JSON.parse(result.text).templates;
      expect(templates[0]).toHaveProperty('complexity');
    });

    it('should throw error for non-existent template', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      await expect(getTemplateResource('template://nonexistent')).rejects.toThrow();
    });
  });

  describe('getPatternResource', () => {
    it('should list all patterns for pattern://list', async () => {
      const result = await getPatternResource('pattern://list');

      expect(result).toBeDefined();
      const patterns = JSON.parse(result.text).patterns;
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should categorize patterns by domain', async () => {
      const result = await getPatternResource('pattern://list');

      const data = JSON.parse(result.text);
      expect(data.categories).toBeDefined();
    });

    it('should return patterns by category for pattern://category', async () => {
      const result = await getPatternResource('pattern://backend');

      expect(result).toBeDefined();
      const patterns = JSON.parse(result.text).patterns;
      patterns.forEach((p: any) => {
        expect(p.category).toBe('backend');
      });
    });

    it('should return specific pattern for pattern://category/name', async () => {
      const result = await getPatternResource('pattern://backend/repository');

      expect(result).toBeDefined();
      const pattern = JSON.parse(result.text);
      expect(pattern.name).toBeTruthy();
    });

    it('should include pattern metadata', async () => {
      const result = await getPatternResource('pattern://list');

      const data = JSON.parse(result.text);
      if (data.patterns.length > 0) {
        const pattern = data.patterns[0];
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('category');
        expect(pattern).toHaveProperty('description');
      }
    });

    it('should include usage statistics', async () => {
      const result = await getPatternResource('pattern://list');

      const data = JSON.parse(result.text);
      if (data.patterns.length > 0) {
        const pattern = data.patterns[0];
        expect(pattern).toHaveProperty('usageCount');
      }
    });

    it('should return 404-style error for unknown pattern', async () => {
      await expect(
        getPatternResource('pattern://backend/nonexistent-pattern-xyz')
      ).rejects.toThrow();
    });
  });

  describe('getMetricsResource', () => {
    it('should return aggregated metrics for metrics://all', async () => {
      const result = await getMetricsResource('metrics://all');

      expect(result).toBeDefined();
      const data = JSON.parse(result.text);
      expect(data.aggregated).toBeDefined();
    });

    it('should include project count', async () => {
      const result = await getMetricsResource('metrics://all');

      const data = JSON.parse(result.text);
      expect(typeof data.aggregated.totalProjects).toBe('number');
    });

    it('should include session count', async () => {
      const result = await getMetricsResource('metrics://all');

      const data = JSON.parse(result.text);
      expect(typeof data.aggregated.totalSessions).toBe('number');
    });

    it('should include estimation accuracy', async () => {
      const result = await getMetricsResource('metrics://all');

      const data = JSON.parse(result.text);
      expect(data.aggregated.estimationAccuracy).toBeDefined();
    });

    it('should include velocity metrics', async () => {
      const result = await getMetricsResource('metrics://all');

      const data = JSON.parse(result.text);
      expect(data.aggregated.velocity).toBeDefined();
    });

    it('should return estimation metrics for metrics://estimation', async () => {
      const result = await getMetricsResource('metrics://estimation');

      expect(result).toBeDefined();
      const data = JSON.parse(result.text);
      expect(data.estimation).toBeDefined();
    });

    it('should return velocity metrics for metrics://velocity', async () => {
      const result = await getMetricsResource('metrics://velocity');

      expect(result).toBeDefined();
      const data = JSON.parse(result.text);
      expect(data.velocity).toBeDefined();
    });

    it('should include common risks', async () => {
      const result = await getMetricsResource('metrics://all');

      const data = JSON.parse(result.text);
      expect(data.risks).toBeDefined();
    });

    it('should include pattern usage statistics', async () => {
      const result = await getMetricsResource('metrics://all');

      const data = JSON.parse(result.text);
      expect(data.patterns).toBeDefined();
    });
  });

  describe('URI Parsing', () => {
    it('should parse simple URI correctly', async () => {
      const result = await readResource('project://list');

      expect(result.uri).toBe('project://list');
    });

    it('should parse URI with path segments', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('content');
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await readResource('template://blog/PROJECT_PLAN');

      expect(result.uri).toBe('template://blog/PROJECT_PLAN');
    });

    it('should handle URIs with special characters', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));

      // Should not crash, even if project doesn't exist
      await expect(readResource('project://my-project-2024')).rejects.toThrow();
    });
  });

  describe('Content Format', () => {
    it('should return JSON for application/json mimeType', async () => {
      const result = await readResource('project://list');

      expect(result.mimeType).toBe('application/json');
      // Should be valid JSON
      expect(() => JSON.parse(result.text)).not.toThrow();
    });

    it('should return markdown for text/markdown mimeType', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('# Template Content');
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await readResource('template://blog/README');

      expect(result.mimeType).toBe('text/markdown');
    });
  });
});
