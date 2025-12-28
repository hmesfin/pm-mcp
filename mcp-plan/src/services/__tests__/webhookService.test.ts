// src/services/__tests__/webhookService.test.ts
// Tests for webhook delivery service

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebhookService,
  createWebhookPayload,
  signPayload,
  calculateRetryDelay,
} from '../webhookService.js';
import type {
  WebhookConfig,
  WebhookEventType,
  WebhookPayload,
  Session,
  Phase,
} from '../../types/common.js';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Sample data
const sampleSession: Partial<Session> = {
  number: 1,
  title: 'Project Setup',
  domain: 'infrastructure',
  phase: 1,
  phaseName: 'Foundation',
  status: 'in_progress',
  objectives: ['Setup project', 'Configure tools'],
};

const samplePhase: Partial<Phase> = {
  number: 1,
  name: 'Foundation',
  completedSessions: 5,
  totalSessions: 5,
};

const sampleWebhookConfig: WebhookConfig = {
  id: 'webhook-1',
  url: 'https://example.com/webhook',
  secret: 'test-secret',
  events: ['session_started', 'session_completed'],
  enabled: true,
  retryCount: 3,
  timeoutMs: 10000,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(() => {
    mockFetch.mockReset();
    service = new WebhookService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Configuration Management', () => {
    it('should add a webhook configuration', () => {
      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });

      expect(webhook.id).toBeDefined();
      expect(webhook.url).toBe('https://example.com/webhook');
      expect(webhook.events).toContain('session_started');
      expect(webhook.enabled).toBe(true);
    });

    it('should list all webhook configurations', () => {
      service.addWebhook({ url: 'https://example1.com/webhook', events: ['session_started'] });
      service.addWebhook({ url: 'https://example2.com/webhook', events: ['session_completed'] });

      const webhooks = service.listWebhooks();

      expect(webhooks).toHaveLength(2);
    });

    it('should get a specific webhook by ID', () => {
      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });

      const found = service.getWebhook(webhook.id);

      expect(found).toBeDefined();
      expect(found?.url).toBe('https://example.com/webhook');
    });

    it('should update a webhook configuration', () => {
      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });

      const updated = service.updateWebhook(webhook.id, {
        enabled: false,
        events: ['session_started', 'session_completed'],
      });

      expect(updated?.enabled).toBe(false);
      expect(updated?.events).toContain('session_completed');
    });

    it('should delete a webhook configuration', () => {
      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });

      const deleted = service.deleteWebhook(webhook.id);

      expect(deleted).toBe(true);
      expect(service.getWebhook(webhook.id)).toBeUndefined();
    });

    it('should return false when deleting non-existent webhook', () => {
      const deleted = service.deleteWebhook('non-existent');

      expect(deleted).toBe(false);
    });

    it('should validate webhook URL format', () => {
      expect(() => {
        service.addWebhook({ url: 'invalid-url', events: ['session_started'] });
      }).toThrow(/invalid.*url/i);
    });

    it('should require at least one event type', () => {
      expect(() => {
        service.addWebhook({ url: 'https://example.com/webhook', events: [] });
      }).toThrow(/at least one event/i);
    });
  });

  describe('Payload Creation', () => {
    it('should create payload for session_started event', () => {
      const payload = createWebhookPayload(
        'session_started',
        { name: 'MyProject', owner: 'user', repo: 'repo' },
        { session: sampleSession as Session }
      );

      expect(payload.id).toBeDefined();
      expect(payload.event).toBe('session_started');
      expect(payload.timestamp).toBeInstanceOf(Date);
      expect(payload.project.name).toBe('MyProject');
      expect(payload.session?.number).toBe(1);
      expect(payload.session?.title).toBe('Project Setup');
    });

    it('should create payload for session_completed event', () => {
      const completedSession = {
        ...sampleSession,
        status: 'completed' as const,
        completedAt: new Date(),
        metrics: {
          testsWritten: 10,
          testsPassing: 10,
          testsFailing: 0,
          coverage: 85,
          typeCheckPassing: true,
          lintPassing: true,
        },
      };

      const payload = createWebhookPayload(
        'session_completed',
        { name: 'MyProject' },
        { session: completedSession as Session }
      );

      expect(payload.session?.status).toBe('completed');
      expect(payload.session?.metrics?.testsPassing).toBe(10);
    });

    it('should create payload for phase_completed event', () => {
      const payload = createWebhookPayload(
        'phase_completed',
        { name: 'MyProject' },
        { phase: samplePhase as Phase }
      );

      expect(payload.event).toBe('phase_completed');
      expect(payload.phase?.number).toBe(1);
      expect(payload.phase?.name).toBe('Foundation');
      expect(payload.phase?.completedSessions).toBe(5);
    });

    it('should create payload for session_blocked event', () => {
      const payload = createWebhookPayload(
        'session_blocked',
        { name: 'MyProject' },
        {
          session: sampleSession as Session,
          blocker: {
            sessionNumber: 1,
            reason: 'Missing dependencies',
            blockedBy: [2, 3],
          },
        }
      );

      expect(payload.event).toBe('session_blocked');
      expect(payload.blocker?.reason).toBe('Missing dependencies');
      expect(payload.blocker?.blockedBy).toContain(2);
    });

    it('should generate unique event IDs', () => {
      const payload1 = createWebhookPayload('session_started', { name: 'Project' }, {});
      const payload2 = createWebhookPayload('session_started', { name: 'Project' }, {});

      expect(payload1.id).not.toBe(payload2.id);
    });
  });

  describe('Payload Signing', () => {
    it('should sign payload with HMAC-SHA256', () => {
      const payload: WebhookPayload = {
        id: 'event-123',
        event: 'session_started',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        project: { name: 'Test' },
      };

      const signature = signPayload(payload, 'secret-key');

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^sha256=/);
    });

    it('should produce consistent signatures for same payload', () => {
      const payload: WebhookPayload = {
        id: 'event-123',
        event: 'session_started',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        project: { name: 'Test' },
      };

      const sig1 = signPayload(payload, 'secret-key');
      const sig2 = signPayload(payload, 'secret-key');

      expect(sig1).toBe(sig2);
    });

    it('should produce different signatures for different secrets', () => {
      const payload: WebhookPayload = {
        id: 'event-123',
        event: 'session_started',
        timestamp: new Date('2024-01-01T00:00:00Z'),
        project: { name: 'Test' },
      };

      const sig1 = signPayload(payload, 'secret-key-1');
      const sig2 = signPayload(payload, 'secret-key-2');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('Webhook Delivery', () => {
    it('should deliver webhook to configured URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      service.addWebhook(sampleWebhookConfig);

      const result = await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        { session: sampleSession as Session }
      );

      expect(result).toHaveLength(1);
      expect(result[0].success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include signature header when secret is configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      service.addWebhook(sampleWebhookConfig);

      await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        { session: sampleSession as Session }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Webhook-Signature': expect.stringMatching(/^sha256=/),
          }),
        })
      );
    });

    it('should only deliver to webhooks subscribed to the event', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      service.addWebhook({
        url: 'https://example1.com/webhook',
        events: ['session_started'],
      });
      service.addWebhook({
        url: 'https://example2.com/webhook',
        events: ['session_completed'],  // Not subscribed to session_started
      });

      await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example1.com/webhook',
        expect.any(Object)
      );
    });

    it('should skip disabled webhooks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });
      service.updateWebhook(webhook.id, { enabled: false });

      const results = await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      expect(results).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle failed delivery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
        retryCount: 0,  // Disable retry for this test
      });

      const results = await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      expect(results[0].success).toBe(false);
      expect(results[0].statusCode).toBe(500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
        retryCount: 0,
      });

      const results = await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Network error');
    });
  });

  describe('Retry Logic', () => {
    it('should calculate exponential backoff delay', () => {
      const delay1 = calculateRetryDelay(1);
      const delay2 = calculateRetryDelay(2);
      const delay3 = calculateRetryDelay(3);

      expect(delay2).toBeGreaterThan(delay1);
      expect(delay3).toBeGreaterThan(delay2);
    });

    it('should use exponential backoff: 2^attempt * base', () => {
      // Base delay is 1000ms (1 second)
      const delay1 = calculateRetryDelay(1, 1000);  // 2^1 * 1000 = 2000
      const delay2 = calculateRetryDelay(2, 1000);  // 2^2 * 1000 = 4000
      const delay3 = calculateRetryDelay(3, 1000);  // 2^3 * 1000 = 8000

      expect(delay1).toBe(2000);
      expect(delay2).toBe(4000);
      expect(delay3).toBe(8000);
    });

    it('should cap maximum delay', () => {
      const delay10 = calculateRetryDelay(10, 1000, 30000);  // Would be 1024000, but capped

      expect(delay10).toBe(30000);  // Max delay
    });

    it('should retry on failure up to configured retry count', async () => {
      // First 2 attempts fail, third succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' })
        .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'Error' })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => 'OK' });

      vi.useFakeTimers();

      service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
        retryCount: 3,
      });

      const resultPromise = service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      // Fast-forward through retry delays
      await vi.runAllTimersAsync();

      const results = await resultPromise;

      expect(results[0].success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after exhausting all retries', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Error',
      });

      vi.useFakeTimers();

      service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
        retryCount: 2,
      });

      const resultPromise = service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      await vi.runAllTimersAsync();

      const results = await resultPromise;

      expect(results[0].success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(3);  // Initial + 2 retries
    });

    it('should not retry on 4xx errors (client errors)', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      });

      service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
        retryCount: 3,
      });

      const results = await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      expect(results[0].success).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);  // No retries for 4xx
    });
  });

  describe('Delivery History', () => {
    it('should track delivery attempts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });

      await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      const history = service.getDeliveryHistory(webhook.id);

      expect(history).toHaveLength(1);
      expect(history[0].status).toBe('success');
    });

    it('should store failed delivery details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
        retryCount: 0,
      });

      await service.triggerEvent(
        'session_started',
        { name: 'MyProject' },
        {}
      );

      const history = service.getDeliveryHistory(webhook.id);

      expect(history[0].status).toBe('failed');
      expect(history[0].responseCode).toBe(500);
    });

    it('should limit delivery history size', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'OK',
      });

      const webhook = service.addWebhook({
        url: 'https://example.com/webhook',
        events: ['session_started'],
      });

      // Trigger many events
      for (let i = 0; i < 150; i++) {
        await service.triggerEvent('session_started', { name: 'MyProject' }, {});
      }

      const history = service.getDeliveryHistory(webhook.id);

      // Should be capped at 100 entries
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Concurrent Deliveries', () => {
    it('should deliver to multiple webhooks concurrently', async () => {
      mockFetch.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { ok: true, status: 200, text: async () => 'OK' };
      });

      service.addWebhook({ url: 'https://example1.com/webhook', events: ['session_started'] });
      service.addWebhook({ url: 'https://example2.com/webhook', events: ['session_started'] });
      service.addWebhook({ url: 'https://example3.com/webhook', events: ['session_started'] });

      const start = Date.now();
      await service.triggerEvent('session_started', { name: 'MyProject' }, {});
      const duration = Date.now() - start;

      // Should complete in roughly 100ms (concurrent), not 300ms (sequential)
      expect(duration).toBeLessThan(250);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });
});

describe('Integration with Session Updates', () => {
  let service: WebhookService;

  beforeEach(() => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'OK',
    });
    service = new WebhookService();
  });

  it('should trigger session_started when session status changes to in_progress', async () => {
    service.addWebhook({
      url: 'https://example.com/webhook',
      events: ['session_started'],
    });

    await service.onSessionStatusChange(
      { name: 'MyProject', owner: 'user', repo: 'repo' },
      sampleSession as Session,
      'not_started',
      'in_progress'
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe('session_started');
  });

  it('should trigger session_completed when session status changes to completed', async () => {
    service.addWebhook({
      url: 'https://example.com/webhook',
      events: ['session_completed'],
    });

    await service.onSessionStatusChange(
      { name: 'MyProject' },
      { ...sampleSession, status: 'completed' } as Session,
      'refactor_phase',
      'completed'
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe('session_completed');
  });

  it('should trigger session_blocked when session status changes to blocked', async () => {
    service.addWebhook({
      url: 'https://example.com/webhook',
      events: ['session_blocked'],
    });

    await service.onSessionStatusChange(
      { name: 'MyProject' },
      { ...sampleSession, status: 'blocked' } as Session,
      'in_progress',
      'blocked',
      { reason: 'Waiting for API', blockedBy: [2] }
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe('session_blocked');
    expect(body.blocker.reason).toBe('Waiting for API');
  });

  it('should trigger phase_completed when all sessions in phase are done', async () => {
    service.addWebhook({
      url: 'https://example.com/webhook',
      events: ['phase_completed'],
    });

    await service.onPhaseCompleted(
      { name: 'MyProject' },
      samplePhase as Phase
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const callArgs = mockFetch.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe('phase_completed');
    expect(body.phase.name).toBe('Foundation');
  });
});
