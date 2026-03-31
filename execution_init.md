# Shop Management System - Execution & Implementation Details

I have built the complete Shop Management System with the requested MERN stack architecture. The backend and frontend are properly set up with all the requested functional modules and modern user interface using React, Tailwind CSS, and Lucide Icons.

Here is a summary of the implementation:

## 1. Backend Infrastructure (Node.js + Express + MongoDB)
- **MVC Architecture**: Code is split evenly into `/controllers`, `/models`, `/routes`, and `/middleware`.
- **Database Models (`/models`)**: Created Mongoose schemas for `User`, `Product`, `Order`, `CustomerProfile`, `Subscription`, `Supplier`, `Payment`, and `Settings`.
- **Authentication (`/controllers/authController.js`)**: JWT-based login, registration with bcrypt password hashing and Role Based Access Control (RBAC). 
- **Roles Implemented**: Admin, Manager, Staff, Customer.
- **RESTful APIs**: Comprehensive API routes with protected endpoints across all functional requirements.

## 2. Frontend Infrastructure (React + Vite + Tailwind CSS)
- **State Management**: Implemented `AuthContext` to manage user sessions persistently using JWT to LocalStorage.
- **Component Routing**: Configured `react-router-dom` with a `ProtectedRoute` component to handle role-based redirection.
- **UI System**: Clean, premium and responsive design styling leveraging `Tailwind CSS`.
- **Pages Implemented**: 
  - `Login` & `Register`: Secure authentication pages.
  - `Dashboard`: Role-specific dynamic dashboard (Admin vs Customer vs Staff).
  - `Shop`: The public/customer-facing store view to browse products.
  - `Products`: Admin/Manager grid to manage the overall product catalog.

## Database Schema Map
- **User**: Name, Email, Password, Role `['Admin', 'Manager', 'Staff', 'Customer']`
- **CustomerProfile**: Links to User, handles multiple addresses (Home/Office) and wallet tracking.
- **Product**: Name, Brand, Price, Categories, Stock tracking `countInStock`, min threshold. Includes `isSubscriptionEligible`.
- **Order**: Items, Shipping address, Order Type `['Takeaway', 'Home Delivery']`, Payment references, Delivery statuses.
- **Subscription**: Allows users to set Daily, Alternate day, or Custom Day recurring product deliveries. Handles pause/resume states and vacation mode.
- **Payment**: Handles all transaction links spanning POS, Portals, and auto-generated monthly Subscription bills.

## Setup and Running Locally

Make sure MongoDB is running locally on port 27017.

### Start Backend
```bash
cd backend
npm install
npm run dev
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

You can now navigate to `http://localhost:5173` in your browser.
1. Sign up for a new account. By default, you can select your Role (This is left open in the registration dropdown for testing so you can easily test Admin vs Customer views).
2. Log in and you'll be routed to your role's specific dashboard. Admin will see financial stats and low stock alerts. Customers will see wallet balances and active subscriptions.

The code embraces all requirements prioritizing a robust, extensible backend and a visually appealing, functional frontend architecture.
