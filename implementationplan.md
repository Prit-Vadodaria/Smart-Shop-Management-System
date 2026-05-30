# Customer Shop UI/UX Improvements Prompt

Analyze the current customer shop/product listing implementation and implement the following UX improvements without breaking the existing architecture, API contracts, cart flow, filtering system, or styling consistency.

## Requirements

### 1. Stock Indicator on Product Cards

Add clear stock visibility on each product card.

#### Behaviour

* If `stock <= 0`:

  * Show badge: `Out of Stock`
  * Disable:

    * Add to Cart button
    * Quantity controls
  * Reduce card opacity slightly for visual distinction

* If `stock > 0 && stock <= 5`:

  * Show warning badge:

    * `Only X left`
  * Use warning styling (orange/yellow)

* If stock is healthy:

  * Optionally show:

    * `In Stock`

#### Important

* Use existing product stock field from database/API
* Do NOT hardcode stock values
* Preserve responsive card layout

---

### 2. Implement Functional Sort Dropdown

Currently `sortOption` state exists but is not connected to UI.

Add a visible sort dropdown above the products grid.

#### Sort Options

Implement:

* Name: A → Z
* Name: Z → A
* Price: Low → High
* Price: High → Low
* Newest First (if created date exists)

#### Behaviour

* Sorting must work together with:

  * Search
  * Category filters
  * Pagination (if present)
* Sorting should update displayed products immediately
* Preserve existing filtering pipeline

#### UI Placement

Place near:

* Search bar
* Filters
* Product results summary

---

### 3. Add “Added to Cart” Feedback

Currently clicking Add to Cart gives no feedback.

Improve UX with immediate confirmation.

#### Behaviour

When user clicks Add to Cart:

* Button temporarily changes to:

  * `✓ Added`
* Add subtle animation or success state
* Revert back after ~1–2 seconds

Additionally:

* Show toast notification:

  * `"Product added to cart"`

#### Important

* Do NOT introduce page refreshes
* Avoid duplicate cart additions due to rapid clicking
* Preserve existing cart state logic

---

### 4. Product Results Summary

Add product count summary above grid.

#### Example

* `Showing 12 of 45 products`
* If filters active:

  * `Showing 8 filtered products`

#### Behaviour

* Must update dynamically
* Reflect:

  * Search
  * Filters
  * Sorting

---

### 5. Quick Quantity Selector on Product Cards

Allow quantity selection directly from product cards.

#### Add

* `-` decrement button
* Quantity display
* `+` increment button

#### Behaviour

* Minimum quantity = 1
* Maximum quantity = available stock
* Add to Cart should use selected quantity
* Disable increment when max stock reached
* Quantity resets appropriately after successful add

#### Important

* Keep compact mobile-friendly layout
* Do NOT break current card responsiveness
* Maintain accessibility and keyboard usability

---

### 6. Show Tax / Unit Information

Products already contain `taxPercentage` and likely unit information.

Display useful purchasing information directly on cards.

#### Examples

* `₹45 / kg`
* `₹120 / litre`
* `Tax: 5% included`

#### Behaviour

* Only render fields if data exists
* Format consistently across all cards
* Keep visual hierarchy clean

---

# UI/UX Expectations

Maintain a modern ecommerce UI.

## Styling Guidelines

* Preserve current design system and theme
* Avoid cluttering cards
* Keep spacing balanced
* Mobile-first responsive design
* Smooth transitions and hover effects
* Ensure accessibility:

  * Proper button states
  * Disabled states
  * Keyboard navigation

---

# Technical Constraints

## Important

* DO NOT rewrite the entire product card system
* DO NOT modify backend APIs unless absolutely required
* Reuse existing state management and cart pipeline
* Avoid duplicate logic
* Keep implementation modular and reusable

---

# Deliverables

1. Updated product card component
2. Sort dropdown component
3. Quantity selector component
4. Toast/cart feedback integration
5. Results summary section
6. Proper conditional rendering for stock + tax/unit data
7. Responsive styling updates
8. Clean refactoring only where necessary

Before implementing:

* Analyze current product listing flow
* Identify existing states/hooks/utilities
* Extend current architecture instead of replacing it
* Reuse existing utility functions and styles wherever possible
