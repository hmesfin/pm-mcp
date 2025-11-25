# E-Commerce Store - Technical Requirements

**Generated from**: E-Commerce Store Template
**Complexity**: Intermediate
**Features**: Products, Cart, Checkout, Orders, Reviews, Inventory, Payments

---

## Data Models

### Product Model

**File**: `backend/apps/store/models/product.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed) - For public API exposure
- `name` (CharField, max_length=200, required)
- `slug` (SlugField, max_length=220, unique, auto-generated from name)
- `description` (TextField, required)
- `short_description` (CharField, max_length=300, optional) - For cards/lists
- `price` (DecimalField, max_digits=10, decimal_places=2, required) - In cents
- `compare_at_price` (DecimalField, max_digits=10, decimal_places=2, optional) - Original price for discounts
- `sku` (CharField, max_length=100, unique, required) - Stock Keeping Unit
- `stock_quantity` (PositiveIntegerField, default=0) - Current inventory
- `low_stock_threshold` (PositiveIntegerField, default=10) - Alert threshold
- `is_active` (BooleanField, default=True) - Soft delete
- `featured_image` (ImageField, upload_to='products/images/', optional)
- `weight` (DecimalField, max_digits=8, decimal_places=2, optional) - For shipping (in grams)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Categories: Many-to-Many with Category
- Reviews: One-to-Many with Review
- OrderItems: One-to-Many with OrderItem
- CartItems: One-to-Many with CartItem

**Indexes**:

- `uuid` (unique)
- `slug` (unique)
- `sku` (unique)
- `is_active` (for filtering)
- `price` (for sorting)
- Composite: `['is_active', 'created_at']` (for active products query)

**Validation**:

- Name: Required, max 200 chars
- Slug: Auto-generated from name, unique
- Price: Required, >= 0
- SKU: Required, unique, alphanumeric
- Stock quantity: >= 0
- Featured_image: Max 5MB, formats: jpg, png, webp

**Custom Methods**:

- `save()`: Auto-generate slug from name if not provided
- `is_in_stock()`: Returns True if stock_quantity > 0
- `is_low_stock()`: Returns True if stock_quantity <= low_stock_threshold
- `deduct_stock(quantity)`: Atomic stock deduction with validation
- `get_discount_percentage()`: Calculate percentage if compare_at_price exists

---

### Category Model

**File**: `backend/apps/store/models/category.py`

**Fields**:

- `id` (AutoField, primary key)
- `name` (CharField, max_length=100, unique)
- `slug` (SlugField, max_length=110, unique)
- `description` (TextField, optional)
- `parent` (ForeignKey to self, null=True, blank=True, related_name='children') - For nested categories
- `image` (ImageField, upload_to='categories/images/', optional)
- `is_active` (BooleanField, default=True)
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Products: Many-to-Many with Product
- Parent: Self-referential for nested categories

**Indexes**:

- `slug` (unique)
- `name` (unique)

**Validation**:

- Name: Required, unique, max 100 chars
- Slug: Auto-generated from name, unique

---

### Cart Model

**File**: `backend/apps/store/models/cart.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `user` (ForeignKey to User, on_delete=CASCADE, null=True, blank=True, related_name='carts')
- `session_id` (CharField, max_length=100, indexed, null=True) - For anonymous users
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- User: Many-to-One with User (optional, for authenticated)
- Items: One-to-Many with CartItem

**Indexes**:

- `uuid` (unique)
- `user` (for user's cart lookup)
- `session_id` (for anonymous cart lookup)

**Validation**:

- Must have either user OR session_id (not both, not neither)

**Custom Methods**:

- `get_total()`: Calculate sum of all item subtotals
- `get_item_count()`: Total quantity of all items
- `clear()`: Remove all items

---

### CartItem Model

**File**: `backend/apps/store/models/cart_item.py`

**Fields**:

- `id` (AutoField, primary key)
- `cart` (ForeignKey to Cart, on_delete=CASCADE, related_name='items')
- `product` (ForeignKey to Product, on_delete=CASCADE, related_name='cart_items')
- `quantity` (PositiveIntegerField, default=1)
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Cart: Many-to-One with Cart
- Product: Many-to-One with Product

**Indexes**:

- Composite: `['cart', 'product']` (unique together)

**Validation**:

- Quantity: Required, > 0, <= product.stock_quantity

**Custom Methods**:

- `get_subtotal()`: quantity * product.price

---

### Order Model

**File**: `backend/apps/store/models/order.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `order_number` (CharField, max_length=50, unique, auto-generated) - Human-readable (e.g., ORD-2024-00001)
- `user` (ForeignKey to User, on_delete=CASCADE, related_name='orders')
- `status` (CharField, choices=['pending', 'processing', 'shipped', 'delivered', 'cancelled'], default='pending')
- `payment_status` (CharField, choices=['pending', 'paid', 'failed', 'refunded'], default='pending')
- `subtotal` (DecimalField, max_digits=10, decimal_places=2) - Sum of items
- `tax` (DecimalField, max_digits=10, decimal_places=2, default=0)
- `shipping_cost` (DecimalField, max_digits=10, decimal_places=2, default=0)
- `total` (DecimalField, max_digits=10, decimal_places=2) - subtotal + tax + shipping
- `shipping_address` (JSONField) - Full address object
- `billing_address` (JSONField) - Full address object (can be same as shipping)
- `customer_email` (EmailField) - For order confirmation
- `customer_phone` (CharField, max_length=20, optional)
- `notes` (TextField, optional) - Customer notes
- `tracking_number` (CharField, max_length=100, optional) - Shipment tracking
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- User: Many-to-One with User
- Items: One-to-Many with OrderItem
- Payment: One-to-One with PaymentIntent

**Indexes**:

- `uuid` (unique)
- `order_number` (unique)
- `user` (for user's orders)
- `status` (for filtering)
- `created_at` (for sorting)

**Validation**:

- Subtotal: Required, >= 0
- Total: Required, >= subtotal
- Shipping address: Required, validate JSON structure
- Email: Valid email format

**Custom Methods**:

- `generate_order_number()`: Auto-generate unique order number
- `calculate_total()`: subtotal + tax + shipping_cost
- `can_cancel()`: Returns True if status is 'pending' or 'processing'
- `mark_as_shipped(tracking_number)`: Update status + tracking

---

### OrderItem Model

**File**: `backend/apps/store/models/order_item.py`

**Fields**:

- `id` (AutoField, primary key)
- `order` (ForeignKey to Order, on_delete=CASCADE, related_name='items')
- `product` (ForeignKey to Product, on_delete=PROTECT, related_name='order_items')
- `product_name` (CharField, max_length=200) - Snapshot at purchase time
- `product_sku` (CharField, max_length=100) - Snapshot at purchase time
- `price` (DecimalField, max_digits=10, decimal_places=2) - Price at purchase time
- `quantity` (PositiveIntegerField)
- `subtotal` (DecimalField, max_digits=10, decimal_places=2) - price * quantity
- `created_at` (DateTimeField, auto_now_add=True)

**Relationships**:

- Order: Many-to-One with Order
- Product: Many-to-One with Product (PROTECT to preserve historical data)

**Validation**:

- Quantity: Required, > 0
- Subtotal: Must equal price * quantity

**Custom Methods**:

- `save()`: Auto-calculate subtotal, snapshot product data

---

### Review Model

**File**: `backend/apps/store/models/review.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `product` (ForeignKey to Product, on_delete=CASCADE, related_name='reviews')
- `user` (ForeignKey to User, on_delete=CASCADE, related_name='reviews')
- `rating` (PositiveIntegerField, choices=[1, 2, 3, 4, 5]) - Star rating
- `title` (CharField, max_length=200, optional)
- `content` (TextField, required)
- `is_verified_purchase` (BooleanField, default=False) - Did user actually buy this?
- `is_approved` (BooleanField, default=True) - Moderation flag
- `helpful_count` (PositiveIntegerField, default=0) - "Was this helpful?" votes
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Product: Many-to-One with Product
- User: Many-to-One with User

**Indexes**:

- `uuid` (unique)
- `product` (for product's reviews)
- Composite: `['product', 'user']` (unique together - one review per user per product)

**Validation**:

- Rating: Required, must be 1-5
- Content: Required, min 10 chars, max 2000 chars

**Custom Methods**:

- `mark_verified_purchase()`: Check if user bought this product

---

### PaymentIntent Model

**File**: `backend/apps/store/models/payment_intent.py`

**Fields**:

- `id` (AutoField, primary key)
- `uuid` (UUIDField, unique, default=uuid4, indexed)
- `order` (OneToOneField to Order, on_delete=CASCADE, related_name='payment')
- `stripe_payment_intent_id` (CharField, max_length=200, unique)
- `amount` (DecimalField, max_digits=10, decimal_places=2) - In cents
- `currency` (CharField, max_length=3, default='usd')
- `status` (CharField, choices=['requires_payment_method', 'requires_confirmation', 'succeeded', 'canceled'], default='requires_payment_method')
- `client_secret` (CharField, max_length=500) - For frontend Stripe.js
- `metadata` (JSONField, default=dict) - Additional Stripe metadata
- `created_at` (DateTimeField, auto_now_add=True)
- `updated_at` (DateTimeField, auto_now=True)

**Relationships**:

- Order: One-to-One with Order

**Indexes**:

- `uuid` (unique)
- `stripe_payment_intent_id` (unique)
- `order` (unique)

**Validation**:

- Amount: Required, > 0
- Currency: Required, 3-letter code
- Stripe payment intent ID: Required, unique

---

## API Endpoints

### Products Endpoints

**Base URL**: `/api/store/`

#### List/Create Products

- **GET** `/api/store/products/` - List active products (public)
  - Query params: `?category={slug}`, `?search={query}`, `?min_price={value}`, `?max_price={value}`, `?ordering=-created_at`
  - Permissions: AllowAny
  - Response: Paginated list (20 per page)

- **POST** `/api/store/products/` - Create new product (admin only)
  - Permissions: IsAdminUser
  - Request body: `{ name, description, price, sku, stock_quantity, category_ids[], ... }`
  - Response: 201 Created

#### Retrieve/Update/Delete Product

- **GET** `/api/store/products/{uuid}/` - Get product details
  - Permissions: AllowAny
  - Response: Full product with reviews

- **PATCH** `/api/store/products/{uuid}/` - Update product
  - Permissions: IsAdminUser
  - Request body: Partial update
  - Response: 200 OK

- **DELETE** `/api/store/products/{uuid}/` - Delete product
  - Permissions: IsAdminUser
  - Response: 204 No Content

### Cart Endpoints

- **GET** `/api/store/cart/` - Get current user's cart
  - Permissions: AllowAny (session-based for anonymous)
  - Response: Cart with items

- **POST** `/api/store/cart/items/` - Add item to cart
  - Permissions: AllowAny
  - Request body: `{ product_uuid, quantity }`
  - Response: 201 Created

- **PATCH** `/api/store/cart/items/{id}/` - Update cart item quantity
  - Permissions: Owner
  - Request body: `{ quantity }`
  - Response: 200 OK

- **DELETE** `/api/store/cart/items/{id}/` - Remove item from cart
  - Permissions: Owner
  - Response: 204 No Content

- **POST** `/api/store/cart/clear/` - Clear all cart items
  - Permissions: Owner
  - Response: 200 OK

### Orders Endpoints

- **GET** `/api/store/orders/` - List user's orders
  - Permissions: IsAuthenticated
  - Response: Paginated list

- **POST** `/api/store/orders/` - Create order from cart
  - Permissions: IsAuthenticated
  - Request body: `{ shipping_address, billing_address, customer_email, customer_phone?, notes? }`
  - Response: 201 Created

- **GET** `/api/store/orders/{uuid}/` - Get order details
  - Permissions: IsOwner or IsAdmin
  - Response: Full order with items

- **POST** `/api/store/orders/{uuid}/cancel/` - Cancel order
  - Permissions: IsOwner (if pending/processing)
  - Response: 200 OK

### Checkout/Payment Endpoints

- **POST** `/api/store/checkout/create-payment-intent/` - Create Stripe PaymentIntent
  - Permissions: IsAuthenticated
  - Request body: `{ order_uuid }`
  - Response: `{ client_secret, amount, ... }`

- **POST** `/api/store/checkout/confirm-payment/` - Confirm payment success
  - Permissions: IsAuthenticated
  - Request body: `{ payment_intent_id }`
  - Response: 200 OK (update order payment_status)

- **POST** `/api/store/webhooks/stripe/` - Stripe webhook handler
  - Permissions: AllowAny (validate Stripe signature)
  - Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Reviews Endpoints

- **GET** `/api/store/products/{product_uuid}/reviews/` - List product reviews
  - Permissions: AllowAny
  - Response: Paginated list (20 per page)

- **POST** `/api/store/products/{product_uuid}/reviews/` - Create review
  - Permissions: IsAuthenticated
  - Request body: `{ rating, title?, content }`
  - Response: 201 Created

- **PATCH** `/api/store/reviews/{uuid}/` - Update review
  - Permissions: IsAuthor (within 7 days)
  - Request body: `{ rating, title, content }`
  - Response: 200 OK

- **DELETE** `/api/store/reviews/{uuid}/` - Delete review
  - Permissions: IsAuthor or IsAdmin
  - Response: 204 No Content

---

## Frontend Components

### Component Hierarchy

```
ProductListView
├── ProductFilters (categories, price range, search)
├── ProductGrid
│   ├── ProductCard (image, name, price, rating, add-to-cart)
│   │   ├── CategoryBadge
│   │   └── AddToCartButton
│   └── Pagination
└── Sidebar
    ├── CategoryNav
    └── PriceRangeSlider

ProductDetailView
├── ProductGallery (featured image, zoom)
├── ProductInfo (name, price, description, SKU)
├── ProductActions (add-to-cart, quantity selector)
├── ProductTabs
│   ├── DescriptionTab
│   └── ReviewsTab
│       ├── ReviewSummary (avg rating, rating distribution)
│       ├── ReviewForm (if purchased)
│       └── ReviewList
│           └── ReviewItem (rating, title, content, helpful votes)
└── RelatedProducts

CartView
├── CartItemList
│   └── CartItem (image, name, price, quantity, remove)
├── CartSummary (subtotal, tax, shipping, total)
└── CheckoutButton

CheckoutView
├── CheckoutStepper (Shipping → Payment → Confirm)
├── ShippingAddressForm
├── BillingAddressForm
├── PaymentForm (Stripe Elements)
└── OrderSummary

OrdersView
└── OrderTable
    ├── OrderRow (order number, date, status, total)
    └── OrderActions (view, track, cancel)

OrderDetailView
├── OrderHeader (order number, date, status)
├── OrderItemList
│   └── OrderItem (product, quantity, price, subtotal)
├── OrderSummary (subtotal, tax, shipping, total)
├── ShippingInfo (address, tracking)
└── OrderActions (cancel, contact support)
```

### Key Composables

**`useProduct.ts`**:

```typescript
export const useProduct = (uuid: string) => {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', uuid],
    queryFn: () => apiClient.store.productsRetrieve({ path: { uuid } })
  })

  return { product, isLoading }
}
```

**`useProducts.ts`**:

```typescript
export const useProducts = (filters?: ProductFilters) => {
  const { data, isLoading, fetchNextPage } = useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 1 }) => apiClient.store.productsList({
      query: { ...filters, page: pageParam }
    })
  })

  return { products: data?.pages.flatMap(p => p.results), isLoading, fetchNextPage }
}
```

**`useCart.ts`**:

```typescript
export const useCart = () => {
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.store.cartRetrieve()
  })

  const addItem = useMutation({
    mutationFn: (data: AddToCartData) =>
      apiClient.store.cartItemsCreate({ body: data }),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  })

  const updateItem = useMutation({
    mutationFn: ({ id, quantity }: UpdateCartItemData) =>
      apiClient.store.cartItemsPartialUpdate({ path: { id }, body: { quantity } }),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  })

  const removeItem = useMutation({
    mutationFn: (id: number) =>
      apiClient.store.cartItemsDestroy({ path: { id } }),
    onSuccess: () => queryClient.invalidateQueries(['cart'])
  })

  return { cart, addItem, updateItem, removeItem }
}
```

**`useCheckout.ts`**:

```typescript
export const useCheckout = () => {
  const createPaymentIntent = useMutation({
    mutationFn: (orderUuid: string) =>
      apiClient.store.checkoutCreatePaymentIntentCreate({ body: { order_uuid: orderUuid } })
  })

  const confirmPayment = useMutation({
    mutationFn: (paymentIntentId: string) =>
      apiClient.store.checkoutConfirmPaymentCreate({ body: { payment_intent_id: paymentIntentId } })
  })

  return { createPaymentIntent, confirmPayment }
}
```

---

## Validation Rules

### Product Validation (Backend + Frontend)

**Backend** (`apps/store/serializers/product.py`):

```python
class ProductSerializer(serializers.ModelSerializer):
    def validate_price(self, value):
        if value <= 0:
            raise ValidationError("Price must be greater than 0")
        return value

    def validate_sku(self, value):
        if not value.replace('-', '').isalnum():
            raise ValidationError("SKU must be alphanumeric")
        return value

    def validate_stock_quantity(self, value):
        if value < 0:
            raise ValidationError("Stock quantity cannot be negative")
        return value
```

**Frontend Zod Schema** (`frontend/src/schemas/product.ts`):

```typescript
export const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be greater than 0"),
  sku: z.string().regex(/^[A-Za-z0-9-]+$/, "SKU must be alphanumeric"),
  stock_quantity: z.number().int().nonnegative("Stock cannot be negative"),
  category_ids: z.array(z.number()).min(1, "Select at least one category")
})

export type ProductFormData = z.infer<typeof productSchema>
```

### Cart Item Validation

**Backend**:

```python
class CartItemSerializer(serializers.ModelSerializer):
    def validate_quantity(self, value):
        if value <= 0:
            raise ValidationError("Quantity must be at least 1")
        return value

    def validate(self, attrs):
        product = attrs.get('product')
        quantity = attrs.get('quantity')
        if quantity > product.stock_quantity:
            raise ValidationError(f"Only {product.stock_quantity} units available")
        return attrs
```

**Frontend Zod Schema**:

```typescript
export const cartItemSchema = z.object({
  product_uuid: z.string().uuid(),
  quantity: z.number().int().positive("Quantity must be at least 1")
})
```

### Order Validation

**Backend**:

```python
class OrderSerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        # Validate shipping address structure
        shipping_address = attrs.get('shipping_address')
        required_fields = ['address_line1', 'city', 'state', 'postal_code', 'country']
        for field in required_fields:
            if field not in shipping_address:
                raise ValidationError(f"Shipping address missing: {field}")
        return attrs
```

**Frontend Zod Schema**:

```typescript
export const addressSchema = z.object({
  address_line1: z.string().min(1, "Address is required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(2, "State is required"),
  postal_code: z.string().min(5, "Postal code is required"),
  country: z.string().min(2, "Country is required")
})

export const orderSchema = z.object({
  shipping_address: addressSchema,
  billing_address: addressSchema,
  customer_email: z.string().email("Valid email required"),
  customer_phone: z.string().optional(),
  notes: z.string().max(500).optional()
})
```

---

## Test Coverage Requirements

### Backend Tests

**Models** (`apps/store/tests/test_models.py`):

- Product model creation and validation
- Stock deduction (atomic, validates quantity)
- Low stock detection
- Cart total calculation
- Order number generation (unique)
- Review rating validation (1-5)

**Serializers** (`apps/store/tests/test_serializers.py`):

- Product serializer validation
- Cart item stock validation
- Order address validation
- Review one-per-user-per-product constraint

**ViewSets** (`apps/store/tests/test_viewsets.py`):

- List products with filters
- Add to cart (authenticated + anonymous)
- Update cart item quantity
- Create order from cart
- Stripe payment intent creation
- Webhook signature validation

**Permissions** (`apps/store/tests/test_permissions.py`):

- Only admin can create products
- Only owner can view their cart
- Only owner can cancel their order
- Only verified purchasers can review

**Minimum Coverage**: 90% (critical e-commerce operations)

### Frontend Tests

**Components** (`frontend/src/components/store/*.test.ts`):

- ProductCard renders correctly
- AddToCartButton updates cart
- CartItem quantity selector
- CheckoutForm validation
- PaymentForm Stripe integration

**Composables** (`frontend/src/composables/*.test.ts`):

- useProducts fetches with filters
- useCart CRUD operations
- useCheckout payment flow

**Views** (`frontend/src/views/store/*.test.ts`):

- ProductListView filters work
- CartView calculates totals
- CheckoutView stepper navigation

**Minimum Coverage**: 85%

---

## Performance Considerations

### Database Optimizations

- Use `select_related('category')` for product queries
- Use `prefetch_related('reviews', 'cart_items')` for detail views
- Index on `price`, `stock_quantity` for filtering/sorting
- Composite index on `['is_active', 'created_at']`

### Caching Strategy

- Cache product list: 10 minutes
- Cache product detail: 15 minutes (invalidate on update)
- Cache categories: 1 hour
- Use Redis for cart storage (fast access)

### Image Optimization

- Generate product image thumbnails (small, medium, large)
- Use WebP format
- Lazy load product images
- CDN for product images (recommended)

---

## Security Considerations

### Permissions

- Only admins can create/update/delete products
- Users can only view their own cart
- Users can only view/cancel their own orders
- Payment webhooks validate Stripe signature

### Input Sanitization

- Validate SKU format (alphanumeric)
- Validate stock quantity (non-negative)
- Sanitize product descriptions
- Validate payment amounts match order total

### Rate Limiting

- Product creation: Admin only, no limit
- Add to cart: 100 per hour per IP
- Order creation: 10 per hour per user
- Review creation: 5 per day per user

---

## Estimated Complexity

**Models**: 8 (Product, Category, Cart, CartItem, Order, OrderItem, Review, PaymentIntent)
**API Endpoints**: 22
**Frontend Components**: 24
**Estimated Sessions**: 13
**Estimated Time**: 38 hours
**Test Count**: ~700 tests
