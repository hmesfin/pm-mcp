# Project Planner MCP - Usage Examples

Real-world examples for common workflows and use cases.

## Table of Contents

- [Complete Workflow Example](#complete-workflow-example)
- [Planning a Blog App](#planning-a-blog-app)
- [Planning an E-commerce App](#planning-an-e-commerce-app)
- [Planning a SaaS App](#planning-a-saas-app)
- [GitHub Integration Examples](#github-integration-examples)
- [Intelligence Tool Examples](#intelligence-tool-examples)
- [Resource Usage Examples](#resource-usage-examples)

---

## Complete Workflow Example

This example shows the complete workflow from idea to execution tracking.

### Step 1: Create Requirements

First, create a `REQUIREMENTS.md` file:

```markdown
# Task Manager App

## Overview
A simple task management application for personal productivity.

## Core Entities
- User (email, password, name)
- Task (title, description, due_date, priority, status)
- Category (name, color)
- Tag (name)

## Features
- User authentication (register, login, logout)
- CRUD operations for tasks
- Task categorization
- Task filtering and search
- Due date reminders

## Technical Requirements
- Backend: Django REST Framework
- Frontend: Vue 3 with Composition API
- Database: PostgreSQL
- Authentication: JWT

## Complexity
Intermediate
```

### Step 2: Analyze Requirements

```
User: Analyze my requirements at /projects/task-manager/REQUIREMENTS.md

Claude: [Uses analyzeRequirements tool]

Analysis Results:
- Project Type: projectmanagement
- Complexity: intermediate
- Entities: 4 (User, Task, Category, Tag)
- Features: 5 core features identified

Validation:
✓ All required sections present
✓ Entities well-defined
⚠ Consider adding: pagination, rate limiting

Estimated: 10-12 sessions, ~35 hours
```

### Step 3: Generate Project Plan

```
User: Generate a project plan for my task manager

Claude: [Uses generateProjectPlan tool]

Generated: /projects/task-manager/PROJECT_PLAN.md
- Phase 1: Core Infrastructure (3 sessions)
- Phase 2: Feature Implementation (4 sessions)
- Phase 3: Integration & Testing (2 sessions)
- Phase 4: Polish & Documentation (2 sessions)

Total: 11 sessions, ~38 hours estimated
```

### Step 4: Setup GitHub Project

```
User: Setup GitHub integration for myusername/task-manager

Claude: [Uses setupGitHubProject tool]

GitHub Setup Complete:
✓ Created 16 labels
✓ Created 4 milestones
✓ Created 11 issues

Project URL: https://github.com/myusername/task-manager
```

### Step 5: Start Working

```
User: What should I work on first?

Claude: [Uses findNextSession - conceptually]

Next Session: Session 1 - Project Setup & Configuration
Phase: 1 - Core Infrastructure
Objectives:
- Initialize Django project
- Setup PostgreSQL database
- Configure authentication

Estimated: 3 hours
Dependencies: None
```

### Step 6: Track Progress

```
User: How's the project going?

Claude: [Uses trackProgress tool]

Progress Report:
- Completed: 5/11 sessions (45%)
- Current Phase: 2 - Feature Implementation
- Velocity: 1.2 sessions/day
- Health: On Track ✓

Estimated Completion: 5 days
```

---

## Planning a Blog App

### Requirements

```markdown
# Personal Blog

## Overview
A minimalist blog for sharing technical articles.

## Core Entities
- Post (title, slug, content, excerpt, published_at, featured_image)
- Category (name, slug, description)
- Author (name, bio, avatar)
- Comment (content, author_name, email)

## Features
- Markdown support
- Code syntax highlighting
- SEO optimization
- RSS feed
- Social sharing

## Technical Requirements
- Backend: Django
- Frontend: Vue 3 + Tailwind CSS
- Search: PostgreSQL full-text

## Complexity
Basic
```

### Generated Plan Overview

```
Phase 1: Core Infrastructure (2 sessions)
  Session 1: Django Project Setup
  Session 2: Database Models & Admin

Phase 2: Feature Implementation (3 sessions)
  Session 3: Post CRUD & Markdown
  Session 4: Categories & Authors
  Session 5: Comments & Moderation

Phase 3: Frontend (3 sessions)
  Session 6: Post List & Detail Views
  Session 7: Category & Search
  Session 8: Responsive Design

Phase 4: Polish (2 sessions)
  Session 9: SEO & RSS
  Session 10: Deployment

Total: 10 sessions, ~30 hours
```

---

## Planning an E-commerce App

### Requirements

```markdown
# Online Store

## Overview
E-commerce platform for selling handmade crafts.

## Core Entities
- Product (name, description, price, inventory, images)
- Category (name, parent_category)
- User (email, shipping_address, billing_address)
- Order (items, total, status, shipping_info)
- OrderItem (product, quantity, price)
- Cart (user, items)
- Review (product, user, rating, comment)

## Features
- Product catalog with search and filters
- Shopping cart
- Checkout with Stripe
- Order history
- Product reviews
- Inventory management

## Technical Requirements
- Backend: Django REST Framework
- Frontend: Vue 3 + Pinia
- Payments: Stripe
- Search: Elasticsearch

## Complexity
Intermediate
```

### Generated Plan Overview

```
Phase 1: Core Infrastructure (3 sessions)
  Session 1: Project Setup & Auth
  Session 2: Product & Category Models
  Session 3: User & Address Models

Phase 2: Shopping Features (4 sessions)
  Session 4: Product Catalog API
  Session 5: Cart Management
  Session 6: Checkout & Stripe
  Session 7: Order Processing

Phase 3: Frontend (4 sessions)
  Session 8: Product Listing
  Session 9: Product Detail & Cart
  Session 10: Checkout Flow
  Session 11: Order History

Phase 4: Enhancements (3 sessions)
  Session 12: Reviews & Ratings
  Session 13: Search & Filters
  Session 14: Admin Dashboard

Phase 5: Polish (2 sessions)
  Session 15: Performance
  Session 16: Deployment

Total: 16 sessions, ~55 hours
```

---

## Planning a SaaS App

### Requirements

```markdown
# Team Collaboration Tool

## Overview
Real-time collaboration platform for remote teams.

## Core Entities
- Organization (name, plan, settings)
- User (email, role, organization)
- Workspace (name, organization, members)
- Channel (name, workspace, type)
- Message (content, author, channel, attachments)
- Thread (messages, channel)
- Reaction (emoji, user, message)

## Features
- Multi-tenant architecture
- Real-time messaging
- File sharing
- Thread discussions
- Emoji reactions
- User presence
- Notifications

## Technical Requirements
- Backend: Django + Channels
- Frontend: Vue 3 + Socket.io
- Database: PostgreSQL
- Cache: Redis
- Storage: S3

## Complexity
Advanced
```

### Generated Plan Overview

```
Phase 1: Core Infrastructure (4 sessions)
  Session 1: Multi-tenant Setup
  Session 2: User & Organization Models
  Session 3: WebSocket Infrastructure
  Session 4: Redis & Caching

Phase 2: Core Features (5 sessions)
  Session 5: Workspace & Channel Models
  Session 6: Message API
  Session 7: Real-time Messaging
  Session 8: Thread Discussions
  Session 9: File Uploads

Phase 3: Enhanced Features (4 sessions)
  Session 10: Reactions & Presence
  Session 11: Notifications
  Session 12: Search
  Session 13: Permissions

Phase 4: Frontend (5 sessions)
  Session 14: Layout & Navigation
  Session 15: Channel & Messages
  Session 16: Real-time Updates
  Session 17: File Handling
  Session 18: Settings & Profile

Phase 5: Polish (3 sessions)
  Session 19: Performance
  Session 20: Security Audit
  Session 21: Deployment

Total: 21 sessions, ~80 hours
```

---

## GitHub Integration Examples

### Setting Up a New Project

```
User: Create GitHub issues for my project at myorg/analytics-dashboard

Claude: [Uses setupGitHubProject]

Creating GitHub project structure...

Labels Created (16):
- Phase: phase-1, phase-2, phase-3, phase-4, phase-5
- Domain: backend, frontend, infrastructure, e2e, mobile
- TDD: red-phase, green-phase, refactor-phase
- Status: in-progress, blocked, ready-for-review

Milestones Created (4):
- Phase 1: Core Infrastructure (Due: 2 weeks)
- Phase 2: Feature Implementation (Due: 4 weeks)
- Phase 3: Integration & Testing (Due: 5 weeks)
- Phase 4: Polish & Documentation (Due: 6 weeks)

Issues Created (12):
- #1: Session 1 - Project Setup [phase-1, backend]
- #2: Session 2 - Database Models [phase-1, backend]
- #3: Session 3 - Authentication [phase-1, backend]
...

View at: https://github.com/myorg/analytics-dashboard
```

### Checking Progress

```
User: What's the status of my analytics-dashboard project?

Claude: [Uses trackProgress]

📊 Analytics Dashboard Progress

Completion: 7/12 sessions (58%)
Current Phase: Phase 2 - Feature Implementation

Phase Breakdown:
- Phase 1: ████████████ 100% (3/3)
- Phase 2: ████████░░░░  67% (4/6)
- Phase 3: ░░░░░░░░░░░░   0% (0/2)
- Phase 4: ░░░░░░░░░░░░   0% (0/1)

Velocity: 1.5 sessions/day
Estimated Completion: 4 days

Health: ✓ On Track

Recent:
✓ Session 7 - Dashboard Charts (completed 2h ago)
→ Session 8 - Data Export (next up)
```

### Syncing State

```
User: Sync my local state with GitHub

Claude: [Uses syncWithGitHub]

Syncing /project/.agent-state.json with GitHub...

Changes:
- Session 5: GitHub shows completed, updating local
- Session 6: Local shows in-progress, updating GitHub

Summary:
✓ 2 sessions synced
✓ No conflicts
✓ State now consistent
```

---

## Intelligence Tool Examples

### Architecture Review

```
User: Review the architecture for my real-time chat app

Claude: [Uses reviewArchitecture]

🏗️ Architecture Review

Overall Score: 82/100 (Good)

✅ Patterns Identified:
- Repository pattern for data access
- Event-driven messaging
- Multi-tenant isolation

⚠️ Concerns:

Security (Medium):
- Add rate limiting to message endpoints
- Implement message content validation
- Consider end-to-end encryption

Scalability (Low):
- WebSocket connections may need horizontal scaling
- Consider message queue for async processing

Recommendations:
1. Add Redis for WebSocket session management
2. Implement message queue (Celery/RabbitMQ)
3. Add content moderation service
4. Consider read replicas for high-traffic channels
```

### Effort Estimation

```
User: Estimate effort for my e-commerce project

Claude: [Uses estimateEffort]

📊 Effort Estimation

Total Estimate: 55 hours
Range: 45-70 hours
Confidence: 75%

By Phase:
- Infrastructure: 12h (22%)
- Features: 25h (45%)
- Frontend: 15h (27%)
- Polish: 3h (6%)

Complexity Factors:
- Payment integration: +8h (Stripe)
- Search functionality: +5h (Elasticsearch)
- Multi-image uploads: +3h

Similar Projects:
- craft-marketplace: 52h actual (94% accuracy)
- vintage-store: 48h actual (87% accuracy)

Recommendations:
- Consider Stripe Checkout for faster integration
- Start with PostgreSQL full-text before Elasticsearch
```

---

## Resource Usage Examples

### Listing Templates

```
User: What project templates are available?

Claude: [Accesses template://list resource]

Available Templates:

📝 blog
   Personal or company blog with posts and categories
   Complexity: Basic
   Sessions: 8-10

🛒 ecommerce
   Online store with cart, checkout, payments
   Complexity: Intermediate
   Sessions: 14-18

💼 saas
   Multi-tenant SaaS application
   Complexity: Advanced
   Sessions: 18-25

👥 social
   Social networking features
   Complexity: Advanced
   Sessions: 20-28

📋 projectmanagement
   Task and project management
   Complexity: Intermediate
   Sessions: 12-16
```

### Getting Template Details

```
User: Show me the ecommerce template

Claude: [Accesses template://ecommerce resource]

E-commerce Template

Overview:
Full-featured online store with product catalog,
shopping cart, checkout, and order management.

Included Entities:
- Product, Category, Variant
- User, Address
- Cart, CartItem
- Order, OrderItem
- Review, Rating
- Coupon, Discount

Included Features:
- Product search and filters
- Shopping cart management
- Checkout with Stripe
- Order history and tracking
- Product reviews
- Inventory management
- Admin dashboard

Tech Stack:
- Django REST Framework
- Vue 3 + Pinia
- PostgreSQL
- Redis for cart
- Stripe for payments

Estimated:
- Sessions: 14-18
- Time: 45-60 hours
```

---

## Common Patterns

### Starting a New Session

```
User: I'm ready to start Session 5

Claude: Let me get the session details and update the status.

Session 5: Cart Management

Objectives:
- Implement cart model
- Create cart API endpoints
- Add cart item operations

🔴 RED Phase (Write tests first):
- [ ] Test cart creation
- [ ] Test add item to cart
- [ ] Test update quantity
- [ ] Test remove item
- [ ] Test clear cart

🟢 GREEN Phase:
- [ ] Create Cart model
- [ ] Create CartItem model
- [ ] Implement CartSerializer
- [ ] Create CartViewSet

🔵 REFACTOR Phase:
- [ ] Optimize database queries
- [ ] Add input validation
- [ ] Improve error messages

Exit Criteria:
- [ ] All tests passing
- [ ] Type checking passes
- [ ] Lint passes
- [ ] Code documented

Let's start with the RED phase. What testing framework are you using?
```

### Completing a Session

```
User: I've finished Session 5

Claude: Great! Let me verify and update the status.

Verification Checklist:
✓ Tests passing (12/12)
✓ Type check clean
✓ Lint clean
✓ Code documented
✓ Committed to git

[Updates GitHub issue #5 to closed]

Session 5 Complete! ✅

Next Up: Session 6 - Checkout & Stripe
Dependencies: Session 5 ✓
Estimated: 4 hours

Would you like to start Session 6?
```

---

*For API details, see [API_REFERENCE.md](API_REFERENCE.md).*
*For configuration, see [CONFIGURATION.md](CONFIGURATION.md).*
*For troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).*
