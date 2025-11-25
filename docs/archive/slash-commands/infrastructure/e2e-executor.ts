/**
 * E2E Integration Tester Executor
 *
 * Implements the SessionExecutor interface for E2E integration testing sessions.
 * Launches e2e-tester agent via Task tool and coordinates integration testing workflow.
 *
 * @see execution-orchestrator.ts for SessionExecutor interface
 * @see .claude/agents/e2e-tester.md for agent specification
 */

import type { AgentState, Phase, Session } from './types'
import type { SessionExecutor } from './execution-orchestrator'

// ============================================================================
// E2E Executor Implementation
// ============================================================================

export class E2EExecutor implements SessionExecutor {
  /**
   * Execute RED phase: Write E2E tests
   *
   * Launches e2e-tester agent with instructions to:
   * 1. Read session objectives from PROJECT_PLAN.md
   * 2. Read success criteria and workflows from REQUIREMENTS.md
   * 3. Write comprehensive E2E tests covering critical paths
   * 4. Run tests (may pass or fail depending on implementation state)
   */
  async executeRedPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    tests_written: number
    tests_failing: number
    files_modified: string[]
  }> {
    console.log(`\n[RED PHASE] Writing E2E tests for: ${session.title}\n`)

    // Build prompt for e2e-tester agent
    const prompt = this.buildRedPhasePrompt(state, phase, session)

    // TODO: Launch e2e-tester agent via Task tool
    console.log('TODO: Launch e2e-tester agent for RED phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    // Example for E2E Testing session
    return {
      tests_written: 30,
      tests_failing: 15, // Some may pass, some may fail
      files_modified: [
        'frontend/e2e/auth.spec.ts',
        'frontend/e2e/blog-post-workflow.spec.ts',
        'frontend/e2e/performance.spec.ts',
        'frontend/e2e/helpers/auth.ts'
      ]
    }
  }

  /**
   * Execute GREEN phase: Fix integration issues
   *
   * Launches e2e-tester agent with instructions to:
   * 1. Review failing E2E tests
   * 2. Debug integration issues (API, frontend, routing, etc.)
   * 3. Fix issues across backend/frontend as needed
   * 4. Run tests and verify they PASS
   */
  async executeGreenPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    tests_passing: number
    coverage: number
    files_modified: string[]
  }> {
    console.log(`\n[GREEN PHASE] Fixing integration issues for: ${session.title}\n`)

    // Build prompt for e2e-tester agent
    const prompt = this.buildGreenPhasePrompt(state, phase, session)

    // TODO: Launch e2e-tester agent via Task tool
    console.log('TODO: Launch e2e-tester agent for GREEN phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      tests_passing: 30,
      coverage: 100, // E2E tests don't have coverage in the same way
      files_modified: [
        'backend/apps/blog/views.py', // Fixed API issue
        'frontend/src/components/auth/LoginForm.vue', // Fixed form bug
        'frontend/src/router/index.ts' // Fixed routing issue
      ]
    }
  }

  /**
   * Execute REFACTOR phase: Improve test quality
   *
   * Launches e2e-tester agent with instructions to:
   * 1. Review E2E tests
   * 2. Extract common helpers
   * 3. Add page object models if beneficial
   * 4. Reduce test flakiness
   * 5. Run tests and verify they still PASS
   */
  async executeRefactorPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    files_modified: string[]
    coverage: number
  }> {
    console.log(`\n[REFACTOR PHASE] Improving E2E test quality for: ${session.title}\n`)

    // Build prompt for e2e-tester agent
    const prompt = this.buildRefactorPhasePrompt(state, phase, session)

    // TODO: Launch e2e-tester agent via Task tool
    console.log('TODO: Launch e2e-tester agent for REFACTOR phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      files_modified: [
        'frontend/e2e/helpers/auth.ts',
        'frontend/e2e/helpers/data.ts',
        'frontend/e2e/pages/LoginPage.ts',
        'playwright.config.ts'
      ],
      coverage: 100
    }
  }

  /**
   * Create git commit for completed session
   */
  async createCommit(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<string> {
    console.log(`\n[COMMIT] Creating commit for: ${session.title}\n`)

    // Build commit message following project conventions
    const commitMessage = this.buildCommitMessage(state, phase, session)

    // TODO: Execute git commands
    console.log('TODO: Execute git commit')
    console.log('Commit message:', commitMessage)

    // Placeholder return
    return 'e2e1a2b3c'
  }

  // ==========================================================================
  // Prompt Building
  // ==========================================================================

  /**
   * Build prompt for RED phase (write E2E tests)
   */
  private buildRedPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# E2E Integration Tester Agent - RED Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Write comprehensive end-to-end tests covering complete user workflows.

## Context

**Project**: ${state.project_name}
**App Type**: ${state.app_type}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}

## Session Objectives

Read the session objectives from:
- \`project-plans/${state.project_name}/PROJECT_PLAN.md\` - Session ${session.number} objectives

Read the technical specifications and success criteria from:
- \`project-plans/${state.project_name}/REQUIREMENTS.md\` - API endpoints, workflows, success criteria

## RED Phase Instructions

1. **Identify Critical Workflows**:
   ${this.getCriticalWorkflows(state.app_type)}

2. **Write E2E Tests** (in \`frontend/e2e/\`):
   - Test complete user journeys (signup → login → create → view)
   - Test authentication flows
   - Test core business logic
   - Test error handling
   - Test performance targets

3. **Test Framework**:
   - Use Playwright for E2E testing
   - Use real database (not mocks)
   - Test in real browser (Chromium)
   - Clean database state before each test

4. **Test Structure**:
   \`\`\`typescript
   // frontend/e2e/auth.spec.ts
   import { test, expect } from '@playwright/test'

   test.describe('User Authentication', () => {
     test.beforeEach(async ({ page }) => {
       // Clean database
       await page.request.post('/api/test/reset-db/')
     })

     test('user can sign up with valid credentials', async ({ page }) => {
       await page.goto('/auth/signup')
       await page.fill('[data-testid="email-input"]', 'test@example.com')
       await page.fill('[data-testid="password-input"]', 'SecurePass123!')
       await page.click('[data-testid="signup-button"]')

       // Should redirect to OTP verification
       await expect(page.locator('[data-testid="otp-input"]')).toBeVisible()
     })

     test('user can log in after signup', async ({ page }) => {
       // Create user first
       await createUser({ email: 'test@example.com', password: 'Test123!' })

       // Test login
       await page.goto('/auth/login')
       await page.fill('[data-testid="email-input"]', 'test@example.com')
       await page.fill('[data-testid="password-input"]', 'Test123!')
       await page.click('[data-testid="login-button"]')

       // Should redirect to dashboard
       await expect(page).toHaveURL('/dashboard')
     })
   })
   \`\`\`

5. **Run Tests**:
   \`docker compose run --rm frontend npx playwright test\`

   **Expected Result**: Some tests may PASS, some may FAIL (that's OK in E2E testing)

6. **Output**:
   - List all test files created
   - Number of tests written
   - Number passing vs failing

## Exit Criteria

- [ ] Critical workflows tested (authentication, core features)
- [ ] All test files created in \`frontend/e2e/\`
- [ ] Tests run successfully (results recorded)
- [ ] Test count: ~${session.estimated_hours * 10} tests (estimate)

## Important Notes

- **DO** use real database and browser
- **DO** use \`data-testid\` for selectors
- **DO** clean database state before each test
- **DO** test both success and error scenarios
- **DO NOT** mock backend - test real integration

Good luck! E2E tests validate the whole system works together.
`.trim()
  }

  /**
   * Build prompt for GREEN phase (fix integration issues)
   */
  private buildGreenPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# E2E Integration Tester Agent - GREEN Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Fix integration issues found by E2E tests to make all tests PASS.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Written**: ${session.tests_written}
**Tests Currently Passing**: ${session.tests_passing}

## GREEN Phase Instructions

1. **Review Failing Tests**:
   - Read \`frontend/e2e/\` test files to see what's failing
   - Run tests and examine error messages
   - Identify which layer is broken (backend, frontend, routing)

2. **Debug and Fix Issues**:
   - **Backend Issues**: API returns wrong data, wrong status codes, missing endpoints
   - **Frontend Issues**: Components not rendering, forms not submitting, routing broken
   - **Integration Issues**: CORS errors, authentication not working, data format mismatches

3. **Common Integration Fixes**:
   \`\`\`typescript
   // Backend: Fix API endpoint
   // backend/apps/blog/views.py
   class PostViewSet(viewsets.ModelViewSet):
       def list(self, request):
           # Fix: Filter by status='published' for public view
           posts = Post.objects.filter(status='published')
           return Response(...)

   // Frontend: Fix form submission
   // frontend/src/components/auth/LoginForm.vue
   async function handleSubmit() {
     try {
       const response = await login(email.value, password.value)
       // Fix: Check for error property in response
       if (response && 'error' in response) {
         throw response
       }
       router.push('/dashboard')
     } catch (error) {
       errorMessage.value = error.message
     }
   }

   // Frontend: Fix routing
   // frontend/src/router/index.ts
   router.beforeEach((to, from, next) => {
     // Fix: Check authentication before protected routes
     if (to.meta.requiresAuth && !isAuthenticated()) {
       next('/auth/login')
     } else {
       next()
     }
   })
   \`\`\`

4. **Run Tests Again**:
   \`docker compose run --rm frontend npx playwright test\`

   **Expected Result**: ALL TESTS SHOULD PASS

5. **Output**:
   - Number of tests passing
   - List of files fixed
   - Description of issues fixed

## Exit Criteria

- [ ] All E2E tests passing (${session.tests_written}/${session.tests_written})
- [ ] No console errors during tests
- [ ] Performance targets met (if applicable)

## Important Notes

- Fix issues across backend AND frontend as needed
- Don't just fix the test - fix the actual bug
- Test in real browser to catch real issues
- Verify fixes don't break other tests

Now make those E2E tests GREEN!
`.trim()
  }

  /**
   * Build prompt for REFACTOR phase (improve test quality)
   */
  private buildRefactorPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# E2E Integration Tester Agent - REFACTOR Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Improve E2E test quality and reduce flakiness.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Passing**: ${session.tests_passing}/${session.tests_written}

## REFACTOR Phase Instructions

1. **Extract Common Helpers**:
   \`\`\`typescript
   // frontend/e2e/helpers/auth.ts
   export async function loginAsUser(page: Page, email: string, password = 'Test123!') {
     await page.goto('/auth/login')
     await page.fill('[data-testid="email-input"]', email)
     await page.fill('[data-testid="password-input"]', password)
     await page.click('[data-testid="login-button"]')
     await page.waitForURL('/dashboard')
   }

   export async function createUser(data: { email: string, password: string }) {
     await page.request.post('/api/auth/register/', { body: data })
   }
   \`\`\`

2. **Add Page Object Models** (optional):
   \`\`\`typescript
   // frontend/e2e/pages/LoginPage.ts
   export class LoginPage {
     constructor(private page: Page) {}

     async goto() {
       await this.page.goto('/auth/login')
     }

     async login(email: string, password: string) {
       await this.page.fill('[data-testid="email-input"]', email)
       await this.page.fill('[data-testid="password-input"]', password)
       await this.page.click('[data-testid="login-button"]')
     }

     async expectError(message: string) {
       await expect(this.page.locator('[data-testid="error-message"]')).toContainText(message)
     }
   }
   \`\`\`

3. **Reduce Flakiness**:
   - Replace \`page.waitForTimeout()\` with proper \`waitFor\` methods
   - Add retry logic for flaky assertions
   - Parallelize independent tests

4. **Improve Configuration**:
   \`\`\`typescript
   // playwright.config.ts
   export default defineConfig({
     workers: process.env.CI ? 1 : 4,
     retries: process.env.CI ? 2 : 0,
     use: {
       baseURL: 'http://localhost:5173',
       trace: 'on-first-retry'
     }
   })
   \`\`\`

5. **Run Tests Again**:
   \`docker compose run --rm frontend npx playwright test\`

   **Expected Result**: Tests still PASS, more reliable

6. **Output**:
   - List of improvements made
   - Test reliability improved

## Exit Criteria

- [ ] All tests still passing
- [ ] Common helpers extracted
- [ ] No hardcoded waits (\`waitForTimeout\`)
- [ ] Tests run reliably (not flaky)

## Important Notes

- Don't change test behavior - only improve quality
- Tests should still pass after refactoring
- Focus on maintainability and reliability

Make those E2E tests rock-solid!
`.trim()
  }

  /**
   * Get critical workflows for app type
   */
  private getCriticalWorkflows(appType: string): string {
    switch (appType) {
      case 'blog':
        return `- **Authentication**: Signup → OTP → Login → Dashboard
   - **Post Creation**: Create draft → Publish → View on list
   - **Commenting**: View post → Add comment → Comment appears
   - **Filtering**: Filter posts by category/tag`

      case 'ecommerce':
        return `- **Authentication**: Signup → Login
   - **Shopping**: Browse products → Add to cart → Checkout → Payment
   - **Order Management**: View orders → Order details`

      case 'saas':
        return `- **Authentication**: Signup → Verify email → Login
   - **Organization**: Create organization → Invite member → Member accepts
   - **Subscription**: Select plan → Enter payment → Subscription active`

      case 'social':
        return `- **Authentication**: Signup → Login
   - **Profile**: Update profile → Upload photo
   - **Posts**: Create post → Like → Comment
   - **Friendships**: Send friend request → Accept → Friends list`

      case 'projectmanagement':
        return `- **Authentication**: Signup → Login
   - **Project**: Create project → Add members
   - **Tasks**: Create task → Assign → Update status → Complete
   - **Kanban**: Drag task between columns`

      default:
        return `Read PROJECT_PLAN.md Session ${session.number} to identify critical workflows.`
    }
  }

  /**
   * Build git commit message following project conventions
   */
  private buildCommitMessage(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    const type = 'test' // E2E sessions are always test type

    // Build concise subject line
    const subject = `${type}: ${session.title.toLowerCase()}`

    // Build commit body
    const body = `
Completed Session ${session.number}: ${session.title}

Phase: ${phase.name}
Tests: ${session.tests_passing}/${session.tests_written} passing
Time: ${session.actual_hours}h (estimated: ${session.estimated_hours}h)

Files modified:
${session.files_modified.map(f => `- ${f}`).join('\n')}

Critical workflows validated:
- Authentication flows
- Core business logic
- Error handling
- Performance targets

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
`.trim()

    return `${subject}\n\n${body}`
  }
}
