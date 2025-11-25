# Project Plan: SaaS Multi-Tenant Platform

## Overview

A production-ready SaaS platform with multi-tenant architecture, organizations, team workspaces, role-based access control (RBAC), and subscription billing. Includes secure tenant isolation, email invitations, usage metering, and Stripe integration. Built with TDD principles and enterprise-grade security.

**Complexity**: Intermediate
**Target Users**: SaaS companies, B2B platforms, team collaboration tools

## Technical Stack

- **Backend**: Django 5.2 + Django REST Framework + PostgreSQL (with RLS)
- **Frontend**: Vue 3 (Composition API) + TypeScript + Shadcn-vue + Tailwind CSS
- **Payments**: Stripe (Subscriptions API, Checkout, Webhooks)
- **Infrastructure**: Docker + Redis + Celery
- **Email**: Django-anymail + SendGrid/Mailgun
- **Caching**: Redis (per-tenant namespacing)

## Phases

### Phase 1: Backend Foundation - Organizations & Tenancy (Sessions 1-4)
**Goal**: Build multi-tenant foundation with strict data isolation

#### Session 1: Organization Models + Tenancy (TDD)
- Create `saas` Django app
- Implement Organization, Workspace models
- Auto-slug generation
- Tenant isolation middleware (sets `request.organization`)
- Register models in Django admin with tenant filtering
- Write comprehensive model tests
- **Estimated Time**: 3.5 hours
- **Tests**: ~90 tests

#### Session 2: Membership & RBAC (TDD)
- Membership model (user ↔ organization with roles)
- Role permissions (owner, admin, member)
- Permission checking methods (can_manage_members, can_manage_billing)
- One owner per organization constraint
- Membership serializers and viewsets
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 3: Organization API + Permissions (TDD)
- OrganizationSerializer with nested data
- WorkspaceSerializer
- Organization CRUD viewsets
- Workspace CRUD viewsets (nested under org)
- IsMember, IsOwnerOrAdmin permissions
- Tenant isolation in all queries
- **Estimated Time**: 3.5 hours
- **Tests**: ~90 tests

#### Session 4: Auto-Provisioning on Org Creation (TDD)
- On org creation: auto-create owner membership
- On org creation: auto-create default workspace
- On org creation: auto-create free subscription
- Organization deletion cascade logic
- **Estimated Time**: 2 hours
- **Tests**: ~60 tests

**Phase 1 Total**: 12 hours, ~320 tests

---

### Phase 2: Backend - Invitations & Team Management (Sessions 5-6)
**Goal**: Email-based team invitations with security

#### Session 5: Invitation System (TDD)
- Invitation model (email, role, token, expiry)
- Secure token generation (64-char cryptographic)
- Invitation serializers and viewsets
- Member limit validation on invite
- Duplicate invitation prevention
- **Estimated Time**: 2.5 hours
- **Tests**: ~70 tests

#### Session 6: Invitation Email + Acceptance (TDD)
- Celery task: send invitation email
- Email template (org name, logo, inviter, accept link)
- Accept invitation endpoint (validates token + expiry)
- Create membership on acceptance
- Mark invitation as accepted
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 2 Total**: 5.5 hours, ~130 tests

---

### Phase 3: Backend - Subscriptions & Billing (Sessions 7-9)
**Goal**: Stripe subscription integration with plan limits

#### Session 7: Subscription Model + Plan Limits (TDD)
- Subscription model (Stripe customer, subscription, plan tier)
- Plan limits (free, starter, pro, enterprise)
- Update org limits on subscription change
- Subscription serializers
- **Estimated Time**: 2.5 hours
- **Tests**: ~70 tests

#### Session 8: Stripe Checkout + Subscription Creation (TDD)
- Create Stripe customer on org creation
- Create Stripe Checkout session endpoint
- Handle successful checkout (create subscription)
- Upgrade/downgrade subscription endpoints
- Proration handling
- **Estimated Time**: 4 hours
- **Tests**: ~80 tests

#### Session 9: Stripe Webhooks + Sync (TDD)
- Webhook endpoint (signature validation)
- Handle `customer.subscription.updated`
- Handle `customer.subscription.deleted`
- Handle `invoice.payment_succeeded`
- Handle `invoice.payment_failed`
- Sync subscription status from Stripe
- **Estimated Time**: 3.5 hours
- **Tests**: ~70 tests

**Phase 3 Total**: 10 hours, ~220 tests

---

### Phase 4: Backend - Usage Metering (Session 10)
**Goal**: Track API usage and enforce limits

#### Session 10: Usage Metrics (TDD)
- UsageMetric model (API calls, storage, compute)
- Atomic metric increment
- Middleware to track API calls per org
- Reset metrics on new billing period (Celery task)
- Usage limit enforcement
- **Estimated Time**: 2.5 hours
- **Tests**: ~60 tests

**Phase 4 Total**: 2.5 hours, ~60 tests

---

### Phase 5: Frontend Foundation (Sessions 11-12)
**Goal**: Type-safe frontend with organization management

#### Session 11: API Client + Composables (Code Generation + TDD)
- Generate TypeScript SDK from OpenAPI schema
- Create Zod validation schemas (org, workspace, invitation)
- Set up React Query
- `useOrganization`, `useOrganizations` composables
- `useWorkspaces` composable
- **Estimated Time**: 2 hours
- **Tests**: ~40 tests

#### Session 12: Organization UI Components (TDD)
- OrganizationCard (name, logo, member count, plan badge)
- CreateOrganizationModal
- OrganizationForm (name, description, logo upload)
- DeleteOrganizationButton (confirmation)
- PlanBadge component
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 5 Total**: 5 hours, ~100 tests

---

### Phase 6: Frontend - Organization Settings (Sessions 13-15)
**Goal**: Complete organization management UI

#### Session 13: Members & Invitations UI (TDD)
- `useInvitations`, `useMembers` composables
- MemberList component (avatar, name, role, actions)
- InviteMemberButton + InviteMemberModal
- InvitationList (pending invitations)
- Role selector dropdown
- Remove member confirmation
- **Estimated Time**: 3.5 hours
- **Tests**: ~70 tests

#### Session 14: Workspaces UI (TDD)
- WorkspaceCard (name, description, members)
- CreateWorkspaceButton + CreateWorkspaceModal
- WorkspaceList component
- Delete workspace confirmation
- Workspace limit display (e.g., "3/5 workspaces used")
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

#### Session 15: Billing & Subscription UI (TDD)
- `useSubscription` composable
- CurrentPlanCard (tier, status, period, next billing date)
- PlanComparisonTable (features, limits, pricing)
- UpgradeButton → Stripe Checkout redirect
- CancelSubscriptionButton (confirmation)
- Usage meter display
- **Estimated Time**: 3.5 hours
- **Tests**: ~60 tests

**Phase 6 Total**: 9.5 hours, ~180 tests

---

### Phase 7: Frontend - Invitation Acceptance (Session 16)
**Goal**: Public invitation acceptance flow

#### Session 16: Invitation Accept View (TDD)
- InviteAcceptView (public page)
- Display org details (name, logo, inviter)
- AcceptButton (validates token, creates membership)
- DeclineButton (optional)
- Expired invitation UI
- Already-a-member handling
- **Estimated Time**: 2 hours
- **Tests**: ~40 tests

**Phase 7 Total**: 2 hours, ~40 tests

---

### Phase 8: Integration & Polish (Session 17)
**Goal**: End-to-end testing, optimization, deployment prep

#### Session 17: E2E Testing + Performance (TDD)
- E2E workflow: Create org → Invite member → Accept invitation
- E2E workflow: Upgrade subscription → Verify limits increased
- E2E workflow: Create workspace → Add member → Verify access
- Stripe webhook testing (simulate events in test mode)
- Tenant isolation verification (cannot access other org's data)
- Cache hit/miss analysis (per-tenant caching)
- Type checking (0 TypeScript errors)
- Final coverage report (>85% target)
- Documentation updates
- **Estimated Time**: 3.5 hours
- **Tests**: ~50 E2E tests

**Phase 8 Total**: 3.5 hours, ~50 tests

---

## Summary

**Total Sessions**: 17
**Total Estimated Time**: 50 hours
**Total Test Count**: ~1100 tests
**Backend Coverage Target**: 90%
**Frontend Coverage Target**: 85%

## Data Models Summary

| Model         | Fields | Relationships              | Indexes |
|---------------|--------|----------------------------|---------|
| Organization  | 12     | User (owner), Workspace, Membership, Subscription | 4 |
| Workspace     | 10     | Organization, User (creator) | 3 |
| Membership    | 7      | Organization, User         | 4 |
| Invitation    | 9      | Organization, User (inviter) | 4 |
| Subscription  | 12     | Organization               | 4 |
| UsageMetric   | 8      | Organization               | 2 |

## API Endpoints Summary

| Resource       | Endpoints | Methods                     | Permissions |
|----------------|-----------|----------------------------|-------------|
| Organizations  | 5         | GET, POST, PATCH, DELETE   | Member, Owner/Admin |
| Workspaces     | 5         | GET, POST, PATCH, DELETE   | Member, Owner/Admin |
| Memberships    | 3         | GET, PATCH, DELETE         | Member, Owner |
| Invitations    | 4         | GET, POST, DELETE, Accept  | Owner/Admin, Public (accept) |
| Subscriptions  | 5         | GET, POST (checkout, upgrade, cancel) | Member, Owner |
| Webhooks       | 1         | POST                       | Public (Stripe signature) |

**Total Endpoints**: 23

## Frontend Components Summary

| Component Type | Count | Testing Priority |
|----------------|-------|------------------|
| Views          | 5     | High             |
| Components     | 17    | High             |
| Composables    | 7     | High             |

**Total Components**: 29

## Success Criteria

- ✅ All tests pass (>85% coverage)
- ✅ Type-safe (0 TypeScript `any`, 0 type errors)
- ✅ OpenAPI schema accurate
- ✅ Tenant isolation verified (no cross-tenant data leakage)
- ✅ Stripe subscription flow working (test mode)
- ✅ Webhook handling verified
- ✅ Invitation email sent successfully
- ✅ Member limits enforced based on plan
- ✅ Workspace limits enforced
- ✅ Usage metrics tracked correctly
- ✅ RBAC permissions working (owner, admin, member)
- ✅ Create org → invite → accept workflow E2E
- ✅ Docker deployment working

## Testing Strategy

### Backend (pytest + coverage)
- **Models**: Field validation, relationships, auto-provisioning, tenant isolation
- **Serializers**: Validation rules, member limit checks, duplicate prevention
- **ViewSets**: CRUD operations, nested routes, tenant filtering
- **Permissions**: RBAC (owner, admin, member), tenant access control
- **Stripe**: Webhook signature validation, subscription status updates
- **Celery**: Email sending, usage metric resets

**Target**: 90% coverage

### Frontend (Vitest + Vue Test Utils)
- **Components**: Rendering, props, events, Stripe Checkout redirect
- **Composables**: Data fetching, mutations, organization switching
- **Views**: Full page rendering, invitation acceptance flow
- **Schemas**: Zod validation (organization, workspace, invitation)

**Target**: 85% coverage

### E2E (Playwright - recommended)
- Complete onboarding: Create org → Invite → Accept
- Subscription upgrade: Upgrade → Verify limits
- Workspace creation: Create → Verify access
- Tenant isolation: Switch orgs → Verify data separation

**Target**: Critical paths covered

## Performance Targets

- **Organization list load**: < 1.5 seconds
- **Organization detail API**: < 250ms (with caching)
- **Workspace list API**: < 200ms
- **Invitation send**: < 2 seconds (includes email)
- **Subscription upgrade**: < 3 seconds
- **Stripe Checkout redirect**: < 1 second

## Security Checklist

- ✅ Tenant isolation enforced (row-level filtering)
- ✅ Middleware validates organization access
- ✅ No cross-tenant queries possible
- ✅ Invitation tokens cryptographically secure (64 chars)
- ✅ Invitation expiry enforced (7 days)
- ✅ Stripe webhook signature verified
- ✅ RBAC permissions enforced (owner, admin, member)
- ✅ Only owner can delete organization
- ✅ Only owner can manage billing
- ✅ Member/workspace limits enforced
- ✅ CSRF protection enabled
- ✅ SQL injection prevention (ORM)
- ✅ Rate limiting on org creation, invitations

## Optional Enhancements (Post-MVP)

- [ ] Advanced roles (Owner, Admin, Editor, Viewer) with granular permissions
- [ ] Usage-based billing (pay-as-you-go metering)
- [ ] SSO integration (SAML, OAuth)
- [ ] Audit logs (track all org actions)
- [ ] Two-factor authentication (2FA)
- [ ] Custom domains per organization
- [ ] White-labeling (custom branding)
- [ ] API keys per organization
- [ ] Webhooks for organization events
- [ ] Organization activity feed
- [ ] Advanced analytics dashboard
- [ ] Data export (GDPR compliance)
- [ ] SCIM provisioning (for enterprise)
- [ ] Workspace templates
- [ ] Role-based workspace access

## Stripe Setup Checklist

**Development (Test Mode)**:
1. Create Stripe account: https://stripe.com
2. Get test API keys (Publishable + Secret)
3. Add to `.env`: `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_PUBLISHABLE_KEY=pk_test_...`
4. Create subscription products in Stripe Dashboard (Starter, Pro, Enterprise)
5. Get product/price IDs, add to `settings.py`
6. Set webhook endpoint: `http://localhost:8000/api/saas/webhooks/stripe/`
7. Get webhook signing secret: `STRIPE_WEBHOOK_SECRET=whsec_...`
8. Use test card: `4242 4242 4242 4242`

**Production**:
1. Activate Stripe account (verify business info)
2. Get live API keys
3. Create live subscription products
4. Update `.env` with live keys and product IDs
5. Set production webhook endpoint
6. Enable 3D Secure (SCA compliance)
7. Configure tax settings (if applicable)

## Email Service Setup

**Development (Mailpit)**:
- Email sent to: http://localhost:8025
- No configuration needed

**Production (SendGrid/Mailgun)**:
1. Create account (SendGrid or Mailgun)
2. Get API key
3. Add to `.env`: `EMAIL_BACKEND`, `SENDGRID_API_KEY` or `MAILGUN_API_KEY`
4. Verify sender email/domain
5. Configure DNS records (SPF, DKIM)

## Timeline

**Week 1**: Backend Foundation - Organizations & Tenancy (Phase 1)
**Week 2**: Backend - Invitations & Subscriptions (Phase 2-3)
**Week 3**: Backend - Usage Metering + Frontend Foundation (Phase 4-5)
**Week 4**: Frontend - Settings & Billing UI (Phase 6-7)
**Week 5**: Integration & Polish (Phase 8)

**Total Duration**: 5 weeks (part-time) or 2.5 weeks (full-time)

---

**Ready to start building?** Ensure Stripe and email service are configured before Session 7.
