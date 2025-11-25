/**
 * Frontend Executor
 *
 * Implements the SessionExecutor interface for frontend (Vue 3 + TypeScript) sessions.
 * Launches frontend-builder agent via Task tool and coordinates TDD workflow.
 *
 * @see execution-orchestrator.ts for SessionExecutor interface
 * @see .claude/agents/frontend-builder.md for agent specification
 */

import type { AgentState, Phase, Session } from './types'
import type { SessionExecutor } from './execution-orchestrator'

// ============================================================================
// Frontend Executor Implementation
// ============================================================================

export class FrontendExecutor implements SessionExecutor {
  /**
   * Execute RED phase: Write failing tests
   *
   * Launches frontend-builder agent with instructions to:
   * 1. Read session objectives from PROJECT_PLAN.md
   * 2. Read component/API specs from REQUIREMENTS.md
   * 3. Write comprehensive tests FIRST (Vitest + Vue Test Utils)
   * 4. Run tests and verify they FAIL
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
    console.log(`\n[RED PHASE] Writing tests for: ${session.title}\n`)

    // Build prompt for frontend-builder agent
    const prompt = this.buildRedPhasePrompt(state, phase, session)

    // TODO: Launch frontend-builder agent via Task tool
    // For Phase 3.3, this will use the Task tool to spawn the agent
    // For now, return placeholder data
    console.log('TODO: Launch frontend-builder agent for RED phase')
    console.log('Prompt:', prompt)

    // Placeholder return - will be replaced with actual agent execution
    // Example for Session 6 (Composables)
    return {
      tests_written: 50,
      tests_failing: 50,
      files_modified: [
        'frontend/src/composables/usePost.test.ts',
        'frontend/src/composables/usePosts.test.ts',
        'frontend/src/composables/useCategories.test.ts'
      ]
    }
  }

  /**
   * Execute GREEN phase: Implement to pass tests
   *
   * Launches frontend-builder agent with instructions to:
   * 1. Review the failing tests from RED phase
   * 2. Implement components/composables/views to make tests pass
   * 3. Run tests and verify they PASS
   * 4. Measure test coverage
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
    console.log(`\n[GREEN PHASE] Implementing for: ${session.title}\n`)

    // Build prompt for frontend-builder agent
    const prompt = this.buildGreenPhasePrompt(state, phase, session)

    // TODO: Launch frontend-builder agent via Task tool
    console.log('TODO: Launch frontend-builder agent for GREEN phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    // Example for Session 6 (Composables)
    return {
      tests_passing: 50,
      coverage: 87,
      files_modified: [
        'frontend/src/composables/usePost.ts',
        'frontend/src/composables/usePosts.ts',
        'frontend/src/composables/useCategories.ts'
      ]
    }
  }

  /**
   * Execute REFACTOR phase: Improve code quality
   *
   * Launches frontend-builder agent with instructions to:
   * 1. Review implementation from GREEN phase
   * 2. Add JSDoc comments, extract common patterns
   * 3. Optimize bundle size, improve accessibility
   * 4. Run tests and verify they still PASS
   */
  async executeRefactorPhase(
    state: AgentState,
    phase: Phase,
    session: Session
  ): Promise<{
    files_modified: string[]
    coverage: number
  }> {
    console.log(`\n[REFACTOR PHASE] Refactoring for: ${session.title}\n`)

    // Build prompt for frontend-builder agent
    const prompt = this.buildRefactorPhasePrompt(state, phase, session)

    // TODO: Launch frontend-builder agent via Task tool
    console.log('TODO: Launch frontend-builder agent for REFACTOR phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      files_modified: [
        'frontend/src/composables/usePost.ts',
        'frontend/src/composables/usePosts.ts',
        'frontend/src/composables/useCategories.ts'
      ],
      coverage: 88
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
    return 'f1a2b3c4d5e'
  }

  // ==========================================================================
  // Prompt Building
  // ==========================================================================

  /**
   * Build prompt for RED phase (write tests)
   */
  private buildRedPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# Frontend Builder Agent - RED Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Write comprehensive tests FIRST, following TDD (Test-Driven Development). All tests should FAIL initially.

## Context

**Project**: ${state.project_name}
**App Type**: ${state.app_type}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}

## Session Objectives

Read the session objectives from:
- \`project-plans/${state.project_name}/PROJECT_PLAN.md\` - Session ${session.number} objectives

Read the technical specifications from:
- \`project-plans/${state.project_name}/REQUIREMENTS.md\` - API endpoints, component specs, validation rules

## RED Phase Instructions

1. **Identify Session Type**:
   ${this.getSessionTypeGuidance(session.title)}

2. **Write Tests FIRST** (in \`frontend/src/\`):
   ${this.getTestGuidanceForSession(session.title)}

3. **Test Framework**:
   - Use Vitest for test runner
   - Use Vue Test Utils for component testing
   - Use Testing Library helpers for user-centric tests
   - Mock API calls with \`vi.mock()\`

4. **Test Structure**:
   \`\`\`typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest'
   import { mount } from '@vue/test-utils'

   describe('ComponentName', () => {
     it('should render correctly with props', () => {
       const wrapper = mount(ComponentName, {
         props: { /* ... */ }
       })

       expect(wrapper.text()).toContain('Expected text')
     })

     it('should emit event on user interaction', async () => {
       const wrapper = mount(ComponentName)

       await wrapper.find('[data-testid="button"]').trigger('click')

       expect(wrapper.emitted('click')).toBeTruthy()
     })
   })
   \`\`\`

5. **Run Tests**:
   \`docker compose run --rm frontend npm test\`

   **Expected Result**: ALL TESTS SHOULD FAIL (components/composables don't exist yet)

6. **Output**:
   - List all test files created
   - Number of tests written
   - Confirm all tests are failing

## Exit Criteria

- [ ] All test files created in \`frontend/src/\`
- [ ] Tests cover all components/composables from REQUIREMENTS.md
- [ ] Tests run and FAIL as expected
- [ ] Test count: ~${session.estimated_hours * 20} tests (estimate)

## Important Notes

- **DO NOT** implement components/composables yet - that's GREEN phase
- **DO** use \`data-testid\` for test selectors (not classes or IDs)
- **DO** test user behavior, not implementation details
- **DO** mock API calls - don't make real HTTP requests

Good luck! Remember: RED means FAILING tests are GOOD at this stage.
`.trim()
  }

  /**
   * Build prompt for GREEN phase (implement)
   */
  private buildGreenPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# Frontend Builder Agent - GREEN Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Implement components/composables/views to make all tests PASS.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Written**: ${session.tests_written}
**Tests Currently Passing**: ${session.tests_passing}

## GREEN Phase Instructions

1. **Review Failing Tests**:
   - Read \`frontend/src/\` test files to understand what needs to be implemented
   - Identify which components/composables/views/schemas are needed

2. **Implement Based on Session Type**:
   ${this.getImplementationGuidanceForSession(session.title)}

3. **Tech Stack**:
   - Vue 3 Composition API with \`<script setup>\`
   - TypeScript strict mode (NO \`any\` types)
   - Shadcn-vue components (Button, Card, Input, Badge, etc.)
   - TanStack Query (Vue Query) for data fetching
   - Zod schemas for validation

4. **Run Tests**:
   \`\`\`bash
   docker compose run --rm frontend npm test
   docker compose run --rm frontend npm run test:coverage
   \`\`\`

   **Expected Result**: ALL TESTS SHOULD PASS, coverage >= 85%

5. **Type Checking**:
   \`\`\`bash
   docker compose run --rm frontend npm run type-check
   \`\`\`

   **Expected Result**: 0 type errors

6. **Output**:
   - Number of tests passing
   - Coverage percentage
   - List of files created/modified

## Exit Criteria

- [ ] All tests passing (${session.tests_written}/${session.tests_written})
- [ ] Coverage >= 85%
- [ ] Type checking passes (0 errors)
- [ ] No \`any\` types (use \`unknown\` if needed)
- [ ] Components use Shadcn-vue where applicable

## Important Notes

- Implement ONLY what's needed to pass the tests
- Don't add features not covered by tests
- Use explicit TypeScript types everywhere
- Follow Vue 3 Composition API best practices
- Use Zod schemas to validate all API responses

Now make those tests GREEN!
`.trim()
  }

  /**
   * Build prompt for REFACTOR phase (improve code)
   */
  private buildRefactorPhasePrompt(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    return `
# Frontend Builder Agent - REFACTOR Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Improve code quality while keeping all tests GREEN.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Passing**: ${session.tests_passing}/${session.tests_written}
**Coverage**: ${session.coverage}%

## REFACTOR Phase Instructions

1. **Add JSDoc Comments**:
   \`\`\`typescript
   /**
    * Fetches a single blog post by UUID
    *
    * @param uuid - The post UUID
    * @returns Reactive refs for post data, loading state, and error
    *
    * @example
    * \`\`\`ts
    * const { post, isLoading } = usePost('uuid-123')
    * \`\`\`
    */
   export function usePost(uuid: string): {
     post: Ref<Post | undefined>
     isLoading: Ref<boolean>
     error: Ref<Error | null>
   } {
     // ...
   }
   \`\`\`

2. **Extract Common Patterns**:
   - Create reusable utility functions
   - Extract common API query logic
   - Create shared component patterns

3. **Optimize Performance**:
   - Add \`v-memo\` for expensive renders
   - Use \`computed\` for derived state
   - Add code splitting with lazy imports

4. **Improve Accessibility**:
   - Add ARIA labels where needed
   - Ensure keyboard navigation works
   - Add focus management

5. **Run Tests Again**:
   \`docker compose run --rm frontend npm test\`
   \`docker compose run --rm frontend npm run type-check\`

   **Expected Result**: Tests still PASS, type checking passes

6. **Output**:
   - List of improvements made
   - Coverage maintained or improved
   - Type checking results

## Exit Criteria

- [ ] All tests still passing
- [ ] JSDoc comments added to all exports
- [ ] Explicit return types on all functions
- [ ] No code duplication
- [ ] Type checking passes
- [ ] Accessibility improved

## Important Notes

- Don't change behavior - only improve code quality
- Tests should still pass after every change
- If a refactor breaks tests, revert it
- Focus on code readability and maintainability

Make it beautiful!
`.trim()
  }

  /**
   * Get session type guidance for RED phase
   */
  private getSessionTypeGuidance(sessionTitle: string): string {
    const lower = sessionTitle.toLowerCase()

    if (lower.includes('api client') || lower.includes('zod schemas')) {
      return `This is an **API Client + Zod Schemas** session.
Focus on:
- Zod schema validation tests
- API client generation
- Type safety tests`
    }

    if (lower.includes('composable')) {
      return `This is a **Composables** session.
Focus on:
- Data fetching tests
- Mutation tests
- Error handling tests
- Loading state tests`
    }

    if (lower.includes('component') && !lower.includes('view')) {
      return `This is a **UI Components** session.
Focus on:
- Component rendering tests
- Props tests
- Events tests
- Slots tests
- Conditional rendering tests`
    }

    if (lower.includes('view') || lower.includes('routing')) {
      return `This is a **Views + Routing** session.
Focus on:
- Full page rendering tests
- Routing tests
- User interaction tests
- Integration tests`
    }

    return `Read PROJECT_PLAN.md Session ${sessionTitle} to understand the focus.`
  }

  /**
   * Get test guidance for specific session type
   */
  private getTestGuidanceForSession(sessionTitle: string): string {
    const lower = sessionTitle.toLowerCase()

    if (lower.includes('api client')) {
      return `- Create schema validation tests in \`frontend/src/schemas/*.test.ts\`
- Test that valid data passes validation
- Test that invalid data fails validation
- Test edge cases (null, undefined, empty strings, etc.)`
    }

    if (lower.includes('composable')) {
      return `- Create composable tests in \`frontend/src/composables/*.test.ts\`
- Test data fetching (mock API responses)
- Test mutations and cache updates
- Test error handling
- Test loading states`
    }

    if (lower.includes('component') && !lower.includes('view')) {
      return `- Create component tests in \`frontend/src/components/**/*.test.ts\`
- Test component renders with correct props
- Test events are emitted correctly
- Test slots work as expected
- Test conditional rendering based on props`
    }

    if (lower.includes('view')) {
      return `- Create view tests in \`frontend/src/views/*.test.ts\`
- Test full page rendering
- Test routing behavior
- Test filters, pagination, search
- Test user interactions (clicking, typing, etc.)`
    }

    return `- Create appropriate tests based on session objectives`
  }

  /**
   * Get implementation guidance for specific session type
   */
  private getImplementationGuidanceForSession(sessionTitle: string): string {
    const lower = sessionTitle.toLowerCase()

    if (lower.includes('api client')) {
      return `**For API Client + Zod Schemas**:
1. Generate TypeScript SDK: \`npm run generate:api\`
2. Create Zod schemas in \`frontend/src/schemas/\`
3. Mirror TypeScript types with Zod validation
4. Export type-safe schemas and types`
    }

    if (lower.includes('composable')) {
      return `**For Composables**:
1. Implement composables in \`frontend/src/composables/\`
2. Use TanStack Query (\`useQuery\`, \`useMutation\`)
3. Validate API responses with Zod schemas
4. Return reactive refs with explicit types
5. Handle errors gracefully`
    }

    if (lower.includes('component') && !lower.includes('view')) {
      return `**For UI Components**:
1. Create components in \`frontend/src/components/\`
2. Use \`<script setup>\` with TypeScript
3. Use Shadcn-vue components (Button, Card, Badge, etc.)
4. Define props with \`interface Props\`
5. Define emits with \`defineEmits<{ ... }>()\`
6. Use Tailwind for styling`
    }

    if (lower.includes('view')) {
      return `**For Views**:
1. Create views in \`frontend/src/views/\`
2. Use composables for data fetching
3. Use components for UI
4. Set up routing in \`router/index.ts\`
5. Add route guards if needed
6. Implement filters, pagination, search`
    }

    return `Implement based on failing tests and session objectives.`
  }

  /**
   * Build git commit message following project conventions
   */
  private buildCommitMessage(
    state: AgentState,
    phase: Phase,
    session: Session
  ): string {
    // Determine commit type based on session
    const type = this.inferCommitType(session.title)

    // Build concise subject line
    const subject = `${type}: ${session.title.toLowerCase()}`

    // Build commit body
    const body = `
Completed Session ${session.number}: ${session.title}

Phase: ${phase.name}
Tests: ${session.tests_passing}/${session.tests_written} passing
Coverage: ${session.coverage}%
Time: ${session.actual_hours}h (estimated: ${session.estimated_hours}h)

Files modified:
${session.files_modified.map(f => `- ${f}`).join('\n')}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
`.trim()

    return `${subject}\n\n${body}`
  }

  /**
   * Infer commit type from session title
   */
  private inferCommitType(title: string): string {
    const lower = title.toLowerCase()

    if (lower.includes('test')) return 'test'
    if (lower.includes('component')) return 'feat'
    if (lower.includes('composable')) return 'feat'
    if (lower.includes('view')) return 'feat'
    if (lower.includes('schema')) return 'feat'
    if (lower.includes('api client')) return 'feat'
    if (lower.includes('optimization')) return 'perf'
    if (lower.includes('refactor')) return 'refactor'

    return 'feat'
  }
}
