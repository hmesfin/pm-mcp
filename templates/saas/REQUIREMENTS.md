# SaaS Multi-Tenant - Technical Requirements

**Generated from**: SaaS Multi-Tenant Template
**Complexity**: Intermediate
**Features**: Organizations, Workspaces, Teams, RBAC, Subscription Billing, Invitations

---

## Data Models

### Organization Model

**File**: `backend/apps/saas/models/organization.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed) - For public API exposure
- `name` (CharField, max_length=200, required)
- `slug` (SlugField, max_length=220, unique, auto-generated from name)
- `description` (TextField, optional)
- `logo` (ImageField, upload_to='organizations/logos/', optional)
- `owner` (ForeignKey to User, on_delete=PROTECT, related_name='owned_organizations')
- `is_active` (BooleanField, default=True)
- `max_members` (PositiveIntegerField, default=5) - Based on subscription tier
- `max_workspaces` (PositiveIntegerField, default=3) - Based on subscription tier
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Owner: Many-to-One with User (organization owner)
- Members: Many-to-Many with User through Membership
- Workspaces: One-to-Many with Workspace
- Subscription: One-to-One with Subscription

**Indexes**:

- `uuid` (unique)
- `slug` (unique)
- `owner` (for filtering)
- `is_active` (for filtering active organizations)

**Validation**:

- Name: Required, max 200 chars, unique
- Slug: Auto-generated from name, unique, alphanumeric + hyphens
- Max members: >= 1
- Max workspaces: >= 1

**Custom Methods**:

- `can_add_member()`: Check if org can add more members (current count < max_members)
- `can_add_workspace()`: Check if org can add more workspaces
- `get_member_count()`: Return count of active memberships
- `get_workspace_count()`: Return count of workspaces
- `upgrade_limits(new_max_members, new_max_workspaces)`: Update limits on subscription upgrade

---

### Workspace Model

**File**: `backend/apps/saas/models/workspace.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `organization` (ForeignKey to Organization, on_delete=CASCADE, related_name='workspaces')
- `name` (CharField, max_length=200, required)
- `slug` (SlugField, max_length=220) - Unique within organization
- `description` (TextField, optional)
- `is_default` (BooleanField, default=False) - Default workspace for new members
- `is_active` (BooleanField, default=True)
- `created_by` (ForeignKey to User, on_delete=SET_NULL, null=True, related_name='created_workspaces')
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Organization: Many-to-One with Organization
- Created by: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `organization` (for filtering)
- Composite: `['organization', 'slug']` (unique together)

**Validation**:

- Name: Required, max 200 chars
- Slug: Auto-generated from name, unique within organization
- Organization: Required

**Custom Methods**:

- `save()`: Auto-generate slug, ensure only one default workspace per org

---

### Membership Model

**File**: `backend/apps/saas/models/membership.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `organization` (ForeignKey to Organization, on_delete=CASCADE, related_name='memberships')
- `user` (ForeignKey to User, on_delete=CASCADE, related_name='memberships')
- `role` (CharField, choices=['owner', 'admin', 'member'], default='member')
- `is_active` (BooleanField, default=True)
- `joined_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Organization: Many-to-One with Organization
- User: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `organization` (for filtering org members)
- `user` (for filtering user's memberships)
- Composite: `['organization', 'user']` (unique together - one membership per user per org)

**Validation**:

- Role: Must be one of ['owner', 'admin', 'member']
- Cannot have multiple owners per organization
- Organization: Required
- User: Required

**Custom Methods**:

- `has_permission(permission)`: Check if role has specific permission
- `can_manage_members()`: True for owner/admin
- `can_manage_workspaces()`: True for owner/admin
- `can_manage_billing()`: True for owner only

**Permissions Matrix**:

| Permission | Owner | Admin | Member |
|------------|-------|-------|--------|
| View org | ✅ | ✅ | ✅ |
| Edit org settings | ✅ | ✅ | ❌ |
| Delete org | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Create workspaces | ✅ | ✅ | ❌ |
| Delete workspaces | ✅ | ✅ | ❌ |
| View workspaces | ✅ | ✅ | ✅ |

---

### Invitation Model

**File**: `backend/apps/saas/models/invitation.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `organization` (ForeignKey to Organization, on_delete=CASCADE, related_name='invitations')
- `email` (EmailField, required)
- `role` (CharField, choices=['admin', 'member'], default='member')
- `token` (CharField, max_length=64, unique, auto-generated) - Secure random token
- `invited_by` (ForeignKey to User, on_delete=SET_NULL, null=True, related_name='sent_invitations')
- `accepted_at` (DateTimeField, null=True, blank=True)
- `expires_at` (DateTimeField) - 7 days from creation
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Organization: Many-to-One with Organization
- Invited by: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `token` (unique)
- `organization` (for filtering org invitations)
- `email` (for lookup)

**Validation**:

- Email: Valid email format, required
- Token: Auto-generated, cryptographically secure
- Expires at: Auto-set to created_at + 7 days

**Custom Methods**:

- `generate_token()`: Create secure random token
- `is_expired()`: Check if invitation has expired
- `accept(user)`: Mark as accepted, create membership
- `send_email()`: Send invitation email via Celery task

---

### Subscription Model

**File**: `backend/apps/saas/models/subscription.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `organization` (OneToOneField to Organization, on_delete=CASCADE, related_name='subscription')
- `stripe_customer_id` (CharField, max_length=200, unique)
- `stripe_subscription_id` (CharField, max_length=200, unique, null=True) - Null for free tier
- `plan_tier` (CharField, choices=['free', 'starter', 'pro', 'enterprise'], default='free')
- `status` (CharField, choices=['active', 'trialing', 'past_due', 'canceled', 'incomplete'], default='active')
- `current_period_start` (DateTimeField, null=True)
- `current_period_end` (DateTimeField, null=True)
- `cancel_at_period_end` (BooleanField, default=False)
- `trial_end` (DateTimeField, null=True) - For trial subscriptions
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Organization: One-to-One with Organization

**Indexes**:

- `uuid` (unique)
- `stripe_customer_id` (unique)
- `stripe_subscription_id` (unique)
- `organization` (unique)

**Validation**:

- Plan tier: Must be one of ['free', 'starter', 'pro', 'enterprise']
- Status: Must be one of ['active', 'trialing', 'past_due', 'canceled', 'incomplete']

**Custom Methods**:

- `sync_from_stripe()`: Sync status from Stripe API
- `upgrade_plan(new_tier)`: Upgrade subscription plan
- `downgrade_plan(new_tier)`: Downgrade subscription plan
- `cancel_subscription()`: Cancel at period end
- `get_plan_limits()`: Return dict of max_members, max_workspaces based on tier

**Plan Limits**:

```python
PLAN_LIMITS = {
    'free': {'max_members': 3, 'max_workspaces': 1},
    'starter': {'max_members': 10, 'max_workspaces': 5},
    'pro': {'max_members': 50, 'max_workspaces': 20},
    'enterprise': {'max_members': None, 'max_workspaces': None}  # Unlimited
}
```

---

### UsageMetric Model

**File**: `backend/apps/saas/models/usage_metric.py`

**Fields**:

- `id` (AutoField, primary key)
- `organization` (ForeignKey to Organization, on_delete=CASCADE, related_name='usage_metrics')
- `metric_type` (CharField, choices=['api_calls', 'storage_mb', 'compute_minutes'], required)
- `value` (PositiveIntegerField, default=0)
- `period_start` (DateField) - Start of billing period
- `period_end` (DateField) - End of billing period
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Organization: Many-to-One with Organization

**Indexes**:

- `organization` (for filtering)
- Composite: `['organization', 'metric_type', 'period_start']` (unique together)

**Validation**:

- Metric type: Must be one of ['api_calls', 'storage_mb', 'compute_minutes']
- Value: >= 0

**Custom Methods**:

- `increment(amount)`: Atomically increment metric value
- `reset_for_period()`: Reset metric for new billing period

---

## API Endpoints

### Organizations Endpoints

**Base URL**: `/api/saas/`

#### List/Create Organizations

- **GET** `/api/saas/organizations/` - List user's organizations
  - Permissions: IsAuthenticated
  - Response: List of orgs where user is a member

- **POST** `/api/saas/organizations/` - Create new organization
  - Permissions: IsAuthenticated
  - Request body: `{ name, description?, logo? }`
  - Response: 201 Created (auto-creates owner membership + default workspace + free subscription)

#### Retrieve/Update/Delete Organization

- **GET** `/api/saas/organizations/{uuid}/` - Get organization details
  - Permissions: IsMember
  - Response: Full org with subscription, member count, workspace count

- **PATCH** `/api/saas/organizations/{uuid}/` - Update organization
  - Permissions: IsOwnerOrAdmin
  - Request body: Partial update
  - Response: 200 OK

- **DELETE** `/api/saas/organizations/{uuid}/` - Delete organization
  - Permissions: IsOwner
  - Response: 204 No Content (cascades to memberships, workspaces, subscriptions)

### Workspaces Endpoints

- **GET** `/api/saas/organizations/{org_uuid}/workspaces/` - List organization's workspaces
  - Permissions: IsMember
  - Response: List of workspaces

- **POST** `/api/saas/organizations/{org_uuid}/workspaces/` - Create workspace
  - Permissions: IsOwnerOrAdmin
  - Request body: `{ name, description?, is_default? }`
  - Response: 201 Created (validates workspace limit)

- **GET** `/api/saas/workspaces/{uuid}/` - Get workspace details
  - Permissions: IsMember
  - Response: Full workspace details

- **PATCH** `/api/saas/workspaces/{uuid}/` - Update workspace
  - Permissions: IsOwnerOrAdmin
  - Request body: Partial update
  - Response: 200 OK

- **DELETE** `/api/saas/workspaces/{uuid}/` - Delete workspace
  - Permissions: IsOwnerOrAdmin
  - Response: 204 No Content

### Memberships Endpoints

- **GET** `/api/saas/organizations/{org_uuid}/members/` - List organization members
  - Permissions: IsMember
  - Response: List of memberships with user details

- **PATCH** `/api/saas/memberships/{uuid}/` - Update member role
  - Permissions: IsOwner (cannot change owner role)
  - Request body: `{ role }`
  - Response: 200 OK

- **DELETE** `/api/saas/memberships/{uuid}/` - Remove member
  - Permissions: IsOwnerOrAdmin (cannot remove owner)
  - Response: 204 No Content

### Invitations Endpoints

- **GET** `/api/saas/organizations/{org_uuid}/invitations/` - List pending invitations
  - Permissions: IsOwnerOrAdmin
  - Response: List of pending invitations

- **POST** `/api/saas/organizations/{org_uuid}/invitations/` - Invite member
  - Permissions: IsOwnerOrAdmin
  - Request body: `{ email, role }`
  - Response: 201 Created (sends email via Celery, validates member limit)

- **POST** `/api/saas/invitations/{token}/accept/` - Accept invitation
  - Permissions: AllowAny (validates token + expiry)
  - Response: 200 OK (creates membership, marks invitation accepted)

- **DELETE** `/api/saas/invitations/{uuid}/` - Revoke invitation
  - Permissions: IsOwnerOrAdmin
  - Response: 204 No Content

### Subscriptions Endpoints

- **GET** `/api/saas/organizations/{org_uuid}/subscription/` - Get subscription details
  - Permissions: IsMember
  - Response: Current subscription + plan limits

- **POST** `/api/saas/subscriptions/create-checkout/` - Create Stripe Checkout session
  - Permissions: IsOwner
  - Request body: `{ organization_uuid, plan_tier }`
  - Response: `{ checkout_url }`

- **POST** `/api/saas/subscriptions/upgrade/` - Upgrade subscription
  - Permissions: IsOwner
  - Request body: `{ organization_uuid, plan_tier }`
  - Response: 200 OK (prorate charges, update limits)

- **POST** `/api/saas/subscriptions/cancel/` - Cancel subscription
  - Permissions: IsOwner
  - Request body: `{ organization_uuid }`
  - Response: 200 OK (cancel at period end)

- **POST** `/api/saas/webhooks/stripe/` - Stripe webhook handler
  - Permissions: AllowAny (validate Stripe signature)
  - Handles: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`

---

## Frontend Components

### Component Hierarchy

```
OrganizationsView
├── OrganizationCard (name, logo, member count, plan badge)
├── CreateOrganizationButton
└── CreateOrganizationModal

OrganizationSettingsView
├── SettingsTabs (General, Members, Workspaces, Billing)
├── GeneralTab
│   ├── OrganizationForm (name, description, logo)
│   └── DeleteOrganizationButton
├── MembersTab
│   ├── MemberList
│   │   └── MemberRow (avatar, name, email, role, actions)
│   ├── InvitationList
│   │   └── InvitationRow (email, role, sent date, revoke)
│   └── InviteMemberButton
├── WorkspacesTab
│   ├── WorkspaceList
│   │   └── WorkspaceCard (name, description, members, actions)
│   └── CreateWorkspaceButton
└── BillingTab
    ├── CurrentPlanCard (tier, status, period, usage)
    ├── PlanComparisonTable
    └── UpgradeButton

WorkspaceView
├── WorkspaceHeader (name, description, members)
├── WorkspaceContent (custom per workspace)
└── WorkspaceSettings (admin only)

InviteAcceptView
├── InvitationDetails (org name, logo, inviter)
├── AcceptButton
└── DeclineButton
```

### Key Composables

**`useOrganization.ts`**:

```typescript
export const useOrganization = (uuid: string) => {
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization', uuid],
    queryFn: () => apiClient.saas.organizationsRetrieve({ path: { uuid } })
  })

  const updateOrg = useMutation({
    mutationFn: (data: UpdateOrgData) =>
      apiClient.saas.organizationsPartialUpdate({ path: { uuid }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['organization', uuid])
  })

  const deleteOrg = useMutation({
    mutationFn: () => apiClient.saas.organizationsDestroy({ path: { uuid } })
  })

  return { org, isLoading, updateOrg, deleteOrg }
}
```

**`useWorkspaces.ts`**:

```typescript
export const useWorkspaces = (orgUuid: string) => {
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces', orgUuid],
    queryFn: () => apiClient.saas.organizationsWorkspacesList({ path: { org_uuid: orgUuid } })
  })

  const createWorkspace = useMutation({
    mutationFn: (data: CreateWorkspaceData) =>
      apiClient.saas.organizationsWorkspacesCreate({ path: { org_uuid: orgUuid }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['workspaces', orgUuid])
  })

  return { workspaces, createWorkspace }
}
```

**`useInvitations.ts`**:

```typescript
export const useInvitations = (orgUuid: string) => {
  const { data: invitations } = useQuery({
    queryKey: ['invitations', orgUuid],
    queryFn: () => apiClient.saas.organizationsInvitationsList({ path: { org_uuid: orgUuid } })
  })

  const inviteMember = useMutation({
    mutationFn: (data: InviteMemberData) =>
      apiClient.saas.organizationsInvitationsCreate({ path: { org_uuid: orgUuid }, body: data }),
    onSuccess: () => queryClient.invalidateQueries(['invitations', orgUuid])
  })

  const acceptInvitation = useMutation({
    mutationFn: (token: string) =>
      apiClient.saas.invitationsAcceptCreate({ path: { token } })
  })

  return { invitations, inviteMember, acceptInvitation }
}
```

**`useSubscription.ts`**:

```typescript
export const useSubscription = (orgUuid: string) => {
  const { data: subscription } = useQuery({
    queryKey: ['subscription', orgUuid],
    queryFn: () => apiClient.saas.organizationsSubscriptionRetrieve({ path: { org_uuid: orgUuid } })
  })

  const createCheckout = useMutation({
    mutationFn: (planTier: string) =>
      apiClient.saas.subscriptionsCreateCheckoutCreate({ body: { organization_uuid: orgUuid, plan_tier: planTier } })
  })

  const upgradeSubscription = useMutation({
    mutationFn: (planTier: string) =>
      apiClient.saas.subscriptionsUpgradeCreate({ body: { organization_uuid: orgUuid, plan_tier: planTier } }),
    onSuccess: () => queryClient.invalidateQueries(['subscription', orgUuid])
  })

  return { subscription, createCheckout, upgradeSubscription }
}
```

---

## Validation Rules

### Organization Validation

**Backend** (`apps/saas/serializers/organization.py`):

```python
class OrganizationSerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        if len(value) < 3:
            raise ValidationError("Name must be at least 3 characters")
        return value

    def validate_slug(self, value):
        if not value.replace('-', '').isalnum():
            raise ValidationError("Slug must be alphanumeric")
        return value
```

**Frontend Zod Schema** (`frontend/src/schemas/organization.ts`):

```typescript
export const organizationSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  description: z.string().max(1000).optional(),
  logo: z.instanceof(File).optional().refine(
    (file) => !file || file.size <= 2 * 1024 * 1024,
    "Logo must be less than 2MB"
  )
})
```

### Invitation Validation

**Backend**:

```python
class InvitationSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        organization = attrs.get('organization')
        email = attrs.get('email')

        # Check if already a member
        if Membership.objects.filter(organization=organization, user__email=email).exists():
            raise ValidationError("User is already a member")

        # Check if pending invitation exists
        if Invitation.objects.filter(organization=organization, email=email, accepted_at__isnull=True).exists():
            raise ValidationError("Invitation already sent")

        # Check member limit
        if not organization.can_add_member():
            raise ValidationError("Member limit reached for current plan")

        return attrs
```

**Frontend Zod Schema**:

```typescript
export const invitationSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(['admin', 'member'])
})
```

---

## Test Coverage Requirements

### Backend Tests

**Models** (`apps/saas/tests/test_models.py`):

- Organization creation with auto-subscription
- Workspace slug uniqueness within org
- Membership role permissions
- Invitation token generation
- Subscription plan limits

**Serializers** (`apps/saas/tests/test_serializers.py`):

- Organization validation
- Invitation duplicate prevention
- Membership role validation

**ViewSets** (`apps/saas/tests/test_viewsets.py`):

- Create organization (auto-creates owner membership + default workspace)
- Invite member (validates limit, sends email)
- Accept invitation (creates membership)
- Upgrade subscription (updates limits)
- Webhook handling

**Permissions** (`apps/saas/tests/test_permissions.py`):

- Only owner can delete org
- Only owner can manage billing
- Only owner/admin can invite members
- Only members can view org

**Minimum Coverage**: 90%

### Frontend Tests

**Components** (`frontend/src/components/saas/*.test.ts`):

- OrganizationCard renders
- InviteMemberButton validates email
- PlanComparisonTable displays correctly
- WorkspaceCard shows member count

**Composables** (`frontend/src/composables/*.test.ts`):

- useOrganization CRUD
- useInvitations invite flow
- useSubscription upgrade flow

**Views** (`frontend/src/views/saas/*.test.ts`):

- OrganizationSettingsView tabs
- InviteAcceptView validation

**Minimum Coverage**: 85%

---

## Performance Considerations

### Database Optimizations

- Use `select_related('owner', 'subscription')` for org queries
- Use `prefetch_related('memberships__user', 'workspaces')` for detail views
- Index on `organization` for workspace/membership queries

### Caching Strategy

- Cache organization details: 10 minutes (per tenant)
- Cache subscription limits: 30 minutes
- Use Redis namespacing per organization

### Tenant Isolation

- All queries filter by organization (row-level security)
- Middleware sets `request.organization` based on URL/token
- Prevent cross-tenant data leakage

---

## Security Considerations

### Permissions

- Only owner can delete organization
- Only owner can manage billing
- Only owner/admin can invite members
- Only members can view organization data

### Tenant Isolation

- Strict row-level filtering by organization
- Middleware validates organization access
- No cross-tenant queries allowed

### Invitation Security

- Tokens are cryptographically secure (64 chars)
- Invitations expire after 7 days
- Token validation on accept

### Rate Limiting

- Organization creation: 5 per hour per user
- Invitation sending: 20 per hour per org
- Subscription changes: 10 per hour per org

---

## Estimated Complexity

**Models**: 6 (Organization, Workspace, Membership, Invitation, Subscription, UsageMetric)
**API Endpoints**: 23
**Frontend Components**: 22
**Estimated Sessions**: 14
**Estimated Time**: 42 hours
**Test Count**: ~750 tests
