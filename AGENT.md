# 🤖 AGENT.md — Task Mint Server

> **Purpose:** This file gives an AI agent (or developer) a complete, structured overview of this project so any task can be understood and executed quickly and correctly.

---

## 📌 Project Identity

| Field        | Value                                      |
|-------------|---------------------------------------------|
| **Name**     | Task Mint Server                           |
| **Type**     | REST API Backend                           |
| **Runtime**  | Node.js (ES Modules — `"type": "module"`)  |
| **Framework**| Express.js v5                              |
| **Database** | PostgreSQL (via Prisma ORM v7)             |
| **Auth**     | JWT (HttpOnly cookie) + Google OAuth       |
| **Port**     | `5000` (default)                           |
| **Entry**    | `src/server.js`                            |

---

## 🗂️ Project Structure

```
task_mint_server/
├── prisma/
│   ├── schema.prisma        # Database models & enums
│   ├── seed.js              # Database seed script
│   └── migrations/          # Prisma migration files
├── src/
│   ├── server.js            # App entry — registers middleware & routes
│   ├── config/
│   │   └── db.connect.js    # Prisma client connect/disconnect helpers
│   ├── routes/              # Express routers (one per domain)
│   │   ├── AuthRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── submissionRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── withdrawalRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── userRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── roleRequestRoutes.js
│   ├── controller/          # Business logic (one per domain)
│   │   ├── authController.js
│   │   ├── taskController.js
│   │   ├── submissionController.js
│   │   ├── paymentController.js
│   │   ├── withdrawalController.js
│   │   ├── notificationController.js
│   │   ├── userController.js
│   │   ├── dashboardController.js
│   │   └── roleRequestController.js
│   ├── middleware/
│   │   ├── authMiddleware.js      # Verifies JWT from cookie
│   │   ├── authorizeRoles.js      # Role-based access control
│   │   └── validateRequest.js     # Zod schema validator
│   ├── Validators/
│   │   └── authValidators.js      # Zod schemas: RegisterSchema, LoginSchema
│   └── utils/                     # Shared utility helpers
├── .env                           # Real secrets (gitignored)
├── .env.example                   # Template for environment variables
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

---

## 👥 User Roles & Permissions

The system has **3 roles** enforced by `authorizeRoles` middleware:

| Role    | What They Can Do                                                                 |
|---------|----------------------------------------------------------------------------------|
| `WORKER`| Browse tasks, submit task work, request withdrawal, request role upgrade to BUYER|
| `BUYER` | Create/manage tasks, review & approve/reject submissions, make coin payments      |
| `ADMIN` | Manage all users, approve withdrawals, resolve role requests, view all stats      |

> **Default role on register:** `WORKER`  
> **Coins on register:** 10 free coins

---

## 🗃️ Database Models (Prisma)

### `User`
- `id`, `fullName`, `email`, `password?`, `role` (WORKER/BUYER/ADMIN), `status` (ACTIVE/SUSPENDED/DELETED), `coins` (default: 10), `photoUrl?`
- Relations: tasks (as buyer), submissions (as worker), withdrawals, payments, notifications, roleRequests

### `Task`
- `id`, `title`, `detail`, `taskLink?`, `requiredWorkers`, `totalWorkers`, `payableAmount`, `completionDate`, `submissionInfo`, `imageUrl?`, `category`, `status` (ACTIVE/PAUSED/COMPLETED/CANCELLED)
- Belongs to: `buyer` (User)
- Has many: `submissions`

### `Submission`
- `id`, `taskId`, `workerId`, `buyerId`, `submissionDetails`, `payableAmount`, `status` (PENDING/APPROVED/REJECTED)
- Belongs to: Task, Worker (User)

### `Payment`
- `id`, `transactionId`, `buyerId`, `coins`, `amount`, `cardLast4`, `status` (COMPLETED/PENDING/FAILED)
- Belongs to: Buyer (User)

### `Withdrawal`
- `id`, `workerId`, `coins`, `amount`, `paymentMethod`, `accountNumber`, `status` (PENDING/APPROVED/REJECTED)
- Belongs to: Worker (User)

### `Notification`
- `id`, `userId`, `type`, `title`, `text`, `isRead`

### `RoleRequest`
- `id`, `userId`, `status` (PENDING/APPROVED/REJECTED), `note?`

---

## 🌐 API Routes Map

### Auth — `/auth`
| Method | Path          | Role     | Description                  |
|--------|---------------|----------|------------------------------|
| POST   | `/register`   | Public   | Register new user (WORKER)   |
| POST   | `/login`      | Public   | Login, sets JWT cookie        |
| POST   | `/google`     | Public   | Google OAuth sign-in          |
| POST   | `/logout`     | Public   | Clear JWT cookie              |
| GET    | `/me`         | Auth     | Get current user profile      |
| PATCH  | `/profile`    | Auth     | Update profile                |

### Tasks — `/tasks`
| Method | Path               | Role         | Description              |
|--------|--------------------|--------------|--------------------------|
| GET    | `/`                | Public       | List all tasks           |
| GET    | `/featured`        | Public       | Get featured tasks       |
| GET    | `/buyer/my-tasks`  | BUYER        | Get buyer's own tasks    |
| GET    | `/:id`             | Public       | Get task by ID           |
| POST   | `/`                | BUYER        | Create a new task        |
| PUT    | `/:id`             | BUYER/ADMIN  | Update a task            |
| DELETE | `/:id`             | BUYER/ADMIN  | Delete a task            |

### Submissions — `/submissions`
| Method | Path                    | Role   | Description                     |
|--------|-------------------------|--------|---------------------------------|
| POST   | `/`                     | WORKER | Submit work for a task          |
| GET    | `/my-submissions`       | WORKER | View own submissions            |
| GET    | `/buyer/reviews`        | BUYER  | View submissions to review      |
| PATCH  | `/:id/approve`          | BUYER  | Approve a submission            |
| PATCH  | `/:id/reject`           | BUYER  | Reject a submission             |

### Payments — `/payments`
| Method | Path             | Role  | Description                       |
|--------|------------------|-------|-----------------------------------|
| POST   | `/fake-checkout` | BUYER | Buy coins (simulated checkout)    |
| GET    | `/history`       | BUYER | View payment history              |

### Withdrawals — `/withdrawals`
| Method | Path                | Role   | Description                  |
|--------|---------------------|--------|------------------------------|
| POST   | `/`                 | WORKER | Request a withdrawal         |
| GET    | `/my-withdrawals`   | WORKER | View own withdrawal requests |
| GET    | `/all`              | ADMIN  | View all withdrawal requests |
| PATCH  | `/:id/approve`      | ADMIN  | Approve a withdrawal         |

### Users — `/users`
| Method | Path              | Role  | Description                   |
|--------|-------------------|-------|-------------------------------|
| GET    | `/top-workers`    | Public| Get top-earning workers       |
| GET    | `/platform-stats` | Public| Get platform statistics       |
| PATCH  | `/profile`        | Auth  | Update own profile            |
| GET    | `/`               | ADMIN | Get all users                 |
| PATCH  | `/:id/role`       | ADMIN | Update a user's role          |
| DELETE | `/:id`            | ADMIN | Delete a user                 |

### Dashboard — `/dashboard`
| Method | Path             | Role   | Description                     |
|--------|------------------|--------|---------------------------------|
| GET    | `/buyer-stats`   | BUYER  | Buyer's dashboard statistics    |
| GET    | `/worker-stats`  | WORKER | Worker's dashboard statistics   |
| GET    | `/admin-stats`   | ADMIN  | Admin dashboard statistics      |

### Notifications — `/notifications`
| Method | Path | Role | Description                     |
|--------|------|------|---------------------------------|
| GET    | `/`  | Auth | Get user's notifications        |

### Role Requests — `/role-requests`
| Method | Path   | Role   | Description                    |
|--------|--------|--------|--------------------------------|
| POST   | `/`    | WORKER | Submit a role upgrade request  |
| GET    | `/my`  | Auth   | Check own role request status  |
| GET    | `/`    | ADMIN  | Get all role requests          |
| PATCH  | `/:id` | ADMIN  | Approve/reject a role request  |

---

## 🔐 Authentication Flow

1. User registers/logs in → server creates a **JWT** signed with `JWT_SECRET`
2. JWT is stored in an **HttpOnly cookie** (sent via `cookie-parser`)
3. All protected routes call `authMiddleware` → reads cookie → verifies JWT → attaches `req.user`
4. `authorizeRoles(...roles)` checks `req.user.role` against allowed roles

---

## 💰 Coin Economy

- New users receive **10 coins** on registration
- **Buyers** purchase more coins via `/payments/fake-checkout`
- Buyers spend coins when they **post tasks** (deducted per worker slot × payableAmount)
- **Workers** earn coins when their submissions are **approved** by buyer
- Workers can **withdraw** coins as real money via `/withdrawals`

---

## 🔧 Key Dependencies

| Package             | Purpose                              |
|---------------------|--------------------------------------|
| `express@^5`        | HTTP server & routing                |
| `@prisma/client@^7` | Database ORM (PostgreSQL)            |
| `@prisma/adapter-pg`| Prisma PostgreSQL adapter            |
| `pg`                | PostgreSQL driver                    |
| `jsonwebtoken`      | JWT creation & verification          |
| `bcrypt`            | Password hashing                     |
| `cookie-parser`     | HTTP cookie parsing                  |
| `cors`              | Cross-origin request handling        |
| `zod@^4`            | Request body validation schemas      |
| `dotenv`            | Environment variable loading         |
| `nodemon`           | Dev auto-restart                     |

---

## ⚙️ Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="your_jwt_secret"
PORT=5000
```
> Copy `.env.example` to `.env` and fill in real values.

---

## 🚀 Scripts

```bash
npm run dev      # Start with nodemon (development)
npm start        # Start with node (production)
npm run seed     # Seed the database
npm run migrate  # Run Prisma migrations
```

---

## 🧠 Agent Guidelines

When you receive a task in this project, follow this checklist:

1. **Identify the domain** — which model/route/controller is affected? (auth, task, submission, payment, withdrawal, user, notification, roleRequest, dashboard)
2. **Check the role** — which user role(s) should have access? Enforce with `authorizeRoles`
3. **Validate inputs** — use Zod validators in `src/Validators/` for any new endpoints
4. **Use Prisma** — all DB access goes through `@prisma/client`. Follow existing patterns in controllers
5. **Follow ES Module syntax** — always use `import/export`, never `require()`
6. **Response format** — follow this consistent structure:
   ```json
   {
     "message": "...",
     "success": true,
     "statusCode": 200,
     "data": { ... },
     "error": null
   }
   ```
7. **Error handling** — use try/catch in controllers; do NOT crash the server
8. **Auth** — never skip `authMiddleware` on protected endpoints
9. **Coin logic** — any changes involving coins must be atomic (use Prisma transactions)
10. **No breaking changes** — preserve existing route signatures unless explicitly told to change them
