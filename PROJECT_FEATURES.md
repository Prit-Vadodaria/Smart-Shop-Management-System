# 🏪 SHOP MANAGEMENT SYSTEM

## (With Auto-Delivery, Subscription & Customer Self-Service Portal)

---

# 🔐 1. Authentication & Role Management Module

🎯 Purpose: Secure system access and role-based visibility.

## 👤 User Roles

* Admin
* Manager
* Staff
* Customer

---

## 🔧 Functionalities

### 1.1 Login & Logout

* Secure login (username/email + password)
* Encrypted password storage
* Session handling
* Auto logout after inactivity
* Failed login attempt tracking

---

### 1.2 Role-Based Access Control

* Admin → Full access
* Manager → Operational access
* Staff → Sales & limited inventory
* Customer → Order, Subscription & Profile only
* Restricted module visibility

---

### 1.3 Password Management

* Forgot password
* Change password
* Password strength validation

---

### 1.4 Activity Logs

Track:

* Login time
* Product updates
* Bill generation
* Subscription changes
* Order cancellations
* IP address & timestamp

---

# 👥 2. Customer Management Module

---

## 🔹 2A. Admin-Side Customer Management

🎯 Purpose: Manage customer records.

### Functionalities

### 2A.1 Customer Profile Management

* Add / Edit / Delete customer
* Unique customer ID generation
* Phone validation
* Email validation

---

### 2A.2 Multiple Address Support

* Primary address
* Delivery address
* Address tagging (Home / Office)

---

### 2A.3 Purchase History

* View past invoices
* Total amount spent
* Most purchased products

---

### 2A.4 Subscription History

* Active subscriptions
* Paused subscriptions
* Cancelled subscriptions
* Subscription timeline

---

## 🔹 2B. Customer Self-Service Portal

🎯 Purpose: Allow customers to manage their own orders & subscriptions.

---

### 2B.1 Profile Management

* Edit profile
* Manage addresses
* Set default delivery address

---

### 2B.2 Place Orders

Customer can:

* Add products to cart
* Select quantity
* Choose order type:

  * 🏬 Takeaway
  * 🚚 Home Delivery
* Select address (for delivery)
* Place order

---

### 2B.3 Order Management

* View order history
* Track order status
* Cancel order (before cut-off time)
* Reorder previous orders

---

### 2B.4 My Daily / Alternate / Custom List

Customer can:

* Create daily product list
* Create alternate-day list
* Create custom weekday list
* Add/remove products
* Modify quantity
* Skip specific date
* Pause list
* Resume list

Integrated with Subscription Engine.

---

### 2B.5 Subscription Controls

* Pause subscription
* Resume subscription
* Cancel subscription
* Skip specific date
* Vacation mode

---

### 2B.6 Wallet View (Only View & Use)

* View wallet balance
* Use wallet during payment
* View wallet transaction history

❌ Pending dues removed as requested.

---

# 📦 3. Product Management Module

🎯 Central control of products.

---

### 3.1 Product CRUD

* Add / Edit / Delete product
* Product image upload

---

### 3.2 Categorization

* Category creation
* Brand management
* Filter by category

---

### 3.3 Pricing & Tax

* Product price
* GST / tax percentage
* Discount settings

---

### 3.4 Subscription Eligibility

* Enable / Disable subscription option
* Define minimum subscription quantity

---

### 3.5 Stock Threshold

* Set minimum stock level
* Trigger low stock alert

---

# 🧮 4. Inventory & Stock Management Module

🎯 Maintain accurate stock.

---

### 4.1 Real-Time Stock Tracking

* Current stock quantity
* Stock valuation

---

### 4.2 Stock Movement

* Stock in (purchase)
* Stock out (sales)
* Auto stock deduction:

  * POS sale
  * Customer order
  * Subscription order

---

### 4.3 Low Stock Alerts

* Notification to admin
* Dashboard highlight

---

# 🧾 5. Sales & Billing Management Module

---

### 5.1 POS Billing System

* Add multiple products
* Quantity adjustment
* Auto subtotal + tax calculation

---

### 5.2 Discount & Tax Handling

* Product-level discount
* Bill-level discount
* Automatic tax calculation

---

### 5.3 Invoice Generation

* Unique invoice ID
* Print / Download invoice (PDF)
* Email invoice (optional)

---

### 5.4 Auto-Generated Orders

Generated from Subscription Module
Linked with Subscription ID

---

### 5.5 Refund & Cancellation

* Partial refund
* Full refund
* Stock restoration

---

# 🔄 6. Auto-Delivery / Subscription Management Module

🎯 Only Customer-created subscriptions allowed.

---

### 6.1 Create Subscription (Customer Only)

* Select subscription-eligible product
* Select quantity
* Select frequency:

  * Daily
  * Alternate days
  * Custom days
* Select start & end date

---

### 6.2 Auto Order Engine

Daily scheduler:

1. Check active subscriptions
2. Check skipped dates
3. Generate order
4. Deduct stock
5. Assign delivery / pickup
6. Update status

---

### 6.3 Monthly Billing

* Consolidated monthly invoice
* Auto calculation
* Payment tracking

---

### 6.4 Subscription Reports

* Active subscription list
* Revenue from subscriptions
* Product-wise subscription demand

---

# 🚚 7. Delivery Management Module

---

### Functionalities

* View daily delivery list
* Assign delivery staff
* Update delivery status:

  * Pending
  * Packed
  * Out for delivery
  * Delivered
  * Failed
  * Skipped
  * Pickup Ready
  * Picked Up
* Track delivery history

---

# 🧑‍💼 8. Supplier & Purchase Management Module

---

### Functionalities

* Add supplier details
* Create purchase order
* Record supplier invoice
* Update stock automatically
* Track supplier payments

---

# 📊 9. Reports & Business Analytics Module

---

### Reports

* Daily sales report
* Monthly sales report
* Profit & Loss report
* Inventory valuation report
* Subscription revenue report
* Customer purchase trends
* Top selling products

---

# 🔔 10. Notification & Alert System(Through email)

---

### Alerts

* Low stock notification
* Subscription pause alert
* Payment reminder
* Delivery failure alert
* Dashboard notification center
* Order confirmation notification

---

# 💳 11. Payment Management Module (Final Version)

🎯 **Purpose:**
Handle all payment transactions related to:

* POS Sales
* Customer Portal Orders
* Subscription Billing

---

## 🔹 11.1 Supported Payment Modes

* Cash
* UPI
* Cash + UPI

---

## 🔹 11.2 POS Payment Handling (Staff/Admin)

* Accept single or multiple payment modes
* Split payment support (Cash + UPI , Cash , UPI )
* Generate payment receipt
* Link payment to invoice ID
* Mark invoice as **Paid / Unpaid**
* Update stock after successful billing
* Record transaction ID (for digital payments)

---

## 🔹 11.3 Customer Portal Payments

Applicable For:

* Instant orders
* Subscription monthly billing

### Features:

* Record digital payment transaction details
* Order confirmation only after payment verification
* Payment failure handling
* Payment retry option
* Automatic invoice generation after payment success

Digital payments will be verified internally by recording transaction details entered by the user.

---

## 🔹 11.4 Subscription Billing Payment

Monthly consolidated invoice:

* Auto-generate monthly bill
* Display total payable amount
* Allow payment via:

  * UPI
  * Card
  * Net Banking
  * Cash (offline entry by admin)

### Payment Status:

* Paid
* Unpaid
* Failed

---

## 🔹 11.5 Payment Tracking & Logs

System must track:

* Unique Transaction ID
* Payment mode
* Amount paid
* Date & time
* Linked invoice ID
* Customer ID (if portal payment)
* Payment status
* Staff ID (for POS payments)

---

## 🔹 11.6 Payment Security & Validation

* Store digital payment transaction records
* Verify payment confirmation before marking invoice paid
* Duplicate transaction prevention
* Audit logging for all payment entries

---

### Future Scope

Integration with external payment gateways may be implemented in future versions of the system.

---

# 🛠️ 12. System Settings & Configuration Module

---

### Functionalities

* Tax rate configuration
* Minimum order value


