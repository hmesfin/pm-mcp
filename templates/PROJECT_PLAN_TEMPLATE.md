# Project Plan: {{APP_NAME}}

## Overview

{{APP_DESCRIPTION}}

## Technical Stack

- **Backend**: Django 5.2 + Django REST Framework + PostgreSQL
- **Frontend**: Vue 3 (Composition API) + TypeScript + Vite + Shadcn-vue + Tailwind CSS v4
- **Mobile**: {{MOBILE_STACK}}
- **Infrastructure**: Docker + Redis + Celery + Mailpit (local email testing)
- **Authentication**: Email-based with OTP verification + JWT tokens
- **API Contract**: OpenAPI schema with auto-generated TypeScript client

## Scope & Complexity

**Complexity Level**: {{COMPLEXITY_LEVEL}}

**Core Features**:
{{CORE_FEATURES}}

**Third-party Integrations**:
{{INTEGRATIONS}}

## Phases

### Phase 1: Backend Foundation
**Goal**: Build robust, tested Django backend API

**Sessions**:
{{PHASE_1_SESSIONS}}

**Deliverables**:
- All models created with tests (>85% coverage)
- Django admin configured
- All API endpoints implemented with tests
- Serializers with proper validation
- Business logic in services/tasks (if applicable)
- Permissions & security configured

**Estimated Time**: {{PHASE_1_TIME}}

---

### Phase 2: Frontend Foundation
**Goal**: Build type-safe, tested Vue.js frontend

**Sessions**:
{{PHASE_2_SESSIONS}}

**Deliverables**:
- TypeScript API client generated from OpenAPI schema
- Zod validation schemas (mirror backend validation)
- Vue composables for data fetching (TanStack Query)
- Reusable UI components (Shadcn-vue)
- Views with routing (Vue Router)
- Pinia stores for global state
- All components tested (>85% coverage)

**Estimated Time**: {{PHASE_2_TIME}}

---

### Phase 3: {{PHASE_3_NAME}}
**Goal**: {{PHASE_3_GOAL}}

**Sessions**:
{{PHASE_3_SESSIONS}}

**Deliverables**:
{{PHASE_3_DELIVERABLES}}

**Estimated Time**: {{PHASE_3_TIME}}

---

### Phase 4: {{PHASE_4_NAME}}
**Goal**: {{PHASE_4_GOAL}}

**Sessions**:
{{PHASE_4_SESSIONS}}

**Deliverables**:
{{PHASE_4_DELIVERABLES}}

**Estimated Time**: {{PHASE_4_TIME}}

---

## Data Models Summary

{{DATA_MODELS_SUMMARY}}

## API Endpoints Summary

{{API_ENDPOINTS_SUMMARY}}

## Success Criteria

- [ ] All tests pass (>85% coverage overall, >90% for data models, >95% for security)
- [ ] Type-safe (no `any` types in TypeScript)
- [ ] OpenAPI schema accurate and up-to-date
- [ ] All API endpoints documented
- [ ] Zod schemas match backend validation
- [ ] Docker deployment working (all services start successfully)
- [ ] Django admin configured for all models
- [ ] Frontend build succeeds with no type errors
- [ ] All business logic has corresponding tests

## Testing Strategy

### Backend (pytest)
- Unit tests for models, serializers, services
- Integration tests for API endpoints
- Permission tests for RBAC
- Business logic tests (services, Celery tasks)
- Minimum 85% coverage (90% for data, 95% for security)

### Frontend (Vitest)
- Component tests (Vue Test Utils)
- Composable tests
- Store tests (Pinia)
- Zod schema validation tests
- Minimum 85% coverage

### E2E Testing
{{E2E_TESTING_STRATEGY}}

## Deployment Notes

{{DEPLOYMENT_NOTES}}

## Post-Launch Considerations

{{POST_LAUNCH_CONSIDERATIONS}}

## Dependencies & Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for host-based frontend commands)
- Python 3.12+ (if running commands outside Docker)
- Git for version control

## Project Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Backend Foundation | {{PHASE_1_TIME}} | Not Started |
| Phase 2: Frontend Foundation | {{PHASE_2_TIME}} | Not Started |
| Phase 3: {{PHASE_3_NAME}} | {{PHASE_3_TIME}} | Not Started |
| Phase 4: {{PHASE_4_NAME}} | {{PHASE_4_TIME}} | Not Started |
| **Total** | **{{TOTAL_TIME}}** | |

## Notes

{{ADDITIONAL_NOTES}}
