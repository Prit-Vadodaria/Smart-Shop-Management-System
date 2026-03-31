# Shop Management System

A complete production-ready web application using the MERN stack (MongoDB, Express.js, React.js, Node.js) with features including auto-delivery, subscription, customer self-service portal, and comprehensive point of sale capabilities.

## Architecture & Technology Stack

- **Frontend:** React.js, Vite, React Router DOM, Axios, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcryptjs

## Prerequisites

- Node.js (v18+)
- MongoDB running locally or on MongoDB Atlas

## Getting Started

### 1. Setup Backend

Navigate to the `backend` directory, rename `.env.example` to `.env` (or configure `.env` variables directy) and install dependencies.

```bash
cd backend
npm install
npm run dev
```

### 2. Setup Frontend

Navigate to the `frontend` directory and install dependencies.

```bash
cd frontend
npm install
npm run dev
```

## Directory Structure

```text
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   └── server.js
└── frontend
    ├── src
    │   ├── components
    │   ├── context
    │   ├── pages
    │   ├── services
    │   └── App.jsx
```

## Features

- **Authentication & Roles:** Admin, Manager, Staff, Customer
- **Customer Portal:** Profile, Address, Order, Subscription, Wallet viewing
- **Product Management:** Complete CRUD with stock limits and tax details
- **Inventory & Stock Management:** Auto deduction on sales
- **Sales & Billing:** POS functionality
- **Auto-Delivery & Subscription:** Customers can set up automatic daily or custom scheduled delivery
- **Delivery Management:** Route tracking, delivery status updates
- **Supplier Module:** Manage B2B purchases
- **Payments:** Support for cash and UPI, POS splitting
- **Reports:** PnL, Inventory reports

## API Endpoints

### Auth
- `POST /api/auth/register` - Register a user
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/me` - Get current user data

*(API Endpoints for Products, Orders, Categories will be mapped in the respective route files)*
