# 📦 Enterprise Inventory Management ERP System

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-000000.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208.5-47A248.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A full-stack, enterprise-grade **Inventory Management & ERP Solution** built for scalability, performance, and modern user experience. Features real-time stock tracking, Point of Sale (POS) billing with thermal invoice printing, double-entry financial accounting, multi-warehouse management, and intelligent analytics.

---

## 🚀 Key Features

### 📦 Inventory & Stock Control
- **Multi-Warehouse & Transfers**: Track stock across multiple branch locations and warehouses with full transfer auditing.
- **Batch & Serial Tracking**: Manage product batches, expiration dates, stock adjustments, and reorder alerts.
- **Brand & Category Taxonomy**: Hierarchical categorization with customizable units and tax rate assignments.

### 🛒 Sales & Point of Sale (POS)
- **Fast POS Interface**: Quick barcode search, customizable discount rules, payment method splits, and instant calculation.
- **Custom Print Engine**: Professional browser-native printing for thermal receipts (80mm/58mm) and standard A4 tax invoices.
- **Customer Directory**: Track customer purchase history, outstanding balances, and ledger history.

### 📋 Purchases & Supplier Management
- **Purchase Order Workflow**: Manage purchase orders, receiving, inventory stock updates, and supplier payables.
- **Supplier Ledgers**: Detailed tracking of purchase history, payments, and open balances.

### 💰 Financial Accounting & Expenses
- **Double-Entry Bookkeeping**: Automated journal entries for sales, purchases, payments, and stock adjustments.
- **Expense Management**: Categorized business expenditure logging and account balance tracking.
- **Chart of Accounts**: Comprehensive ledger accounts management.

### 📊 Analytics & Reporting
- **Intelligent Dashboards**: Real-time sales trends, top-performing items, low-stock warnings, and revenue metrics.
- **Interactive Visualizations**: Dynamic charts powered by Recharts.

### 🔐 Security & Operations
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Admin, Manager, Cashier, and Stock Keeper roles.
- **Audit Logs**: Immutable action tracking for operational accountability.
- **Real-Time Notifications**: WebSocket-based instant updates via Socket.io.

---

## 🛠️ Technology Stack

### **Backend (`/backend`)**
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js
* **Database**: MongoDB with Mongoose ORM
* **Authentication**: JWT & Bcrypt password hashing
* **Validation**: Joi & Express-Validator
* **Real-time**: Socket.io
* **Security & Performance**: Helmet, Rate Limiting, CORS, Mongo-Sanitize, Compression
* **Logging**: Winston with Daily Rotate File

### **Frontend (`/frontend`)**
* **Core**: React 18 & Vite
* **State Management**: Redux Toolkit & React Query (TanStack Query v5)
* **Styling**: Tailwind CSS, Framer Motion, Emotion & MUI Material UI
* **Form Handling**: React Hook Form with Zod validation
* **Icons**: Lucide React & MUI Icons
* **PDF & Printing**: Html2canvas, jsPDF, and native CSS `@media print` drivers

---

## 📂 Project Architecture

```
inventory-management/
├── backend/                  # Node.js Express REST API
│   ├── src/
│   │   ├── config/           # Database, env, logger, & socket config
│   │   ├── middleware/       # Auth, role, error handler, upload middleware
│   │   ├── modules/          # Domain-driven feature modules
│   │   │   ├── auth/         # Authentication & security
│   │   │   ├── products/     # Products, variants, & pricing
│   │   │   ├── sales/        # Sales orders & POS engine
│   │   │   ├── purchases/    # Purchase orders & suppliers
│   │   │   ├── finance/      # Expenses, accounts, & journals
│   │   │   ├── warehouses/   # Stock movements & transfers
│   │   │   └── ...           # Customers, taxes, units, audit, etc.
│   │   ├── seedAllData.js    # Database seeder script
│   │   └── server.js         # API entry point
│   └── package.json
│
├── frontend/                 # React Single Page Application (SPA)
│   ├── src/
│   │   ├── components/       # Reusable UI & custom print templates
│   │   ├── layouts/          # Responsive Dashboard & Auth layouts
│   │   ├── modules/          # Feature pages & view controllers
│   │   ├── services/         # Axios client & Socket.io connection
│   │   ├── store/            # Redux store & feature slices
│   │   ├── App.jsx           # Application router & providers
│   │   └── main.jsx          # DOM mount point
│   └── package.json
│
└── README.md                 # System documentation
```

---

## ⚙️ Getting Started

### **Prerequisites**
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **MongoDB** local instance (port `27017`) or MongoDB Atlas connection URI

---

### **1. Installation**

Clone the repository to your local machine:
```bash
git clone https://github.com/risewithmediaofficial-collab/inventory-managment.git
cd inventory-managment
```

---

### **2. Environment Configuration**

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/inventory_erp
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:5173
```

---

### **3. Database Seeding**

Populate your database with demo data (Admin user, warehouses, categories, demo products, customers, suppliers):

```bash
cd backend
npm install
npm run seed:all:force
```

> **Default Admin Credentials**:
> * **Email**: `admin@example.com`
> * **Password**: `Admin@123`

---

### **4. Running the Application**

#### **Start Backend Server**
```bash
cd backend
npm run dev
```
*API will run at:* `http://localhost:5000`

#### **Start Frontend Client**
```bash
cd frontend
npm install
npm run dev
```
*Web App will run at:* `http://localhost:5173`

---

## 🐳 Docker Container Deployment

The project includes full Docker support for containerized deployment using Docker & Docker Compose.

### **1. Run Entire Stack with Docker Compose**
Run the following command from the root directory:

```bash
docker-compose up -d --build
```

This starts three orchestrated containers:
- **`inventory_db`**: MongoDB container running on port `27017` with persistent data volume.
- **`inventory_backend`**: Node.js / Express REST API running on port `5000`.
- **`inventory_frontend`**: Nginx web server serving compiled React SPA on port `85` (mapped `85:80`), pre-configured to reverse-proxy `/api` & WebSocket calls to the backend.

### **2. Stop Containers**
```bash
docker-compose down
```

---

## ⚙️ GitHub Actions CI/CD Pipeline

The project includes an automated GitHub Actions CI/CD workflow defined in [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml):

- **Automated Validation**: On every `push` or `pull_request` to `main`, Node.js dependencies are checked, and the React frontend bundle is built.
- **Docker Stack Verification**: Validates `docker-compose.yml` syntax and builds production Docker images for both `backend` and `frontend`.
- **Automated Deployment Trigger**: Triggers container rebuilds upon pushing to `main`.

---

## 📜 Available Scripts

### **Backend Scripts (`/backend`)**
* `npm run dev`: Starts the backend server with `nodemon` live-reload.
* `npm run start`: Runs backend in production mode.
* `npm run seed:all:force`: Clears database and seeds realistic full dataset.

### **Frontend Scripts (`/frontend`)**
* `npm run dev`: Launches Vite development server.
* `npm run build`: Compiles production build.
* `npm run preview`: Previews production build locally.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
