# Phase {{PHASE_NUMBER}}: {{PHASE_NAME}}

## Phase Overview

**Goal**: {{PHASE_GOAL}}

**Duration**: {{PHASE_DURATION}}

**Prerequisites**: {{PHASE_PREREQUISITES}}

---

## Session {{SESSION_NUMBER}}: {{SESSION_NAME}}

### Session Overview

**Objectives**:
{{SESSION_OBJECTIVES}}

**Estimated Context Usage**: {{SESSION_CONTEXT_ESTIMATE}} tokens

**Duration**: {{SESSION_DURATION}}

---

### TDD Workflow (RED-GREEN-REFACTOR)

#### Step 1: RED Phase - Write Failing Tests

**Goal**: Write tests FIRST before any implementation code exists.

**Files to Create**:
{{TEST_FILES_TO_CREATE}}

**Test Cases to Write**:
{{TEST_CASES_TO_WRITE}}

**Run Tests**:
```bash
{{TEST_COMMAND}}
```

**Expected Result**: ❌ All tests FAIL (implementation doesn't exist yet)

---

#### Step 2: GREEN Phase - Implement to Pass Tests

**Goal**: Write minimal code to make all tests pass.

**Files to Create/Modify**:
{{IMPLEMENTATION_FILES}}

**Implementation Checklist**:
{{IMPLEMENTATION_CHECKLIST}}

**Run Tests**:
```bash
{{TEST_COMMAND}}
```

**Expected Result**: ✅ All tests PASS

**Additional Commands** (if applicable):
{{ADDITIONAL_COMMANDS}}

---

#### Step 3: REFACTOR Phase - Optimize & Clean

**Goal**: Improve code quality while keeping tests passing.

**Refactoring Tasks**:
{{REFACTORING_TASKS}}

**Run Tests Again**:
```bash
{{TEST_COMMAND}}
```

**Expected Result**: ✅ All tests still PASS after refactoring

---

### Detailed Implementation Guide

#### {{IMPLEMENTATION_SECTION_1_TITLE}}

{{IMPLEMENTATION_SECTION_1_CONTENT}}

**Example Code**:
```{{IMPLEMENTATION_SECTION_1_LANGUAGE}}
{{IMPLEMENTATION_SECTION_1_CODE}}
```

---

#### {{IMPLEMENTATION_SECTION_2_TITLE}}

{{IMPLEMENTATION_SECTION_2_CONTENT}}

**Example Code**:
```{{IMPLEMENTATION_SECTION_2_LANGUAGE}}
{{IMPLEMENTATION_SECTION_2_CODE}}
```

---

### Files to Create/Modify

**New Files**:
{{NEW_FILES_LIST}}

**Modified Files**:
{{MODIFIED_FILES_LIST}}

---

### Test Coverage Requirements

- **Minimum Coverage**: {{MIN_COVERAGE}}%
- **Target Coverage**: {{TARGET_COVERAGE}}%

**Coverage Areas**:
{{COVERAGE_AREAS}}

**Run Coverage Report**:
```bash
{{COVERAGE_COMMAND}}
```

---

### Type Checking

**Backend** (Python with mypy):
```bash
docker compose run --rm django mypy apps/{{APP_NAME}}
```

**Frontend** (TypeScript with vue-tsc):
```bash
docker compose run --rm frontend npm run type-check
```

**Expected Result**: ✅ No type errors

---

### Exit Criteria

**Required**:
- [ ] All tests pass
- [ ] Coverage >= {{MIN_COVERAGE}}%
- [ ] Type checking passes (no errors)
- [ ] Code formatted (Ruff for Python, Prettier for TypeScript)
- [ ] No linting errors

**Optional** (but recommended):
- [ ] Code reviewed for best practices
- [ ] Documentation updated (if public APIs changed)
- [ ] Git commit created with descriptive message

---

### Dependencies

**Requires Completion Of**:
{{SESSION_DEPENDENCIES}}

**Blocks**:
{{BLOCKED_SESSIONS}}

---

### Common Issues & Solutions

{{COMMON_ISSUES}}

---

### Next Session

**Session {{NEXT_SESSION_NUMBER}}**: {{NEXT_SESSION_NAME}}

**Preview**: {{NEXT_SESSION_PREVIEW}}

---

## Session {{NEXT_SESSION_NUMBER}}: {{NEXT_SESSION_NAME}}

[Repeat structure above for next session...]

---

## Phase {{PHASE_NUMBER}} Completion Checklist

After completing all sessions in this phase:

- [ ] All phase objectives achieved
- [ ] All tests passing across entire phase
- [ ] Overall coverage >= {{PHASE_MIN_COVERAGE}}%
- [ ] Type checking passes for all code
- [ ] Integration between components verified
- [ ] Documentation updated
- [ ] Git commits created with clear messages
- [ ] Ready to proceed to Phase {{NEXT_PHASE_NUMBER}}

---

## Phase {{PHASE_NUMBER}} Summary

**Total Sessions**: {{TOTAL_PHASE_SESSIONS}}

**Total Duration**: {{PHASE_DURATION}}

**Files Created**: {{TOTAL_FILES_CREATED}}

**Tests Written**: {{TOTAL_TESTS_WRITTEN}}

**Lines of Code**: ~{{ESTIMATED_LOC}}

---

## Notes

{{PHASE_NOTES}}
