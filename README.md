# 🪙 Task Mint Server

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-ES%20Modules-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-v5-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM%20v7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=json-web-tokens&logoColor=white)

**A full-featured REST API backend for a micro-task marketplace platform.**  
Workers earn coins by completing tasks. Buyers post tasks and pay workers. Admins keep everything running smoothly.

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [User Roles](#-user-roles)
- [Coin Economy](#-coin-economy)
- [Project Structure](#-project-structure)
- [Scripts](#-scripts)

---

## 🌟 Overview

**Task Mint** is a micro-task marketplace where:
- 🛠️ **Workers** browse and complete tasks to earn coins
- 📋 **Buyers** post tasks, fund them with coins, and review submissions
- 🔑 **Admins** manage users, approve withdrawals, and handle role upgrades

The platform runs on a **coin economy** — buyers purchase coins and spend them on tasks; workers earn coins and can withdraw them as real money.

---

## ✨ Features

- ✅ JWT Authentication with HttpOnly cookies
- ✅ Google OAuth sign-in
- ✅ Role-Based Access Control (WORKER / BUYER / ADMIN)
- ✅ Task creation, management, and categorization
- ✅ Worker submission workflow (submit → review → approve/reject)
- ✅ Coin economy system (purchase, earn, withdraw)
- ✅ Real-time notifications per user
- ✅ Role upgrade requests (Worker → Buyer)
- ✅ Dashboard statistics for each role
- ✅ Zod request validation
- ✅ Graceful server shutdown

---

## 🛠️ Tech Stack

| Technology           | Purpose                            |
|----------------------|------------------------------------|
| **Node.js** (ESM)    | Runtime environment                |
| **Express.js v5**    | HTTP server & routing              |
| **Prisma ORM v7**    | Database access layer              |
| **PostgreSQL**       | Relational database                |
| **JWT**              | Authentication tokens              |
| **bcrypt**           | Password hashing                   |
| **Zod v4**           | Schema-based validation            |
| **cookie-parser**    | Cookie management                  |
| **cors**             | Cross-origin requests              |
| **dotenv**           | Environment configuration          |
| **nodemon**          | Dev hot-reloading                  |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 15
- npm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd task_mint_server

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and fill in your DATABASE_URL, JWT_SECRET, etc.

# 4. Run database migrations
npm run migrate

# 5. (Optional) Seed the database
npm run seed

# 6. Start the development server
npm run dev
```

Server will be running at **http://localhost:5000**

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# PostgreSQL connection string (requires PostgreSQL >= 15)
DATABASE_URL="postgresql://user:password@localhost:5432/task_mint_db"

# JWT secret key for signing tokens
JWT_SECRET="your_super_secret_jwt_key"

# Server port (optional, default: 5000)
PORT=5000
```

---

## 📡 API Reference

Base URL: `http://localhost:5000`

### 🔐 Auth — `/auth`

| Method | Endpoint      | Access  | Description                   |
|--------|---------------|---------|-------------------------------|
| POST   | `/register`   | Public  | Register new account (WORKER) |
| POST   | `/login`      | Public  | Login & receive JWT cookie    |
| POST   | `/google`     | Public  | Google OAuth login            |
| POST   | `/logout`     | Public  | Clear JWT cookie              |
| GET    | `/me`         | 🔒 Auth | Get logged-in user profile    |
| PATCH  | `/profile`    | 🔒 Auth | Update user profile           |

### 📋 Tasks — `/tasks`

| Method | Endpoint            | Access           | Description              |
|--------|---------------------|------------------|--------------------------|
| GET    | `/`                 | Public           | List all active tasks    |
| GET    | `/featured`         | Public           | Get featured tasks       |
| GET    | `/buyer/my-tasks`   | 🔒 BUYER         | Get buyer's own tasks    |
| GET    | `/:id`              | Public           | Get task details by ID   |
| POST   | `/`                 | 🔒 BUYER         | Create a new task        |
| PUT    | `/:id`              | 🔒 BUYER / ADMIN | Update a task            |
| DELETE | `/:id`              | 🔒 BUYER / ADMIN | Delete a task            |

### 📝 Submissions — `/submissions`

| Method | Endpoint              | Access    | Description                      |
|--------|-----------------------|-----------|----------------------------------|
| POST   | `/`                   | 🔒 WORKER | Submit work for a task           |
| GET    | `/my-submissions`     | 🔒 WORKER | View own submitted work          |
| GET    | `/buyer/reviews`      | 🔒 BUYER  | View pending submissions         |
| PATCH  | `/:id/approve`        | 🔒 BUYER  | Approve submission (pays worker) |
| PATCH  | `/:id/reject`         | 🔒 BUYER  | Reject a submission              |

### 💳 Payments — `/payments`

| Method | Endpoint          | Access   | Description                   |
|--------|-------------------|----------|-------------------------------|
| POST   | `/fake-checkout`  | 🔒 BUYER | Purchase coins (simulated)    |
| GET    | `/history`        | 🔒 BUYER | View coin purchase history    |

### 💸 Withdrawals — `/withdrawals`

| Method | Endpoint             | Access    | Description                   |
|--------|----------------------|-----------|-------------------------------|
| POST   | `/`                  | 🔒 WORKER | Request a coin withdrawal     |
| GET    | `/my-withdrawals`    | 🔒 WORKER | View own withdrawal requests  |
| GET    | `/all`               | 🔒 ADMIN  | View all withdrawals          |
| PATCH  | `/:id/approve`       | 🔒 ADMIN  | Approve a withdrawal request  |

### 👤 Users — `/users`

| Method | Endpoint          | Access    | Description               |
|--------|-------------------|-----------|---------------------------|
| GET    | `/top-workers`    | Public    | Get top coin earners      |
| GET    | `/platform-stats` | Public    | Get platform statistics   |
| PATCH  | `/profile`        | 🔒 Auth   | Update profile            |
| GET    | `/`               | 🔒 ADMIN  | List all users            |
| PATCH  | `/:id/role`       | 🔒 ADMIN  | Change a user's role      |
| DELETE | `/:id`            | 🔒 ADMIN  | Delete a user             |

### 📊 Dashboard — `/dashboard`

| Method | Endpoint          | Access    | Description                    |
|--------|-------------------|-----------|--------------------------------|
| GET    | `/buyer-stats`    | 🔒 BUYER  | Buyer's dashboard data         |
| GET    | `/worker-stats`   | 🔒 WORKER | Worker's dashboard data        |
| GET    | `/admin-stats`    | 🔒 ADMIN  | Admin dashboard overview       |

### 🔔 Notifications — `/notifications`

| Method | Endpoint | Access   | Description              |
|--------|----------|----------|--------------------------|
| GET    | `/`      | 🔒 Auth  | Get all notifications    |

### 🎭 Role Requests — `/role-requests`

| Method | Endpoint  | Access    | Description                        |
|--------|-----------|-----------|------------------------------------|
| POST   | `/`       | 🔒 WORKER | Request upgrade to BUYER role      |
| GET    | `/my`     | 🔒 Auth   | Check own role request status      |
| GET    | `/`       | 🔒 ADMIN  | View all pending role requests     |
| PATCH  | `/:id`    | 🔒 ADMIN  | Approve or reject a role request   |

---

## 🗃️ Database Schema

```
User ────────────────── Task
  │ (buyer)              │
  │                      │ has many
  │ (worker) ────── Submission
  │
  ├── Payment
  ├── Withdrawal
  ├── Notification
  └── RoleRequest
```

### Enums

| Enum               | Values                                    |
|--------------------|-------------------------------------------|
| `Role`             | `WORKER`, `BUYER`, `ADMIN`                |
| `UserStatus`       | `ACTIVE`, `SUSPENDED`, `DELETED`          |
| `TaskStatus`       | `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED` |
| `SubmissionStatus` | `PENDING`, `APPROVED`, `REJECTED`         |
| `WithdrawalStatus` | `PENDING`, `APPROVED`, `REJECTED`         |
| `PaymentStatus`    | `COMPLETED`, `PENDING`, `FAILED`          |
| `RoleRequestStatus`| `PENDING`, `APPROVED`, `REJECTED`         |

---

## 👥 User Roles

| Role     | Description                                              |
|----------|----------------------------------------------------------|
| `WORKER` | Default role. Completes tasks, earns coins, can withdraw |
| `BUYER`  | Posts tasks, funds with coins, reviews submissions       |
| `ADMIN`  | Platform administrator with full management access       |

> Workers can request to become Buyers via the **Role Request** system.

---

## 💰 Coin Economy

```
BUYER purchases coins via /payments/fake-checkout
         ↓
BUYER creates task (coins reserved × payableAmount × requiredWorkers)
         ↓
WORKER submits work for task
         ↓
BUYER reviews submission
    ├── APPROVE → Worker receives payableAmount coins
    └── REJECT  → No coins transferred
         ↓
WORKER requests withdrawal → ADMIN approves → coins converted to money
```

---

## 📁 Project Structure

```
task_mint_server/
├── prisma/
│   ├── schema.prisma        # All database models & enums
│   ├── seed.js              # Seed data for development
│   └── migrations/          # Auto-generated migration files
├── src/
│   ├── server.js            # Entry point: app setup & route registration
│   ├── config/
│   │   └── db.connect.js    # Prisma client instance
│   ├── routes/              # Route definitions (Express Router)
│   ├── controller/          # Business logic for each domain
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification
│   │   ├── authorizeRoles.js    # Role-based authorization
│   │   └── validateRequest.js   # Zod request validation
│   ├── Validators/
│   │   └── authValidators.js    # Zod schemas for auth
│   └── utils/               # Helper functions
├── .env.example             # Environment variable template
├── package.json
└── AGENT.md                 # AI agent project overview
```

---

## 📜 Scripts

```bash
npm run dev       # Start development server with hot-reload (nodemon)
npm start         # Start production server
npm run seed      # Seed the database with sample data
npm run migrate   # Apply Prisma database migrations
npm run prisma    # Run any Prisma CLI command
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<div align="center">
Made with ❤️ — Task Mint Server
</div>
