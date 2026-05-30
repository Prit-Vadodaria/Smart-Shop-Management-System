# project-context.md
# Smart Shop Management System — Complete Project Knowledge Base

> **Last Updated:** 2026-05-24
> **Version:** 1.0.0
> **Purpose:** This document is the single source of truth for every AI agent, engineer, or contributor onboarding to this project. Read this file completely before touching any code.

---

## PROJECT OVERVIEW

### Project Name
**Smart Shop Management System**

### Purpose
A full-stack, production-ready web application for managing a retail/grocery shop. It consolidates POS billing, inventory tracking, customer self-service, subscription-based auto-delivery, supplier management, payment recording, and business reporting into a single unified platform.

### Problem Being Solved
Small and mid-sized retail shops currently operate across fragmented tools: manual billing books, WhatsApp order lists, spreadsheet inventory trackers, and verbal subscription records. This system replaces all of them with:
- A digital POS terminal
- A customer-facing self-service portal for orders and subscriptions
- A back-office for staff, managers, and admins to manage every operational aspect
- An automatic daily order engine for recurring deliveries

### Target Users
| Role | Description |
|---|---|
| **Admin** | Full system access. Owner or senior manager. Controls all settings, users, and reports. |
| **Manager (Employee)** | Operational access. Manages products, orders, deliveries. Cannot modify system settings or user accounts. |
| **Staff (Employee)** | Sales-level access. Handles POS billing, manages assigned deliveries, limited inventory view. |
| **Customer** | Portal-only access. Places orders, manages their subscriptions, views wallet and order history. |

### Business Goals
- Eliminate manual billing and subscription tracking errors
- Automate daily delivery order generation via a scheduled engine
- Provide customers with a self-service portal to control their own orders and subscriptions
- Deliver real-time PnL, sales, and inventory reports to management

### Core Features
1. JWT-authenticated RBAC (4-tier role system: admin / employee[manager|staff] / customer)
2. Customer self-service portal — orders, subscriptions, wallet view, address book
3. Product catalog with GST, stock thresholds, brand/category filtering, subscription eligibility flags
4. Real-time inventory tracking with auto-deduction on every sale/order/subscription fulfillment
5. POS billing terminal — multi-item, split-payment (Cash + UPI), invoice generation
6. Auto-delivery / Subscription engine — daily, alternate-day, custom-date scheduling with vacation mode and date skipping
7. Delivery management — run-sheets, status updates (Pending → Packed → Out for Delivery → Delivered/Failed)
8. Supplier management — supplier profiles, purchase orders, stock-in on receipt
9. Payment ledger — Cash, UPI, Cash+UPI split, tied to invoices and subscription billing
10. Reports — daily/monthly sales, PnL, inventory valuation, subscription revenue
11. Email notifications — low stock, order confirmation, payment reminders, delivery failure alerts
12. System settings — global GST rates, minimum order value, store configuration

### Non-Goals
- Native mobile app (no React Native / Flutter — web-only)
- External payment gateway integration (Razorpay, Stripe) — currently internal transaction ID recording only
- Multi-store / multi-branch support
- Customer-facing loyalty/points system (wallet is admin-credited only)
- AI/ML features — no recommendation engine, no demand forecasting

---

## SYSTEM ARCHITECTURE

### High-Level Architecture
```
[Customer Browser]
       │
       ▼
[React 19 + Vite Frontend] ──HTTP/JSON──► [Express.js REST API]
                                                  │
                              ┌───────────────────┼───────────────────┐
                              ▼                   ▼                   ▼
                        [MongoDB]          [Local FS]          [Nodemailer]
                    (Primary Data Store)  (Image Uploads)    (Email Alerts)
```

### Application Tiers
- **Frontend**: React 19 SPA, built by Vite 8, styled with Tailwind CSS v4, served as static files
- **Backend**: Node.js + Express.js REST API using ES Modules (`"type": "module"`)
- **Database**: MongoDB (local dev: `mongodb://localhost:27017/shop-management`, production: MongoDB Atlas)
- **File Storage**: Multer → local `backend/uploads/` directory (served statically at `/uploads`)
- **Email**: Nodemailer SMTP (configured but not yet fully wired in notifications module)

### Module Architecture (Backend — Vertical Slice)
The backend uses a **vertical feature-slice structure** under `backend/modules/`. Each module owns its `models/`, `controllers/`, and `routes/`.

```
backend/modules/
  ├── auth/          → User identity, JWT sessions, role management
  ├── customers/     → CustomerProfile, wallet, addresses
  ├── products/      → Product catalog, inventory, stock thresholds
  ├── billing/       → Orders (POS + customer), Payments
  ├── subscriptions/ → Recurring schedules, auto-order engine
  ├── suppliers/     → Supplier profiles, purchase orders
  ├── notifications/ → Email alerts, in-app notification store
  └── settings/      → Global store config (GST, min order value)
```

### Data Flow — POS Sale
```
Staff creates bill in POS UI
  → POST /api/orders (with items[], paymentMethod, orderType)
  → Backend validates stock availability per product
  → Order document created (status: 'Pending')
  → Stock auto-deducted per orderItem.quantity
  → Payment record linked to Order (Payment.orderId)
  → Order marked isPaid=true
  → Invoice returned to frontend (optionally PDF)
```

### Data Flow — Subscription Auto-Order Engine
```
Daily cron trigger (scheduled or manual via POST /api/subscriptions/trigger-scheduler)
  → Fetch all Subscription documents with status='Active'
  → Skip if today is in vacationMode date range
  → Skip if today is in customDates skip list
  → Check frequency (Daily / Alternate / Monthly-custom-dates)
  → For each matching subscription: generate Order document
  → Deduct stock per subscription item
  → Assign to delivery run-sheet
  → Update subscription.lastRunAt timestamp
  → Trigger notification (order confirmation email)
```

### External Integrations
| Integration | Purpose | Status |
|---|---|---|
| MongoDB Atlas | Production database | Configured via `MONGO_URI` env var |
| Nodemailer SMTP | Transactional email alerts | Wired in notifications module, not fully implemented |
| Multer (local FS) | Product image uploads | Active — files stored in `backend/uploads/` |
| AWS S3 / Cloudinary | Cloud file storage | **TODO: Future improvement — replaces local FS** |

---

## TECH STACK

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| React Router DOM | 7.13.1 | Client-side routing |
| Vite | 8.0.0 | Build tool & dev server |
| Tailwind CSS | 4.2.2 | Utility-first styling |
| Axios | 1.13.6 | HTTP client (with token interceptor) |
| Lucide React | 0.577.0 | Icon library |
| PostCSS + Autoprefixer | — | CSS processing |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | v18+ (v20 recommended) | Runtime |
| Express.js | 4.19.2 | HTTP framework |
| Mongoose | 8.3.2 | MongoDB ODM |
| jsonwebtoken | 9.0.2 | JWT generation & verification |
| bcryptjs | 2.4.3 | Password hashing (salt rounds: 10) |
| multer | 2.1.1 | Multipart file upload handling |
| morgan | 1.10.0 | HTTP request logger (dev only) |
| dotenv | 16.4.5 | Environment variable loading |
| cors | 2.8.5 | Cross-Origin Resource Sharing |
| nodemon | 3.1.0 | Dev hot-reload |

### Database
| Technology | Details |
|---|---|
| MongoDB | Primary data store |
| Mongoose ODM | Schema enforcement, middleware hooks, index management |
| Local URI (dev) | `mongodb://localhost:27017/shop-management` |
| Atlas URI (prod) | Via `MONGO_URI` environment variable |

### Authentication
- **Strategy**: Stateless JWT (Bearer token in `Authorization` header)
- **Token lifetime**: 30 days (`JWT_EXPIRE=30d`)
- **Storage**: Frontend stores `userInfo` (including token) in `localStorage`
- **Password hashing**: bcryptjs, salt rounds = 10, applied via Mongoose `pre('save')` hook

### No External Services Currently Active
- No Redis caching
- No message queues (BullMQ, RabbitMQ)
- No observability platform (no Datadog, Sentry, or OpenTelemetry)
- No CDN
- **TODO**: All of the above are listed as future improvements in `refactoring_and_migration_plan.md`

---

## FOLDER STRUCTURE

### Root
```
Smart-Shop-Management-System/
  ├── backend/                   # Node.js Express REST API
  ├── frontend/                  # React + Vite SPA
  ├── PROJECT_FEATURES.md        # Full business feature specification
```

### Backend (`backend/`)
```
backend/
  ├── config/
  │   └── db.js                  # Mongoose connection (connectDB())
  ├── middleware/
  │   ├── authMiddleware.js      # protect(), authorize(), authorizeManager()
  │   ├── errorMiddleware.js     # globalErrorHandler — maps Mongoose/JWT errors
  │   └── uploadMiddleware.js    # Multer config for product image uploads
  ├── modules/                   # ← VERTICAL FEATURE SLICES (migration target)
  │   ├── auth/
  │   │   ├── controllers/       # auth.controller.js (login, register, me, employee tracking)
  │   │   ├── models/
  │   │   │   ├── User.js        # User schema (role, employeeType, isActive)
  │   │   │   └── EmployeeProfile.js # Employee info (phone, operationalRole, dashboardPreferences)
  │   │   └── routes/auth.routes.js
  │   ├── customers/
  │   │   ├── controllers/       # customer.controller.js
  │   │   ├── models/CustomerProfile.js  # Addresses[], wallet, customerId
  │   │   └── routes/customer.routes.js
  │   ├── products/
  │   │   ├── controllers/       # product.controller.js
  │   │   ├── models/Product.js  # Catalog, GST, stock, subscription flags
  │   │   └── routes/product.routes.js
  │   ├── billing/
  │   │   ├── controllers/       # billing.controller.js
  │   │   ├── models/
  │   │   │   ├── Order.js       # POS + customer orders, delivery status
  │   │   │   └── Payment.js     # Transaction records, split payments
  │   │   └── routes/
  │   │       ├── billing.routes.js
  │   │       └── payment.routes.js
  │   ├── subscriptions/
  │   │   ├── controllers/       # sub.controller.js
  │   │   ├── models/Subscription.js  # frequency, vacationMode, items[]
  │   │   └── routes/subscription.routes.js
  │   ├── suppliers/
  │   │   ├── controllers/       # supplier.controller.js
  │   │   ├── models/Supplier.js # Company info, GST, status
  │   │   └── routes/supplier.routes.js
  │   ├── notifications/
  │   │   ├── controllers/       # notification.controller.js
  │   │   └── routes/notification.routes.js
  │   └── settings/
  │       ├── controllers/       # settings.controller.js
  │       └── routes/settings.routes.js
  ├── utils/
  │   ├── bootstrapAdmin.js      # Seeds first admin user on fresh DB
  │   ├── envValidator.js        # Validates required env vars at startup
  │   ├── errors.js              # AppError, BadRequestError, NotFoundError, etc.
  │   ├── logger.js              # Custom logger (INFO/WARN/ERROR/DEBUG)
  │   └── parseProductBody.js    # Parses multipart form data for product creation
  ├── uploads/                   # Product images (served at /uploads statically)
  ├── server.js                  # Express app bootstrap, route mounting
  ├── .env                       # Environment variables (DO NOT COMMIT)
  └── package.json
```

### Frontend (`frontend/src/`)
```
frontend/src/
  ├── App.jsx                    # Route definitions, ProtectedRoute guards, CartProvider
  ├── main.jsx                   # React DOM root mount
  ├── index.css                  # Tailwind CSS directives
  ├── App.css                    # App-level global styles
  ├── assets/                    # Static assets (images, logos)
  ├── components/
  │   ├── Navbar.jsx             # Top navigation bar (role-aware, cart badge)
  │   ├── ProtectedRoute.jsx     # Route guard (checks auth + role + requireManager)
  │   └── SubscriptionModal.jsx  # Subscription creation/edit modal
  ├── context/
  │   └── CartContext.jsx        # Shopping cart state (items, add/remove/clear)
  ├── pages/                     # All page-level components
  │   ├── Login.jsx
  │   ├── Register.jsx
  │   ├── Dashboard.jsx          # Admin/Manager metrics dashboard
  │   ├── Shop.jsx               # Customer product browsing grid
  │   ├── Products.jsx           # Admin/Manager product CRUD
  │   ├── Cart.jsx               # Customer shopping cart
  │   ├── Checkout.jsx           # Order placement & payment selection (integrated with Address Book)
  │   ├── MyOrders.jsx           # Customer order history
  │   ├── StoreOrders.jsx        # Admin/Staff order management + POS
  │   ├── MySubscriptions.jsx    # Customer subscription management
  │   ├── AdminSubscriptions.jsx # Admin subscription overview
  │   ├── ForgotPassword.jsx     # Password recovery flow
  │   ├── ResetPassword.jsx      # Password reset flow
  │   ├── ChangePassword.jsx     # Change password from profile
  │   ├── Employees.jsx          # Admin employee management
  │   └── Profile.jsx            # Unified Profile management page (roles: Admin, Manager, Staff, Customer)
  └── shared/
      ├── context/
      │   └── AuthContext.jsx    # Session & password state management
      ├── services/
      │   └── api.js             # Axios base instance (token interceptor via localStorage)
      └── utils/                 # (Planned: formatters.js)
```

### Key Conventions
- Backend files: `[module].routes.js`, `[module].controller.js`, `[module].service.js`, Model: `PascalCase.js`
- Frontend components: `PascalCase.jsx`
- Frontend services: `camelCase.js`
- All API routes are prefixed with `/api/`
- Image uploads served at `/uploads/:filename`
- ES Modules used on both frontend and backend (`import`/`export`, not `require`)

---

## ENGINEERING CONSTRAINTS

### Performance Constraints
- **No compound indexes on high-traffic fields yet.** Missing indexes: `Order.status`, `Order.createdAt`, `Subscription.customer`, `CustomerProfile.user`. This will cause full-collection scans at scale. See `refactoring_and_migration_plan.md` Section 12.
- Product images are stored on local disk. This creates a bottleneck on single-server deployments and prevents horizontal scaling.
- Frontend state is managed via raw React Context. CartContext and (planned) AuthContext use coarse-grained state, causing unnecessary re-renders as component tree depth grows.

### Security Constraints
- JWT secret (`JWT_SECRET`) **must not** be committed to version control. The `.env` file has a placeholder value — always override in production.
- Passwords are never returned in API responses (`select: false` on the password field in User schema).
- `isActive=false` users are rejected at the `protect` middleware — they cannot authenticate even with a valid token.
- The `.env` file is currently in the repository (not gitignored at root level). **This is a known security risk for the dev environment.**
- No rate limiting is currently implemented on auth endpoints. Brute-force attacks on `/api/auth/login` are possible. **TODO: Add express-rate-limit.**
- No Helmet middleware currently applied. **TODO: Add Helmet for HTTP security headers.**
- CORS is currently fully open (`app.use(cors())`). **TODO: Restrict to specific origins in production.**

### Scalability Constraints
- Single Node.js process — no cluster mode or PM2 yet
- Local file storage for uploads — incompatible with multi-server deployments
- No caching layer (Redis) — every API call hits MongoDB directly
- Subscription scheduler is triggered manually or via a single cron call — not horizontally safe (no distributed lock)

### Latency Requirements
- POS billing checkout: < 500ms end-to-end
- Product catalog page load: < 1 second
- Dashboard metrics: acceptable up to 2 seconds (aggregation queries)

### Architecture Constraints
- **Module import rule**: A module's controller may only import from its own module or from the shared layer (`middleware/`, `utils/`). Direct cross-module model imports are forbidden.
- **No circular dependencies** between modules. Shared logic must be extracted to `utils/` or a shared service.
- All async controller functions must use try-catch or an async wrapper and forward errors to `next(error)` — never swallow errors silently.
- The `Subscription` model enforces a **unique compound index** on `{customer, type}` — a customer can only have one subscription of each type (Daily, Alternate, Monthly).

---

## CODING STANDARDS

### Naming Conventions
| Artifact | Convention | Example |
|---|---|---|
| Directories | lowercase, dash-separated | `customer-portal/`, `billing/` |
| Backend route files | `[module].routes.js` | `auth.routes.js` |
| Backend controller files | `[module].controller.js` | `product.controller.js` |
| Backend service files | `[module].service.js` | `wallet.service.js` |
| Backend models | PascalCase singular | `User.js`, `CustomerProfile.js` |
| Frontend pages/components | PascalCase | `MyOrders.jsx`, `SubscriptionModal.jsx` |
| Frontend API services | camelCase | `authApi.js`, `productApi.js` |
| Frontend hooks | `use` prefix, camelCase | `useAuth.js`, `useCart.js` |
| Environment variables | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `MONGO_URI` |

### API Response Format
All API responses **must** follow this structure consistently:

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "Human-readable description", "status": "fail" }
```

Never return raw Mongoose errors, stack traces, or internal error objects to the client in production.

### Error Handling
- Use the custom error classes in `backend/utils/errors.js`:
  - `AppError(message, statusCode)` — base class
  - `BadRequestError(message)` — 400
  - `UnauthorizedError(message)` — 401
  - `ForbiddenError(message)` — 403
  - `NotFoundError(message)` — 404
  - `ConflictError(message)` — 409
- Never use `res.status(500).json(...)` directly in controllers. Always `throw` or `next(new AppError(...))`.
- The `globalErrorHandler` in `middleware/errorMiddleware.js` handles Mongoose CastError, duplicate key (code 11000), ValidationError, and JWT errors automatically.

### Logging Standards
Use the custom logger from `backend/utils/logger.js`:
```js
import { logger } from '../utils/logger.js';

logger.info('Server started', { port: 5000 });
logger.warn('Low stock detected', { productId });
logger.error('Payment failed', error, { orderId });
logger.debug('Request received', { body: req.body }); // dev-only
```
Never use raw `console.log` in controllers or services. `console.error` is acceptable only in the global error handler fallback.

### Formatting
- 2-space indentation
- Single quotes for strings
- ES Module syntax everywhere (`import`/`export`)
- Trailing commas in object literals and function parameters (optional, but consistent)
- No semicolons on frontend (ESLint configured), semicolons on backend

### Testing Expectations
- **Unit tests**: Domain services (`scheduler.service.js`, `invoice.service.js`, `wallet.service.js`) must have Jest unit tests covering core logic
- **Integration tests**: All API routes must have Supertest integration tests covering success, unauthorized, and validation-error cases
- **Frontend component tests**: POS billing form and subscription calendar must have React Testing Library tests
- **No tests currently exist** — this is an active technical debt item

### Commit Conventions
Follow Conventional Commits:
```
feat(billing): add split-payment support for Cash + UPI
fix(subscriptions): prevent duplicate orders on scheduler retry
refactor(products): extract inventory service from product controller
docs(auth): update API endpoint list in project-context.md
```

---

## DATABASE DESIGN

### Entities & Schemas

#### `User` (auth module)
```
_id, name, email (unique), password (select:false), role (admin|employee|customer),
employeeType (manager|staff — employees only), isActive, createdAt
```
- `matchPassword()` instance method for bcrypt comparison
- Pre-save hook hashes password on every modification

#### `CustomerProfile` (customers module)
```
_id, user (ref:User, unique), customerId (unique string), phone (10-digit),
addresses[]: { tag, fullName, phoneNumber, addressLine1, addressLine2, city, state, pincode, landmark, isPrimary, isDefaultDelivery },
walletBalance, totalAmountSpent, preferences: {}, timestamps
```

#### `EmployeeProfile` (auth module)
```
_id, user (ref:User, unique), phone, operationalRole, dashboardPreferences: {}, assignedTasks: [], timestamps
```

#### `Product` (products module)
```
_id, user (ref:User — creator), name (unique), image, brand, category (Groceries|Dairy|Bakery),
description, price, taxPercentage, countInStock, minStockThreshold, isSubscriptionEligible,
minSubscriptionQuantity, isActive, timestamps
```
- **TODO**: Category enum is hardcoded — needs to become a dynamic Category model

#### `Order` (billing module)
```
_id, customer (ref:User — nullable for walk-in POS), customerName,
orderItems[]: { name, quantity, image, price, product(ref:Product) },
shippingAddress: { address, city, postalCode, country },
orderType (Takeaway|Home Delivery), paymentMethod (Cash|UPI|Cash + UPI|Online|Offline|Cash on Delivery),
paymentResult: { id, status, update_time, email_address },
taxPrice, shippingPrice, itemsPrice, totalPrice,
isPaid, paidAt, isDelivered, deliveredAt,
status (Pending|Packed|Ready to deliver|Out for delivery|Delivered|Pickup Ready|Cancelled),
assignedTo (ref:User — delivery staff), subscription (ref:Subscription), timestamps
```

#### `Payment` (billing module)
```
_id, transactionId (unique), orderId (ref:Order), subscriptionBillId (ref:MonthlyBill — TODO model),
customer (ref:User), staff (ref:User),
paymentMode (Cash|UPI|Cash + UPI|Wallet),
amount, cashAmount, upiAmount,
status (Success|Failed|Pending),
paymentContext (POS|Portal Order|Subscription Bill), timestamps
```
- **Note**: `MonthlyBill` model is referenced but not yet created — this is a gap

#### `Subscription` (subscriptions module)
```
_id, customer (ref:User), type (Daily|Alternate|Monthly),
items[]: { product(ref:Product), quantity },
startDate, customDates[] (for Monthly type — days of month 1-31),
status (Active|Paused|Cancelled|Action Required),
vacationMode: { isOn, startDate, endDate }, timestamps
```
- **Unique index**: `{ customer: 1, type: 1 }` — one subscription per type per customer

#### `Supplier` (suppliers module)
```
_id, name, contactPerson, phone, email, address, gstNumber,
status (Active|Inactive), timestamps
```
- **TODO**: Purchase Order sub-document or separate `PurchaseOrder` model is not yet implemented

### Indexing Strategy
**Currently missing critical indexes. Must be added:**
```js
// backend/modules/billing/models/Order.js
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customer: 1, createdAt: -1 });

// backend/modules/subscriptions/models/Subscription.js
// Already has: { customer: 1, type: 1 } unique index ✓

// backend/modules/customers/models/CustomerProfile.js
CustomerProfileSchema.index({ user: 1 }); // frequent auth lookups
```

### Scaling Considerations
- Subscription auto-orders will eventually generate thousands of Order documents per day — ensure `Order` collection is indexed on `status` and `createdAt`
- Product images should be migrated to cloud storage (Cloudinary/S3) before scaling
- MongoDB Atlas auto-scaling handles database horizontal growth; no replica set setup needed locally

---

## API DESIGN

### Base URL
- Development: `http://localhost:5000/api`
- Frontend reads base URL from `VITE_API_ORIGIN` env var (defaults to `http://localhost:5000`)

### Auth Strategy
- Bearer token in `Authorization` header: `Authorization: Bearer <JWT>`
- Token stored in `localStorage` as part of `userInfo` JSON object
- Frontend Axios interceptor (`frontend/src/shared/services/api.js`) auto-attaches token on every request

### Role Guards (Backend Middleware)
| Middleware | Who Can Pass |
|---|---|
| `protect` | Any authenticated user with valid JWT |
| `authorize('admin')` | Admin only |
| `authorize('admin', 'employee')` | Admin + any employee |
| `authorize('customer')` | Customer only |
| `authorizeManager` | Admin OR employee with `employeeType='manager'` |

### Endpoint Index
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user (customer) |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/forgot-password` | Public | Request password reset token |
| PUT | `/api/auth/reset-password/:token` | Public | Reset password with token |
| PUT | `/api/auth/change-password` | protect | Change password for logged-in user |
| GET/PUT | `/api/auth/profile` | protect | Get/Update Employee Profile |
| PUT | `/api/auth/employees/:id/role` | protect(admin) | Update employee role |
| GET | `/api/auth/me` | protect | Get current user |
| GET/PUT | `/api/customers/profile` | protect | Get/Update Customer Profile |
| POST | `/api/customers/address` | protect | Add Customer Address |
| PUT/DEL | `/api/customers/address/:addressId` | protect | Update/Delete Address |
| GET | `/api/products` | protect | List all active products |
| POST | `/api/products` | protect + authorizeManager | Create product (with image upload) |
| PUT | `/api/products/:id` | protect + authorizeManager | Update product |
| DELETE | `/api/products/:id` | protect + authorizeManager | Deactivate product |
| GET | `/api/orders` | protect + authorize(admin, employee) | List all orders |
| POST | `/api/orders` | protect | Create order (POS or customer) |
| PUT | `/api/orders/:id` | protect | Update order status |
| GET | `/api/customers` | protect + authorize(admin, employee) | List all customers |
| POST | `/api/customers` | protect | Create customer profile |
| GET | `/api/subscriptions` | protect | List subscriptions (role-filtered) |
| POST | `/api/subscriptions` | protect + authorize(customer) | Create subscription |
| PUT | `/api/subscriptions/:id` | protect | Update subscription status |
| GET | `/api/suppliers` | protect + authorizeManager | List suppliers |
| POST | `/api/suppliers` | protect + authorizeManager | Create supplier |
| GET | `/api/payments` | protect + authorizeManager | Payment logs |
| POST | `/api/payments` | protect | Record payment |
| GET | `/api/settings` | protect | Get store settings |
| PUT | `/api/settings` | protect + authorize(admin) | Update settings |
| GET | `/api/notifications` | protect | Get notifications for user |
| GET | `/api/health` | Public | Health check |

### Versioning
- No API versioning currently implemented
- **TODO**: Add `/api/v1/` prefix before exposing to external consumers

### Rate Limiting
- **Not implemented** — all endpoints are currently unprotected against brute-force
- **TODO**: Add `express-rate-limit` to `/api/auth/login` and `/api/auth/register`

---

## DEV WORKFLOW

### Prerequisites
- Node.js v18+ (v20 recommended)
- MongoDB running locally on port 27017, OR MongoDB Atlas connection string
- `npm` or `yarn`

### Setup — Backend
```bash
cd backend
# Configure environment
cp .env.example .env   # (if .env.example exists, otherwise edit .env directly)
# Required vars:
#   NODE_ENV=development
#   PORT=5000
#   MONGO_URI=mongodb://localhost:27017/shop-management
#   JWT_SECRET=<your-secret-key>
#   JWT_EXPIRE=30d

npm install
npm run dev   # nodemon server.js — hot reload
```

### Setup — Frontend
```bash
cd frontend
# Configure environment
# Create .env with:
#   VITE_API_ORIGIN=http://localhost:5000

npm install
npm run dev   # Vite dev server (default: http://localhost:5173)
```

### Environment Variables — Backend (`.env`)
| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | `development` or `production` |
| `PORT` | Yes | Express listen port (default: 5000) |
| `MONGO_URI` | Yes | Full MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `JWT_EXPIRE` | Yes | JWT expiry (e.g., `30d`) |

### Environment Variables — Frontend (`.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_ORIGIN` | No | Backend base URL (default: `http://localhost:5000`) |

### Build Commands
```bash
# Backend (no build step needed — runs directly with Node)
npm start           # node server.js (production)

# Frontend
npm run build       # Vite production build → dist/
npm run preview     # Preview production build locally
npm run lint        # ESLint check
```

### First-Time Admin Bootstrap
On first server start against a fresh database, `bootstrapAdmin.js` automatically seeds an admin user. Check `backend/utils/bootstrapAdmin.js` for the default credentials and **change the password immediately in production**.

---

## CURRENT PROJECT STATUS

### Completed Features
- [x] JWT authentication with 4-tier RBAC (admin / employee[manager|staff] / customer)
- [x] Password strength validation, reset flows, and session management with idle timeout
- [x] AuthContext for managing user sessions and UI states
- [x] Comprehensive Profile Management system (Customer Address Book, Employee Profiles, Role-based Dashboards)
- [x] Backend modular architecture (all 8 modules created under `backend/modules/`)
- [x] Custom error hierarchy (`AppError`, `BadRequestError`, `NotFoundError`, etc.)
- [x] Global error handler with Mongoose/JWT error mapping
- [x] Custom logger (`utils/logger.js`)
- [x] Environment variable validator on startup
- [x] Admin auto-bootstrap on fresh database
- [x] Product CRUD with image upload (Multer)
- [x] Order creation (POS and customer portal)
- [x] Customer CustomerProfile with address book and wallet fields
- [x] Subscription model with vacation mode and unique type-per-customer index
- [x] Payment model with split payment support (Cash + UPI)
- [x] Frontend routing with ProtectedRoute (role + manager guards)
- [x] CartContext for shopping cart state
- [x] All major pages: Login, Register, Dashboard, Shop, Products, Cart, Checkout, MyOrders, StoreOrders, MySubscriptions, AdminSubscriptions, Employees, ForgotPassword, ResetPassword
- [x] Navbar with role-aware navigation and cart badge
- [x] Axios base instance with token interceptor
- [x] Shop page improvements: stock indicator badges, functional sort dropdown, results count summary, inline quantity selector, tax/unit display, and cart addition feedback toasts

### In-Progress Features
- [ ] Services layer (`*.service.js`) not yet implemented inside modules — business logic sits in controllers
- [ ] Delivery management module (routes and controllers exist in plan but not verified implemented)
- [ ] Monthly billing / consolidated invoice for subscriptions (`MonthlyBill` model missing)
- [ ] Notification system (module exists but email integration not fully wired)
- [ ] Reports/analytics API endpoints and dashboard data aggregation

### Known Blockers
- `MonthlyBill` model is referenced in `Payment.js` (`subscriptionBillId`) but not yet created
- Product category enum is hardcoded (`Groceries`, `Dairy`, `Bakery`) — not user-configurable
- Supplier purchase orders — `Supplier.js` model exists but no PurchaseOrder model/controller implemented

### Technical Debt
| Item | Risk | Priority |
|---|---|---|
| No input validation middleware (Joi/Zod) | High | P1 |
| Fat controllers (business logic not extracted to services) | High | P1 |
| Missing database indexes on high-traffic fields | Medium | P1 |
| No rate limiting on auth endpoints | High | P1 |
| Open CORS policy | High (prod) | P1 |
| No unit or integration tests | High | P2 |
| JWT in localStorage (XSS risk) | Medium | P2 |
| Local file storage for images | Medium | P2 |
| No Helmet middleware | Medium | P2 |
| Product category is a hardcoded enum | Low | P3 |
| No API versioning | Low | P3 |

### Known Bugs
- `MonthlyBill` ref in Payment model will cause a Mongoose population error if queried before the model is created
- CORS is fully open — any origin can call the API in current state

### Roadmap
1. **Phase 1 (Current)**: Complete backend module structure and service layer extraction
2. **Phase 2**: Add input validation middleware, rate limiting, Helmet
3. **Phase 3**: Frontend features/ migration (per `refactoring_and_migration_plan.md`)
4. **Phase 4**: Add missing models (MonthlyBill, PurchaseOrder, DeliveryRun, Category)
5. **Phase 5**: Integrate test suite (Jest + Supertest + RTL)
6. **Phase 6**: Cloud image storage (Cloudinary/S3), production deployment (PM2 + Nginx)

---

## IMPORTANT DECISIONS

### Decision 1: Vertical Feature-Slice Architecture
**Decision**: Migrate from flat MVC (`controllers/`, `routes/`, `models/` at root) to feature-slice modules under `backend/modules/[feature]/`.
**Rationale**: Flat MVC creates high cognitive load when adding a single feature requires touching 6+ directories. Feature-slice improves cohesion, reduces coupling, and enables team-based parallel development.
**Tradeoff**: Partial migration in progress — some logic still in controllers, not yet in services. Code is in an intermediate state.
**Status**: Backend modules created; services layer not yet extracted.

### Decision 2: No External Payment Gateway (Phase 1)
**Decision**: Track payments internally by recording transaction IDs entered by customers/staff. No Razorpay/Stripe integration.
**Rationale**: Faster to market, avoids payment gateway onboarding complexity for an MVP shop system.
**Tradeoff**: Payments cannot be automatically verified — relies on manual transaction ID entry and trust.
**Future**: Payment gateway integration is documented as a future scope item.

### Decision 3: JWT in localStorage (Not HttpOnly Cookie)
**Decision**: Auth token stored in `localStorage` via the `userInfo` key.
**Rationale**: Simplicity for development; avoids CSRF complexity.
**Tradeoff**: Susceptible to XSS attacks. **TODO: Migrate to HttpOnly cookie with CSRF token in production.**

### Decision 4: Single Subscription Per Type Per Customer
**Decision**: The `Subscription` model enforces a unique index on `{ customer, type }`.
**Rationale**: Prevents data duplication and simplifies the scheduler logic (one Daily, one Alternate, one Monthly list per customer).
**Tradeoff**: A customer cannot have multiple separate subscriptions of the same type.

### Decision 5: Multer Local Storage (Not Cloud)
**Decision**: Product images saved to `backend/uploads/` served statically.
**Rationale**: Zero external dependency for local development and MVP.
**Tradeoff**: Cannot scale horizontally. Cloud storage migration required before multi-server deployment.

### Rejected Approaches
- **Mongoose populate for all cross-module references**: Rejected because it creates implicit coupling between modules. Services should handle data joining at the application layer.
- **Redux for frontend state**: Rejected in favor of React Context for simplicity at current scale. Consider Zustand if Context performance degrades.
- **Multi-tenancy**: Explicitly out of scope — single-shop system only.

---

## COMMON PITFALLS

1. **Don't import Product model directly in billing controllers** — Use the Products service interface when it's created. Current workaround: direct import acceptable until service layer is built.

2. **Don't call `res.json()` after calling `next(error)`** — Express will throw a "headers already sent" error. Always `return next(error)` and stop execution.

3. **Don't add fields to `User` schema for customer-specific data** — Customer-specific fields (wallet, addresses, phone) belong in `CustomerProfile`, not `User`. The schemas are intentionally separated.

4. **Don't modify the Subscription unique index without a migration plan** — The `{ customer: 1, type: 1 }` unique index means changing the type enum values will orphan existing documents.

5. **Don't use `mongoose.model()` directly when a model may already be registered** — Always use the `mongoose.models.X || mongoose.model('X', schema)` guard pattern (already used in Payment.js and Subscription.js). Failure causes "Cannot overwrite model once compiled" errors in hot-reload environments.

6. **Don't hardcode `http://localhost:5000` in frontend components** — Always import from the Axios base instance in `shared/services/api.js`. The origin is configured via `VITE_API_ORIGIN`.

7. **Don't commit `.env` files** — The current `.env` is tracked in git (dev convenience). In production, use environment injection (Docker secrets, CI/CD env vars). Never commit real secrets.

8. **Don't run the subscription scheduler concurrently** — There is no distributed lock. Running the scheduler from multiple server instances will generate duplicate orders. Implement a lock (Redis SETNX or MongoDB findOneAndUpdate with a lock document) before enabling multi-server deployment.

9. **Don't add new product categories by editing the enum** — The hardcoded `['Groceries', 'Dairy', 'Bakery']` enum in `Product.js` needs to become a dynamic reference. Adding new values requires a migration of existing documents if the enum is changed.

10. **Don't `console.log` in controllers** — Use the custom `logger` from `utils/logger.js`.

---

## FUTURE IMPROVEMENTS

### Priority 1 — Security & Stability
- Add `express-rate-limit` on `/api/auth/*` endpoints
- Add `helmet` middleware in `server.js`
- Restrict CORS to approved origins
- Migrate JWT from localStorage to HttpOnly cookie
- Add Joi/Zod request validation middleware per route
- Add compound database indexes to Order, CustomerProfile

### Priority 2 — Architecture Completions
- Create missing models: `MonthlyBill`, `PurchaseOrder`, `DeliveryRun`, `Category`, `Notification`, `Settings`
- Extract business logic from controllers into dedicated `*.service.js` files per module

### Priority 3 — Infrastructure
- Migrate image uploads from local disk to Cloudinary or AWS S3
- Add PM2 process management for production
- Add Nginx reverse proxy configuration
- Set up rolling log files (Winston transport) for production log retention
- Add structured JSON logging with log correlation IDs

### Priority 4 — Features
- Payment gateway integration (Razorpay preferred for Indian UPI flows)
- PDF invoice generation (PDFKit or Puppeteer)
- Excel/CSV export for reports
- WebSocket-based real-time delivery status updates
- Distributed-safe subscription scheduler (Redis lock or MongoDB atomic update)
- Customer loyalty/points system
- Multi-branch/store support (long-term)
