# E-Commerce Store Template

Production-ready e-commerce platform template with products, shopping cart, checkout, and order management.

## What's Included

**Core Features**:
- ✅ Product catalog with search and filtering
- ✅ Shopping cart with persistence
- ✅ Checkout flow with payment integration
- ✅ Order management and tracking
- ✅ Product reviews and ratings
- ✅ Inventory tracking
- ✅ Basic admin dashboard

**Technical Features**:
- ✅ Stripe payment integration
- ✅ Product image optimization
- ✅ Real-time inventory updates
- ✅ Order status notifications (email)
- ✅ Cart abandonment tracking
- ✅ Redis caching for product catalog

## Customization Options

When using this template, you'll be asked:

### 1. Product Variants?
**Default**: No

- **No**: Simple products (single price, no options)
- **Yes**: Product variants (size, color, etc.) with SKU management
- **Impact**: +2 sessions, +60 tests, +5 hours

### 2. Inventory Tracking?
**Default**: Yes

- **Yes**: Track stock levels, low-stock alerts, out-of-stock handling
- **No**: Unlimited inventory (simpler, faster)
- **Impact**: No (0 sessions, 0 tests, 0 hours)

### 3. Subscriptions?
**Default**: No

- **No**: One-time purchases only
- **Yes**: Recurring subscriptions with Stripe Subscriptions
- **Impact**: +3 sessions, +70 tests, +7 hours

### 4. Reviews/Ratings?
**Default**: Yes

- **Yes**: Customer reviews with star ratings, helpful votes
- **No**: No reviews (faster to build)
- **Impact**: -1 session, -30 tests, -2 hours

## Complexity Variants

### Basic (Minimal Store)
**Config**: No variants, Yes inventory, No subscriptions, No reviews
- **Sessions**: 12
- **Time**: 35 hours
- **Tests**: ~650

### Intermediate (Recommended - Default)
**Config**: No variants, Yes inventory, No subscriptions, Yes reviews
- **Sessions**: 13
- **Time**: 38 hours
- **Tests**: ~700

### Advanced (Full E-Commerce)
**Config**: Yes variants, Yes inventory, Yes subscriptions, Yes reviews
- **Sessions**: 18
- **Time**: 52 hours
- **Tests**: ~850

## Mobile Support

### Recommended Mobile Features (Selective)

**Include**:
- ✅ Browse products
- ✅ Search and filter
- ✅ Add to cart
- ✅ Checkout (with Apple Pay / Google Pay)
- ✅ View orders
- ✅ Track shipments

**Exclude**:
- ❌ Admin dashboard (use web)
- ❌ Inventory management (use web)
- ❌ Bulk product upload (use web)
- ❌ Analytics (use web)

**Mobile-Specific**:
- ✅ Push notifications (order updates, shipping alerts)
- ✅ Biometric checkout (Face ID / Touch ID)
- ✅ Offline cart (save cart even when offline)
- ✅ Camera (scan barcodes for product search)
- ✅ Geolocation (find nearby stores - optional)

## Payment Integration

**Included by Default**: Stripe

**Supported Payment Methods**:
- Credit/Debit cards (Stripe Elements)
- Apple Pay (mobile)
- Google Pay (mobile)
- ACH transfers (optional)

**Optional Add-ons** (post-template):
- PayPal integration
- Cryptocurrency payments
- Buy Now Pay Later (Klarna, Afterpay)

## Models Summary

| Model | Description | Relationships |
|-------|-------------|--------------|
| Product | Product details, pricing, images | Category, Reviews |
| ProductVariant | Size, color, SKU (if variants enabled) | Product |
| Category | Product categorization | Product (M2M) |
| Cart | Shopping cart | User, CartItem |
| CartItem | Items in cart | Cart, Product |
| Order | Customer orders | User, OrderItem |
| OrderItem | Products in order | Order, Product |
| Review | Product reviews (if enabled) | Product, User |
| PaymentIntent | Stripe payment tracking | Order |

## API Endpoints Summary

**Products**: 8 endpoints (list, detail, search, filter, reviews)
**Cart**: 5 endpoints (get, add, update, remove, clear)
**Orders**: 6 endpoints (create, list, detail, cancel, track)
**Checkout**: 3 endpoints (create intent, confirm, webhook)

**Total**: ~22 endpoints

## Example Use Cases

### Example 1: Simple Online Store
**Use Case**: Sell handmade items, no complicated options

**Config**:
- Product Variants: No
- Inventory Tracking: Yes
- Subscriptions: No
- Reviews: No

**Result**: 12 sessions, 35 hours, clean and simple

---

### Example 2: Fashion Boutique
**Use Case**: Clothing with sizes and colors

**Config**:
- Product Variants: Yes (size, color)
- Inventory Tracking: Yes
- Subscriptions: No
- Reviews: Yes

**Result**: 17 sessions, 48 hours, full product options

---

### Example 3: Subscription Box Service
**Use Case**: Monthly subscription boxes

**Config**:
- Product Variants: No
- Inventory Tracking: Yes
- Subscriptions: Yes
- Reviews: Yes

**Result**: 16 sessions, 45 hours, recurring revenue model

## Post-Template Enhancements

After generating, you can add:

1. **Wishlist**: Save products for later
2. **Compare products**: Side-by-side comparison
3. **Coupons/Discounts**: Promo codes, percentage/fixed discounts
4. **Loyalty program**: Points, rewards
5. **Gift cards**: Purchase and redeem
6. **Multi-currency**: International pricing
7. **Shipping calculator**: Real-time shipping rates
8. **Tax calculation**: Automated tax (TaxJar, Avalara)
9. **Advanced search**: Elasticsearch, filters, facets
10. **Recommendations**: "You may also like" using ML

## Getting Started

1. Run `/plan-app` in Claude Code
2. Select "E-Commerce Store" template
3. Answer customization questions
4. Set up Stripe account (get API keys)
5. Review generated plans
6. Approve and start building!

## Required External Services

**Stripe Account** (required):
- Sign up at https://stripe.com
- Get test API keys for development
- Get production API keys for deployment

**Email Service** (recommended):
- SendGrid, Mailgun, or similar
- For order confirmation emails, shipping notifications

**File Storage** (optional):
- AWS S3, CloudFlare R2, or local storage
- For product images

## Support

See the main planning guide: `.claude/PLANNING_GUIDE.md`
