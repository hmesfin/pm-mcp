# SaaS Multi-Tenant Template

Production-ready SaaS platform template with organizations, teams, workspaces, and subscription billing.

## What's Included

**Core Features**:
- ✅ Multi-tenant architecture (organizations)
- ✅ Team/workspace management
- ✅ Role-based access control (RBAC)
- ✅ Subscription billing (Stripe)
- ✅ User invitations with email
- ✅ Admin dashboard per organization
- ✅ Usage metering and limits

**Technical Features**:
- ✅ Row-level security (PostgreSQL RLS)
- ✅ Tenant isolation (data security)
- ✅ Stripe Subscriptions integration
- ✅ Webhook handling (payment events)
- ✅ Email notifications (invites, billing)
- ✅ Redis caching per tenant

## Customization Options

### 1. Billing Model?
**Default**: Stripe Subscriptions

- **Free tier only**: No billing, just user/team management
- **Stripe Subscriptions**: Monthly/annual plans with tiers
- **Usage-based**: Pay-as-you-go metering
- **Impact**:
  - Free tier: -3 sessions, -60 tests, -8 hours
  - Usage-based: +2 sessions, +40 tests, +5 hours

### 2. Team Size Limits?
**Default**: Yes (by plan tier)

- **Yes**: Limit users per organization by subscription tier
- **No**: Unlimited users per organization
- **Impact**: -0.5 sessions, -10 tests, -1 hour

### 3. Role Complexity?
**Default**: Basic (Admin, Member)

- **Basic**: 2 roles (Admin, Member)
- **Advanced**: 4+ roles (Owner, Admin, Editor, Viewer) with granular permissions
- **Impact**: +2 sessions, +50 tests, +4 hours

## Complexity Variants

### Basic (Team Collaboration Tool)
**Config**: Free tier, No limits, Basic roles
- **Sessions**: 11
- **Time**: 32 hours
- **Tests**: ~600

### Intermediate (Recommended - Default)
**Config**: Stripe Subscriptions, Team limits, Basic roles
- **Sessions**: 14
- **Time**: 42 hours
- **Tests**: ~750

### Advanced (Enterprise SaaS)
**Config**: Stripe + Usage-based, Team limits, Advanced roles
- **Sessions**: 18
- **Time**: 55 hours
- **Tests**: ~900

## Models Summary

| Model | Description | Key Features |
|-------|-------------|-------------|
| Organization | Tenant root | Subscription, limits |
| Workspace | Sub-organization | Team collaboration space |
| Membership | User ↔ Org | Role, permissions |
| Invitation | Email invites | Token, expiry |
| Subscription | Billing | Stripe customer, plan tier |
| UsageMetric | Metering | API calls, storage, etc. |

## Mobile Support

### Recommended Mobile Features (Selective)

**Include**:
- ✅ View organization/team members
- ✅ Collaborate in workspaces
- ✅ Receive invitation notifications
- ✅ Basic workspace actions

**Exclude**:
- ❌ Organization settings (use web)
- ❌ Billing management (use web)
- ❌ User invitations (use web)
- ❌ Advanced admin features (use web)

**Mobile-Specific**:
- ✅ Push notifications (team activity, mentions)
- ✅ Offline workspace access (cache data)
- ✅ Biometric login

## Subscription Tiers Example

**Starter** ($19/month):
- 5 team members
- 3 workspaces
- 10,000 API calls/month

**Pro** ($49/month):
- 20 team members
- 10 workspaces
- 100,000 API calls/month

**Enterprise** (Custom):
- Unlimited team members
- Unlimited workspaces
- Unlimited API calls

## Getting Started

1. Run `/plan-app` in Claude Code
2. Select "SaaS Multi-Tenant" template
3. Answer customization questions
4. Set up Stripe account
5. Review generated plans
6. Start building!

## Required External Services

- **Stripe** (for billing)
- **Email Service** (SendGrid, Mailgun)
- **Redis** (for tenant caching)

## Support

See: `.claude/PLANNING_GUIDE.md`
