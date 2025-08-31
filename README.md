# 🌱 Farm Fresh - Organic Farm E-commerce Platform

## Project Overview
Farm Fresh is a modern React-based e-commerce web application for an organic farm business that sells fresh vegetables, free-range chicken, and cattle grass feed directly to customers.  
The backend is built with **Node.js**, **TypeScript**, **Prisma**, and **MySQL**, running on `https://ecommerce-backend.kushalnepal.com.np`.

---

## Key Features

### 🛒 E-commerce Functionality
- **Product Catalog:** Dynamic product listing with category filtering.
- **Smart Search:** Advanced fuzzy search with typo tolerance using Fuse.js and Levenshtein distance.
- **Shopping Cart:** Optimized cart system using hash maps and greedy algorithms.
- **Collaborative Filtering:** AI-powered product recommendations based on user purchase patterns.

### 🎨 User Interface
- **Responsive Design:** Mobile-first approach using Tailwind CSS.
- **Modern Components:** Built with shadcn/ui component library.
- **Theme System:** Custom farm-themed color palette (greens, browns, creams).
- **Interactive Elements:** Hover effects, transitions, and smooth animations.

### 🔐 Authentication & User Management
- User authentication system integrated with Node.js backend.
- User profiles and account management.
- Admin panel for product management.

### 📱 Pages & Navigation
- **Home:** Hero section, featured products, contact CTA.
- **Products:** Filterable product grid with search.
- **Cart:** Shopping cart with recommendations.
- **Order Now:** Custom order form.
- **Gallery:** Visual showcase.
- **Contact:** Contact information and forms.
- **Admin:** Product management dashboard.

---

## Technical Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- shadcn/ui component library

### Backend & Data
- Node.js with TypeScript
- Prisma ORM with MySQL database
- RESTful API routes for authentication, product management, and admin operations
- Server running at `https://ecommerce-backend.kushalnepal.com.np`

### Libraries & Tools
- Fuse.js for fuzzy search
- Lucide React for icons
- Sonner for toast notifications
- React Hook Form for form handling
- Zod for validation

---

## Smart Features

### Advanced Search Algorithm
- Fuzzy search with typo tolerance
- Levenshtein distance calculation for string similarity
- Multi-field search (name, description, category)

### Cart Optimization
- Hash map implementation for O(1) lookups
- Greedy algorithm for cart item organization
- Real-time cart count and total calculation

### Product Recommendations
- Collaborative filtering based on user behavior
- "Customers who bought this also bought" functionality
- Mock purchase history for demonstration

---

## Backend Integration

The backend provides the following REST APIs:

| Feature              | Endpoint                     | Middleware                               |
|---------------------|------------------------------|-----------------------------------------|
| User Login           | `/auth/login`                | ErrorHandler                             |
| User Signup          | `/auth/signup`               | ErrorHandler                             |
| Create Product       | `/products/createproduct`    | AuthMiddleware, AdminMiddleware, ErrorHandler |
| Delete Product       | `/products/:id`              | AuthMiddleware, AdminMiddleware, ErrorHandler |
| Get Product by ID    | `/products/:id`              | AuthMiddleware, AdminMiddleware, ErrorHandler |
| List Products        | `/products/`                 | AuthMiddleware, AdminMiddleware, ErrorHandler |
| Update Product       | `/products/:id`              | AuthMiddleware, AdminMiddleware, ErrorHandler |

The frontend consumes these APIs to provide a seamless user experience.

---

## Project Structure (Frontend)


```bash
src/
├── components/           # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── layout/           # Navigation, footer, and general layout
│   ├── products/         # Product-related components
│   └── cart/             # Cart and checkout components
├── pages/                # Route pages
├── hooks/                # Custom React hooks
├── context/              # React context providers
└── integrations/         # External service integrations (APIs, services)
```

**Explanation:**  
- **components/**: Contains all reusable UI elements, organized by function.  
- **pages/**: Top-level route pages for the application.  
- **hooks/**: Custom React hooks for state management, API calls, and utility functions.  
- **context/**: React Context providers for global state management.  
- **integrations/**: Integrations with external services like APIs or backend endpoints.  


---

## Current Status
✅ Fully functional product catalog and search  
✅ Shopping cart functionality  
✅ User authentication  
✅ Admin product management  
✅ Responsive design  
✅ AI-powered recommendations  

---

## Getting Started

1. **Clone the repository**  
```bash
git clone https://github.com/kushalnepal/farm-fresh-order-hub.git
```
2. Install frontend dependencies

```bash

cd frontend
npm install
```

4.Configure database

Update DATABASE_URL in .env with your MySQL credentials.

Run backend server

```bash

npm run dev
```
Run frontend

```bash

npm run dev
```
Frontend runs on `farm-fresh-order-hub.vercel.app` (Vite default) and connects to backend at `https://ecommerce-backend.kushalnepal.com.np`.

License
MIT License


---

