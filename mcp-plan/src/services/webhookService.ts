// src/services/webhookService.ts
/**
 * Webhook delivery service for project progress notifications.
 *
 * This module provides:
 * - Webhook configuration management
 * - Event-based payload creation
 * - HMAC signature for payload verification
 * - Delivery with exponential backoff retry
 * - Delivery history tracking
 *
 * @module webhookService
 */

import crypto from 'crypto';
import type {
  WebhookConfig,
  WebhookEventType,
  WebhookPayload,
  WebhookDelivery,
  WebhookDeliveryResult,
  Session,
  Phase,
  SessionStatus,
} from '../types/common.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_BASE_DELAY_MS = 1000;
const DEFAULT_MAX_DELAY_MS = 30000;
const MAX_HISTORY_SIZE = 100;

// ============================================================================
// TYPES
// ============================================================================

export interface WebhookAddOptions {
  url: string;
  events: WebhookEventType[];
  secret?: string;
  retryCount?: number;
  timeoutMs?: number;
  enabled?: boolean;
}

export interface WebhookUpdateOptions {
  url?: string;
  events?: WebhookEventType[];
  secret?: string;
  retryCount?: number;
  timeoutMs?: number;
  enabled?: boolean;
}

export interface ProjectInfo {
  name: string;
  owner?: string;
  repo?: string;
}

export interface EventData {
  session?: Session;
  phase?: Phase;
  blocker?: {
    sessionNumber: number;
    reason: string;
    blockedBy?: number[];
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique ID for webhooks and events
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Validate a URL string
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Calculate retry delay using exponential backoff.
 *
 * @param attempt - Retry attempt number (1-based)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay cap
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
  maxDelayMs: number = DEFAULT_MAX_DELAY_MS
): number {
  const delay = Math.pow(2, attempt) * baseDelayMs;
  return Math.min(delay, maxDelayMs);
}

/**
 * Sign a payload using HMAC-SHA256.
 *
 * @param payload - The webhook payload to sign
 * @param secret - The secret key for signing
 * @returns Signature string prefixed with 'sha256='
 */
export function signPayload(payload: WebhookPayload, secret: string): string {
  const body = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Create a webhook payload for a specific event.
 *
 * @param event - The event type
 * @param project - Project information
 * @param data - Event-specific data (session, phase, blocker)
 * @returns Complete webhook payload
 */
export function createWebhookPayload(
  event: WebhookEventType,
  project: ProjectInfo,
  data: EventData
): WebhookPayload {
  const payload: WebhookPayload = {
    id: generateId(),
    event,
    timestamp: new Date(),
    project: {
      name: project.name,
      owner: project.owner,
      repo: project.repo,
    },
  };

  // Add session data if present
  if (data.session) {
    payload.session = {
      number: data.session.number,
      title: data.session.title,
      domain: data.session.domain,
      phase: data.session.phase,
      phaseName: data.session.phaseName,
      status: data.session.status,
      metrics: data.session.metrics,
      startedAt: data.session.startedAt,
      completedAt: data.session.completedAt,
    };
  }

  // Add phase data if present
  if (data.phase) {
    payload.phase = {
      number: data.phase.number,
      name: data.phase.name,
      completedSessions: data.phase.completedSessions,
      totalSessions: data.phase.totalSessions,
    };
  }

  // Add blocker data if present
  if (data.blocker) {
    payload.blocker = {
      sessionNumber: data.blocker.sessionNumber,
      reason: data.blocker.reason,
      blockedBy: data.blocker.blockedBy,
    };
  }

  return payload;
}

/**
 * Check if a status code indicates a retriable error.
 * Only retry on server errors (5xx), not client errors (4xx).
 */
function isRetriableError(statusCode: number): boolean {
  return statusCode >= 500;
}

/**
 * Sleep for a specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// WEBHOOK SERVICE CLASS
// ============================================================================

/**
 * Service for managing webhooks and delivering event payloads.
 */
export class WebhookService {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveryHistory: Map<string, WebhookDelivery[]> = new Map();

  // ==========================================================================
  // CONFIGURATION MANAGEMENT
  // ==========================================================================

  /**
   * Add a new webhook configuration.
   *
   * @param options - Webhook configuration options
   * @returns The created webhook configuration
   * @throws Error if URL is invalid or events are empty
   */
  addWebhook(options: WebhookAddOptions): WebhookConfig {
    // Validate URL
    if (!isValidUrl(options.url)) {
      throw new Error(`Invalid webhook URL: ${options.url}`);
    }

    // Validate events
    if (!options.events || options.events.length === 0) {
      throw new Error('Webhook must subscribe to at least one event type');
    }

    const webhook: WebhookConfig = {
      id: generateId(),
      url: options.url,
      events: options.events,
      secret: options.secret,
      enabled: options.enabled ?? true,
      retryCount: options.retryCount ?? DEFAULT_RETRY_COUNT,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);
    this.deliveryHistory.set(webhook.id, []);

    return webhook;
  }

  /**
   * List all webhook configurations.
   */
  listWebhooks(): WebhookConfig[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Get a specific webhook by ID.
   */
  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.get(id);
  }

  /**
   * Update an existing webhook configuration.
   *
   * @param id - Webhook ID
   * @param options - Fields to update
   * @returns Updated webhook or undefined if not found
   */
  updateWebhook(id: string, options: WebhookUpdateOptions): WebhookConfig | undefined {
    const webhook = this.webhooks.get(id);
    if (!webhook) {
      return undefined;
    }

    // Validate URL if being updated
    if (options.url !== undefined && !isValidUrl(options.url)) {
      throw new Error(`Invalid webhook URL: ${options.url}`);
    }

    // Validate events if being updated
    if (options.events !== undefined && options.events.length === 0) {
      throw new Error('Webhook must subscribe to at least one event type');
    }

    const updated: WebhookConfig = {
      ...webhook,
      url: options.url ?? webhook.url,
      events: options.events ?? webhook.events,
      secret: options.secret ?? webhook.secret,
      enabled: options.enabled ?? webhook.enabled,
      retryCount: options.retryCount ?? webhook.retryCount,
      timeoutMs: options.timeoutMs ?? webhook.timeoutMs,
      updatedAt: new Date(),
    };

    this.webhooks.set(id, updated);
    return updated;
  }

  /**
   * Delete a webhook configuration.
   *
   * @param id - Webhook ID
   * @returns true if deleted, false if not found
   */
  deleteWebhook(id: string): boolean {
    const existed = this.webhooks.has(id);
    this.webhooks.delete(id);
    this.deliveryHistory.delete(id);
    return existed;
  }

  // ==========================================================================
  // EVENT TRIGGERING
  // ==========================================================================

  /**
   * Trigger an event to all subscribed webhooks.
   *
   * @param event - Event type
   * @param project - Project information
   * @param data - Event-specific data
   * @returns Array of delivery results
   */
  async triggerEvent(
    event: WebhookEventType,
    project: ProjectInfo,
    data: EventData
  ): Promise<WebhookDeliveryResult[]> {
    const payload = createWebhookPayload(event, project, data);
    const results: WebhookDeliveryResult[] = [];

    // Find webhooks subscribed to this event
    const subscribedWebhooks = Array.from(this.webhooks.values()).filter(
      w => w.enabled && w.events.includes(event)
    );

    // Deliver to all subscribed webhooks concurrently
    const deliveryPromises = subscribedWebhooks.map(webhook =>
      this.deliverToWebhook(webhook, payload)
    );

    const deliveryResults = await Promise.all(deliveryPromises);
    results.push(...deliveryResults);

    return results;
  }

  /**
   * Deliver a payload to a specific webhook with retry logic.
   */
  private async deliverToWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<WebhookDeliveryResult> {
    const retryCount = webhook.retryCount ?? DEFAULT_RETRY_COUNT;
    const timeoutMs = webhook.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let lastError: string | undefined;
    let lastStatusCode: number | undefined;

    // Create delivery record
    const delivery: WebhookDelivery = {
      id: generateId(),
      webhookId: webhook.id,
      payload,
      status: 'pending',
      attempts: 0,
      lastAttemptAt: undefined,
      nextRetryAt: undefined,
      responseCode: undefined,
      responseBody: undefined,
      error: undefined,
    };

    // Try delivery with retries
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      delivery.attempts++;
      delivery.lastAttemptAt = new Date();

      try {
        const response = await this.sendRequest(webhook, payload, timeoutMs);
        lastStatusCode = response.status;

        if (response.ok) {
          // Success
          delivery.status = 'success';
          delivery.responseCode = response.status;
          delivery.responseBody = await response.text();
          this.recordDelivery(webhook.id, delivery);

          return {
            success: true,
            webhookId: webhook.id,
            eventId: payload.id,
            statusCode: response.status,
          };
        }

        // Failed - check if retriable
        lastError = await response.text();
        delivery.responseCode = response.status;
        delivery.responseBody = lastError;

        if (!isRetriableError(response.status)) {
          // 4xx errors - don't retry
          break;
        }

        // Wait before retry (if more attempts available)
        if (attempt < retryCount) {
          const delay = calculateRetryDelay(attempt + 1);
          delivery.nextRetryAt = new Date(Date.now() + delay);
          await sleep(delay);
        }
      } catch (error) {
        // Network error
        lastError = error instanceof Error ? error.message : String(error);
        delivery.error = lastError;

        // Wait before retry (if more attempts available)
        if (attempt < retryCount) {
          const delay = calculateRetryDelay(attempt + 1);
          delivery.nextRetryAt = new Date(Date.now() + delay);
          await sleep(delay);
        }
      }
    }

    // All attempts failed
    delivery.status = 'failed';
    this.recordDelivery(webhook.id, delivery);

    return {
      success: false,
      webhookId: webhook.id,
      eventId: payload.id,
      statusCode: lastStatusCode,
      error: lastError,
    };
  }

  /**
   * Send HTTP request to webhook URL.
   */
  private async sendRequest(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    timeoutMs: number
  ): Promise<Response> {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'ProjectPlanner-MCP/1.0',
      'X-Webhook-Event': payload.event,
      'X-Webhook-Delivery': payload.id,
    };

    // Add signature if secret is configured
    if (webhook.secret) {
      headers['X-Webhook-Signature'] = signPayload(payload, webhook.secret);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Record a delivery in history, maintaining max size.
   */
  private recordDelivery(webhookId: string, delivery: WebhookDelivery): void {
    let history = this.deliveryHistory.get(webhookId);
    if (!history) {
      history = [];
      this.deliveryHistory.set(webhookId, history);
    }

    history.push(delivery);

    // Trim to max size
    if (history.length > MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  // ==========================================================================
  // DELIVERY HISTORY
  // ==========================================================================

  /**
   * Get delivery history for a webhook.
   */
  getDeliveryHistory(webhookId: string): WebhookDelivery[] {
    return this.deliveryHistory.get(webhookId) || [];
  }

  // ==========================================================================
  // SESSION/PHASE CHANGE HANDLERS
  // ==========================================================================

  /**
   * Handle session status change and trigger appropriate webhook event.
   *
   * @param project - Project information
   * @param session - Updated session
   * @param oldStatus - Previous status
   * @param newStatus - New status
   * @param blocker - Optional blocker information
   */
  async onSessionStatusChange(
    project: ProjectInfo,
    session: Session,
    oldStatus: SessionStatus,
    newStatus: SessionStatus,
    blocker?: { reason: string; blockedBy?: number[] }
  ): Promise<WebhookDeliveryResult[]> {
    // Determine which event to trigger based on status transition
    if (newStatus === 'in_progress' && oldStatus === 'not_started') {
      return this.triggerEvent('session_started', project, { session });
    }

    if (newStatus === 'completed') {
      return this.triggerEvent('session_completed', project, { session });
    }

    if (newStatus === 'blocked') {
      return this.triggerEvent('session_blocked', project, {
        session,
        blocker: blocker ? {
          sessionNumber: session.number,
          reason: blocker.reason,
          blockedBy: blocker.blockedBy,
        } : {
          sessionNumber: session.number,
          reason: 'Session blocked',
        },
      });
    }

    return [];
  }

  /**
   * Handle phase completion and trigger webhook event.
   *
   * @param project - Project information
   * @param phase - Completed phase
   */
  async onPhaseCompleted(
    project: ProjectInfo,
    phase: Phase
  ): Promise<WebhookDeliveryResult[]> {
    return this.triggerEvent('phase_completed', project, { phase });
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: WebhookService | null = null;

/**
 * Get the singleton webhook service instance.
 */
export function getWebhookService(): WebhookService {
  if (!instance) {
    instance = new WebhookService();
  }
  return instance;
}

/**
 * Reset the singleton instance (useful for testing).
 */
export function resetWebhookService(): void {
  instance = null;
}
