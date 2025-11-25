/**
 * Backend Executor
 *
 * Implements the SessionExecutor interface for backend (Django + DRF) sessions.
 * Launches backend-builder agent via Task tool and coordinates TDD workflow.
 *
 * @see execution-orchestrator.ts for SessionExecutor interface
 * @see .claude/agents/backend-builder.md for agent specification
 */

import type { AgentState, Phase, Session } from './types'
import type { SessionExecutor } from './execution-orchestrator'

// ============================================================================
// Backend Executor Implementation
// ============================================================================

export class BackendExecutor implements SessionExecutor {
  /**
   * Execute RED phase: Write failing tests
   *
   * Launches backend-builder agent with instructions to:
   * 1. Read session objectives from PROJECT_PLAN.md
   * 2. Read model/endpoint specs from REQUIREMENTS.md
   * 3. Write comprehensive tests FIRST
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

    // Build prompt for backend-builder agent
    const prompt = this.buildRedPhasePrompt(state, phase, session)

    // TODO: Launch backend-builder agent via Task tool
    // For Phase 3.2, this will use the Task tool to spawn the agent
    // For now, return placeholder data
    console.log('TODO: Launch backend-builder agent for RED phase')
    console.log('Prompt:', prompt)

    // Placeholder return - will be replaced with actual agent execution
    return {
      tests_written: 72,
      tests_failing: 72,
      files_modified: [
        'backend/apps/blog/tests/test_models.py'
      ]
    }
  }

  /**
   * Execute GREEN phase: Implement to pass tests
   *
   * Launches backend-builder agent with instructions to:
   * 1. Review the failing tests from RED phase
   * 2. Implement models/serializers/viewsets to make tests pass
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

    // Build prompt for backend-builder agent
    const prompt = this.buildGreenPhasePrompt(state, phase, session)

    // TODO: Launch backend-builder agent via Task tool
    console.log('TODO: Launch backend-builder agent for GREEN phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      tests_passing: 72,
      coverage: 93,
      files_modified: [
        'backend/apps/blog/models.py',
        'backend/apps/blog/admin.py',
        'backend/apps/blog/migrations/0001_initial.py'
      ]
    }
  }

  /**
   * Execute REFACTOR phase: Improve code quality
   *
   * Launches backend-builder agent with instructions to:
   * 1. Review implementation from GREEN phase
   * 2. Add docstrings, type hints, optimize queries
   * 3. Run tests and verify they still PASS
   * 4. Ensure coverage maintained or improved
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

    // Build prompt for backend-builder agent
    const prompt = this.buildRefactorPhasePrompt(state, phase, session)

    // TODO: Launch backend-builder agent via Task tool
    console.log('TODO: Launch backend-builder agent for REFACTOR phase')
    console.log('Prompt:', prompt)

    // Placeholder return
    return {
      files_modified: [
        'backend/apps/blog/models.py',
        'backend/apps/blog/admin.py'
      ],
      coverage: 93
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
    return 'a1b2c3d4e5f'
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
# Backend Builder Agent - RED Phase

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
- \`project-plans/${state.project_name}/REQUIREMENTS.md\` - Model definitions, validation rules, endpoints

## RED Phase Instructions

1. **Read REQUIREMENTS.md**:
   - Identify which models/endpoints this session covers
   - Note all fields, relationships, validation rules
   - Note any custom methods or business logic

2. **Write Tests FIRST** (in \`backend/apps/<app>/tests/\`):
   - Test model creation
   - Test field validation (required, max_length, choices, etc.)
   - Test relationships (ForeignKey, ManyToMany)
   - Test custom model methods
   - Test __str__ representation
   - Test Meta options (ordering, indexes)
   - Test any business logic

3. **Test Structure**:
   \`\`\`python
   # backend/apps/blog/tests/test_models.py
   import pytest
   from django.core.exceptions import ValidationError
   from apps.blog.models import Post, Comment, Category
   from apps.users.models import User

   @pytest.mark.django_db
   class TestPostModel:
       def test_create_post(self, user):
           """Test creating a post with valid data"""
           post = Post.objects.create(
               title="Test Post",
               content="Test content",
               author=user,
               status="draft"
           )
           assert post.title == "Test Post"
           assert post.slug == "test-post"  # Auto-generated

       def test_post_title_required(self):
           """Test that title is required"""
           with pytest.raises(ValidationError):
               Post.objects.create(title="", content="Test")
   \`\`\`

4. **Run Tests**:
   \`docker compose run --rm django pytest apps/<app>/tests/ -v\`

   **Expected Result**: ALL TESTS SHOULD FAIL (models don't exist yet)

5. **Output**:
   - List all test files created
   - Number of tests written
   - Confirm all tests are failing

## Exit Criteria

- [ ] All test files created in \`backend/apps/<app>/tests/\`
- [ ] Tests cover all models/fields from REQUIREMENTS.md
- [ ] Tests run and FAIL as expected
- [ ] Test count: ~${session.estimated_hours * 30} tests (estimate)

## Important Notes

- **DO NOT** implement models yet - that's GREEN phase
- **DO NOT** create Django app yet - do that first if needed
- Use pytest fixtures for common objects (user, category, etc.)
- Follow pytest naming conventions (test_<function_name>)
- Use descriptive test names that explain what they test

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
# Backend Builder Agent - GREEN Phase

You are executing **Session ${session.number}: ${session.title}** for the **${state.app_type}** application.

## Your Mission

Implement models/serializers/viewsets to make all tests PASS.

## Context

**Project**: ${state.project_name}
**Phase**: ${phase.number} - ${phase.name}
**Session**: ${session.number} - ${session.title}
**Tests Written**: ${session.tests_written}
**Tests Currently Passing**: ${session.tests_passing}

## GREEN Phase Instructions

1. **Review Failing Tests**:
   - Read \`backend/apps/<app>/tests/\` to understand what needs to be implemented
   - Identify which models/serializers/viewsets are needed

2. **Implement Models** (if Models session):
   \`\`\`python
   # backend/apps/blog/models.py
   from django.db import models
   from django.utils.text import slugify
   from apps.users.models import User

   class Post(models.Model):
       """Blog post with draft/publish workflow"""

       STATUS_CHOICES = [
           ('draft', 'Draft'),
           ('published', 'Published'),
       ]

       title = models.CharField(max_length=200)
       slug = models.SlugField(unique=True, blank=True)
       content = models.TextField()
       author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
       status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
       published_at = models.DateTimeField(null=True, blank=True)
       created_at = models.DateTimeField(auto_now_add=True)
       updated_at = models.DateTimeField(auto_now=True)

       def save(self, *args, **kwargs):
           if not self.slug:
               self.slug = slugify(self.title)
           super().save(*args, **kwargs)

       def __str__(self) -> str:
           return self.title

       class Meta:
           ordering = ['-created_at']
           indexes = [
               models.Index(fields=['status', '-created_at']),
           ]
   \`\`\`

3. **Create Migrations**:
   \`docker compose run --rm django python manage.py makemigrations\`
   \`docker compose run --rm django python manage.py migrate\`

4. **Register in Admin** (if needed):
   \`\`\`python
   # backend/apps/blog/admin.py
   from django.contrib import admin
   from .models import Post

   @admin.register(Post)
   class PostAdmin(admin.ModelAdmin):
       list_display = ['title', 'author', 'status', 'created_at']
       prepopulated_fields = {'slug': ('title',)}
   \`\`\`

5. **Run Tests**:
   \`docker compose run --rm django pytest apps/<app>/tests/ -v --cov=apps/<app>\`

   **Expected Result**: ALL TESTS SHOULD PASS, coverage >= 90%

6. **Output**:
   - Number of tests passing
   - Coverage percentage
   - List of files created/modified

## Exit Criteria

- [ ] All tests passing (${session.tests_written}/${session.tests_written})
- [ ] Coverage >= 90%
- [ ] Migrations created and applied
- [ ] Models registered in admin (if Models session)

## Important Notes

- Implement ONLY what's needed to pass the tests
- Don't add features not covered by tests
- Follow Django best practices (Meta classes, __str__, etc.)
- Use type hints on all methods

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
# Backend Builder Agent - REFACTOR Phase

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

1. **Add Docstrings**:
   \`\`\`python
   class Post(models.Model):
       """
       Blog post model with draft/publish workflow.

       Attributes:
           title: Post title (max 200 chars)
           slug: URL-friendly slug (auto-generated from title)
           content: Main post content (Markdown supported)
           author: User who created the post
           status: Draft or published
           published_at: When post was published (null for drafts)
       """
   \`\`\`

2. **Add Type Hints**:
   \`\`\`python
   def save(self, *args, **kwargs) -> None:
       if not self.slug:
           self.slug = slugify(self.title)
       super().save(*args, **kwargs)
   \`\`\`

3. **Optimize Queries** (if applicable):
   - Add select_related/prefetch_related hints
   - Add database indexes for frequently queried fields
   - Consider query efficiency

4. **DRY Improvements**:
   - Extract common patterns
   - Remove code duplication
   - Simplify complex logic

5. **Run Tests Again**:
   \`docker compose run --rm django pytest apps/<app>/tests/ -v --cov=apps/<app>\`
   \`docker compose run --rm django mypy apps/<app>\`

   **Expected Result**: Tests still PASS, type checking passes

6. **Output**:
   - List of improvements made
   - Coverage maintained or improved
   - Type checking results

## Exit Criteria

- [ ] All tests still passing
- [ ] Docstrings added to all classes and methods
- [ ] Type hints added to all methods
- [ ] No code duplication
- [ ] Type checking passes (mypy)

## Important Notes

- Don't change behavior - only improve code quality
- Tests should still pass after every change
- If a refactor breaks tests, revert it
- Commit after REFACTOR phase is complete

Make it beautiful!
`.trim()
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
    if (lower.includes('model')) return 'feat'
    if (lower.includes('serializer')) return 'feat'
    if (lower.includes('viewset')) return 'feat'
    if (lower.includes('permission')) return 'feat'
    if (lower.includes('upload')) return 'feat'
    if (lower.includes('optimization')) return 'perf'
    if (lower.includes('refactor')) return 'refactor'

    return 'feat'
  }
}
