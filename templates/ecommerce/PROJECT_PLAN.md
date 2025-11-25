# Project Plan: E-Commerce Store

## Overview

A production-ready e-commerce platform with product catalog, shopping cart, checkout, order management, and customer reviews. Includes Stripe payment integration, inventory tracking, and comprehensive order fulfillment workflows. Built with TDD principles and optimized for performance.

**Complexity**: Intermediate
**Target Users**: Online retailers, merchants, small-to-medium businesses

## Technical Stack

- **Backend**: Django 5.2 + Django REST Framework + PostgreSQL
- **Frontend**: Vue 3 (Composition API) + TypeScript + Shadcn-vue + Tailwind CSS
- **Payments**: Stripe (Payment Intents API)
- **Infrastructure**: Docker + Redis + Celery
- **Storage**: Local media files (extendable to S3/CloudFlare R2)
- **Caching**: Redis (product catalog, cart sessions)

## Phases

### Phase 1: Backend Foundation - Products & Catalog (Sessions 1-4)
**Goal**: Build robust product management and catalog system

#### Session 1: Product Models + Admin (TDD)
- Create `store` Django app
- Implement Product, Category models
- Auto-slug generation for products
- Stock management methods (deduct, check low stock)
- Register models in Django admin with custom filters
- Write comprehensive model tests
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 2: Product API + Filtering (TDD)
- ProductSerializer with category relationships
- CategorySerializer
- ProductViewSet with filters (category, price range, search)
- Category endpoints
- Query optimization (select_related, prefetch_related)
- **Estimated Time**: 3.5 hours
- **Tests**: ~90 tests

#### Session 3: Cart System (TDD)
- Cart and CartItem models
- Session-based cart for anonymous users
- User-based cart for authenticated users
- Cart serializers and viewsets
- Add/update/remove cart items
- Stock validation on add-to-cart
- **Estimated Time**: 3 hours
- **Tests**: ~70 tests

#### Session 4: Inventory Management (TDD)
- Stock deduction logic (atomic operations)
- Low stock alerts
- Out-of-stock handling
- Product availability checks
- Inventory sync on order creation
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

**Phase 1 Total**: 12 hours, ~290 tests

---

### Phase 2: Backend - Orders & Payments (Sessions 5-7)
**Goal**: Implement order processing and payment integration

#### Session 5: Order Models + Workflow (TDD)
- Order and OrderItem models
- Order number generation (unique, human-readable)
- Order status workflow (pending → processing → shipped → delivered)
- Address validation (shipping, billing)
- Order total calculation
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

#### Session 6: Stripe Payment Integration (TDD)
- PaymentIntent model
- Create payment intent endpoint
- Stripe webhook handler (payment succeeded/failed)
- Payment confirmation flow
- Refund support (optional)
- **Estimated Time**: 4 hours
- **Tests**: ~70 tests

#### Session 7: Order API + Permissions (TDD)
- OrderSerializer with nested items
- Create order from cart endpoint
- List user's orders
- Order detail with tracking
- Cancel order logic (only if pending/processing)
- IsOwnerOrAdmin permission
- **Estimated Time**: 3 hours
- **Tests**: ~80 tests

**Phase 2 Total**: 10 hours, ~230 tests

---

### Phase 3: Backend - Reviews & Polish (Session 8)
**Goal**: Add customer reviews and finalize backend

#### Session 8: Review System (TDD)
- Review model (rating, title, content)
- One review per user per product constraint
- Verified purchase detection
- Review serializers and viewsets
- Helpful vote counter
- Average rating calculation
- **Estimated Time**: 2.5 hours
- **Tests**: ~60 tests

**Phase 3 Total**: 2.5 hours, ~60 tests

---

### Phase 4: Frontend Foundation (Sessions 9-11)
**Goal**: Build type-safe, tested frontend with excellent UX

#### Session 9: API Client + Product Composables (Code Generation + TDD)
- Generate TypeScript SDK from OpenAPI schema
- Create Zod validation schemas (product, cart, order)
- Set up React Query for data fetching
- `useProduct`, `useProducts` composables
- Product filtering logic
- **Estimated Time**: 2 hours
- **Tests**: ~40 tests

#### Session 10: Product UI Components (TDD)
- ProductCard (image, name, price, rating, add-to-cart)
- ProductGrid with pagination
- ProductFilters (category, price range, search)
- CategoryNav sidebar
- PriceRangeSlider
- AddToCartButton with loading states
- **Estimated Time**: 3.5 hours
- **Tests**: ~70 tests

#### Session 11: Product Views (TDD)
- ProductListView (filters, sorting, pagination)
- ProductDetailView (gallery, info, reviews)
- Product image zoom/gallery
- Related products section
- **Estimated Time**: 3 hours
- **Tests**: ~60 tests

**Phase 4 Total**: 8.5 hours, ~170 tests

---

### Phase 5: Frontend - Cart & Checkout (Sessions 12-13)
**Goal**: Implement shopping cart and checkout flow

#### Session 12: Cart UI + Composables (TDD)
- `useCart` composable (add, update, remove, clear)
- CartView page
- CartItemList component
- CartItem component (quantity selector, remove)
- CartSummary (subtotal, tax, shipping, total)
- Empty cart state
- **Estimated Time**: 3 hours
- **Tests**: ~70 tests

#### Session 13: Checkout Flow + Stripe (TDD)
- `useCheckout` composable (payment intent, confirm)
- CheckoutView with stepper (Shipping → Payment → Confirm)
- ShippingAddressForm (Zod validation)
- BillingAddressForm (copy from shipping option)
- PaymentForm with Stripe Elements integration
- OrderSummary component
- Order confirmation page
- **Estimated Time**: 4.5 hours
- **Tests**: ~80 tests

**Phase 5 Total**: 7.5 hours, ~150 tests

---

### Phase 6: Frontend - Orders & Reviews (Sessions 14-15)
**Goal**: Order history and customer reviews

#### Session 14: Orders UI (TDD)
- `useOrders` composable
- OrdersView (list of user's orders)
- OrderTable with status badges
- OrderDetailView (items, shipping, tracking)
- Order tracking display
- Cancel order button (if allowed)
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

#### Session 15: Reviews UI (TDD)
- `useReviews` composable
- ReviewForm component (rating stars, title, content)
- ReviewList component
- ReviewItem component (rating, helpful votes)
- ReviewSummary (average, distribution chart)
- Verified purchase badge
- **Estimated Time**: 2.5 hours
- **Tests**: ~50 tests

**Phase 6 Total**: 5 hours, ~100 tests

---

### Phase 7: Integration & Polish (Session 16)
**Goal**: End-to-end testing, optimization, deployment prep

#### Session 16: E2E Testing + Performance (TDD)
- E2E workflow: Browse → Add to cart → Checkout → Pay → Order confirmation
- E2E workflow: Leave review after purchase
- E2E workflow: Track order status
- Image optimization verification
- Cache hit/miss analysis
- Stripe test mode verification
- Payment webhook testing
- Type checking (0 TypeScript errors)
- Final coverage report (>85% target)
- Documentation updates
- **Estimated Time**: 3.5 hours
- **Tests**: ~40 E2E tests

**Phase 7 Total**: 3.5 hours, ~40 tests

---

## Summary

**Total Sessions**: 16
**Total Estimated Time**: 49 hours
**Total Test Count**: ~1000 tests
**Backend Coverage Target**: 90%
**Frontend Coverage Target**: 85%

## Data Models Summary

| Model         | Fields | Relationships                    | Indexes |
|---------------|--------|----------------------------------|---------|
| Product       | 15     | Category, Review, OrderItem, CartItem | 7 |
| Category      | 7      | Product (M2M), self (parent)     | 2 |
| Cart          | 6      | User, CartItem                   | 3 |
| CartItem      | 5      | Cart, Product                    | 1 |
| Order         | 18     | User, OrderItem, PaymentIntent   | 6 |
| OrderItem     | 8      | Order, Product                   | 0 |
| Review        | 10     | Product, User                    | 2 |
| PaymentIntent | 9      | Order                            | 3 |

## API Endpoints Summary

| Resource      | Endpoints | Methods                    | Permissions |
|---------------|-----------|----------------------------|-------------|
| Products      | 5         | GET, POST, PATCH, DELETE   | Public read, Admin write |
| Categories    | 2         | GET                        | Public |
| Cart          | 5         | GET, POST, PATCH, DELETE   | Owner |
| Orders        | 4         | GET, POST, DELETE (cancel) | Owner or Admin |
| Checkout      | 3         | POST                       | Authenticated |
| Reviews       | 4         | GET, POST, PATCH, DELETE   | Authenticated |

**Total Endpoints**: 23

## Frontend Components Summary

| Component Type | Count | Testing Priority |
|----------------|-------|------------------|
| Views          | 7     | High             |
| Components     | 17    | High             |
| Composables    | 6     | High             |

**Total Components**: 30

## Success Criteria

- ✅ All tests pass (>85% coverage)
- ✅ Type-safe (0 TypeScript `any`, 0 type errors)
- ✅ OpenAPI schema accurate and up-to-date
- ✅ Product images optimized (WebP, thumbnails)
- ✅ Caching working (Redis hit rate >70%)
- ✅ Stripe payment flow working (test mode)
- ✅ Webhook handling verified
- ✅ Stock deduction atomic and accurate
- ✅ Cart persists across sessions
- ✅ Order creation → payment → confirmation workflow E2E
- ✅ Inventory tracking accurate
- ✅ Reviews display with average rating
- ✅ Docker deployment working

## Testing Strategy

### Backend (pytest + coverage)
- **Models**: Field validation, relationships, custom methods (stock deduction, order totals)
- **Serializers**: Validation rules, nested serialization, stock checks
- **ViewSets**: CRUD operations, filters, payment integration
- **Permissions**: Owner-only cart, owner-only orders, admin product management
- **Stripe**: Webhook signature validation, payment status updates

**Target**: 90% coverage

### Frontend (Vitest + Vue Test Utils)
- **Components**: Rendering, props, events, Stripe Elements
- **Composables**: Data fetching, mutations, cart operations
- **Views**: Full page rendering, checkout flow
- **Schemas**: Zod validation rules (product, cart, order, address)

**Target**: 85% coverage

### E2E (Playwright - recommended)
- Complete purchase flow: Browse → Cart → Checkout → Pay → Confirmation
- Product filtering and search
- Cart persistence (anonymous → login)
- Review submission after purchase
- Order tracking

**Target**: Critical paths covered

## Performance Targets

- **Product list load**: < 2 seconds
- **Product list API**: < 250ms (with caching)
- **Product detail API**: < 350ms (with caching)
- **Add to cart**: < 300ms
- **Checkout payment intent**: < 1 second
- **Order creation**: < 2 seconds
- **Image load**: < 1 second (lazy loading)

## Security Checklist

- ✅ Stock deduction is atomic (prevent overselling)
- ✅ Payment amounts validated server-side
- ✅ Stripe webhook signature verified
- ✅ Cart isolation (users can't access others' carts)
- ✅ Order isolation (users can't access others' orders)
- ✅ Product prices immutable in OrderItem (snapshot at purchase)
- ✅ CSRF protection enabled
- ✅ SQL injection prevention (ORM parameterized queries)
- ✅ Rate limiting on cart/order operations
- ✅ Input validation on all forms

## Optional Enhancements (Post-MVP)

- [ ] Product variants (size, color) with SKU management
- [ ] Subscription products (recurring billing)
- [ ] Wishlist functionality
- [ ] Product comparison
- [ ] Coupon/discount codes
- [ ] Gift cards
- [ ] Loyalty points program
- [ ] Multi-currency support
- [ ] Real-time shipping calculator (ShipStation, EasyPost)
- [ ] Tax calculation (TaxJar, Avalara)
- [ ] Advanced search (Elasticsearch)
- [ ] Product recommendations (ML-based)
- [ ] Abandoned cart recovery emails
- [ ] Order export (CSV, PDF invoices)
- [ ] Inventory alerts (Celery tasks)
- [ ] Admin analytics dashboard

## Stripe Setup Checklist

**Development (Test Mode)**:
1. Create Stripe account: https://stripe.com
2. Get test API keys (Publishable + Secret)
3. Add to `.env`: `STRIPE_SECRET_KEY=sk_test_...`, `STRIPE_PUBLISHABLE_KEY=pk_test_...`
4. Use test card: `4242 4242 4242 4242` (any future expiry, any CVC)
5. Set webhook endpoint: `http://localhost:8000/api/store/webhooks/stripe/`
6. Get webhook signing secret: `STRIPE_WEBHOOK_SECRET=whsec_...`

**Production**:
1. Activate Stripe account (verify business info)
2. Get live API keys
3. Update `.env` with live keys
4. Set production webhook endpoint
5. Test with real card (small amount)
6. Enable 3D Secure (SCA compliance)

## Timeline

**Week 1**: Backend Foundation - Products & Catalog (Phase 1)
**Week 2**: Backend - Orders & Payments (Phase 2-3)
**Week 3**: Frontend Foundation + Cart (Phase 4-5)
**Week 4**: Frontend - Orders & Reviews + Integration (Phase 6-7)

**Total Duration**: 4 weeks (part-time) or 2.5 weeks (full-time)

---

**Ready to start building?** Follow the detailed session tasks and ensure Stripe is configured before Session 6.
