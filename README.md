# Finora — Personal Finance Manager

A full-stack MERN personal finance tracker: React (Vite) + Tailwind CSS on the front, Node.js + Express + MongoDB Atlas on the back, JWT authentication.

## Features

- Sign up / log in with JWT, bcrypt-hashed passwords, protected routes, logout
- Dashboard: total balance, income, expenses, monthly budget, 6-month income-vs-expense chart, expense donut chart, budget progress, recent transactions, month selector, quick add
- Transactions: add / edit / delete (modal forms), search by title, filter by type / category / date range, sort newest or oldest, empty states, CSV export
- Budget: set and edit a budget per month, live utilisation %, remaining amount, warning at 80%, exceeded alert
- Categories: 8 default expense categories (+ 3 income) per user, create / edit / delete your own, icon picker, deletion blocked while a category is in use
- Dark mode, responsive layout (mobile / tablet / desktop), toast notifications, downloadable monthly report (CSV)
- Every dashboard number is computed in MongoDB from the user's own transactions

## Project structure

```
finora/
├── server/
│   ├── config/db.js
│   ├── controllers/   auth, transaction, budget, category, dashboard
│   ├── middleware/    authMiddleware.js, errorMiddleware.js, validate.js
│   ├── models/        User, Transaction, Category, Budget
│   ├── routes/        auth, transaction, budget, category, dashboard
│   ├── utils/         asyncHandler, httpError, dates, generateToken, defaultCategories
│   ├── scripts/smokeTest.js
│   ├── .env.example
│   └── server.js
└── client/
    ├── public/favicon.svg
    ├── src/
    │   ├── components/  Sidebar, Navbar, Layout, StatCard, TransactionTable, TransactionModal,
    │   │                BudgetProgress, ProtectedRoute, CategoryModal, Modal, ConfirmDialog,
    │   │                MonthPicker, CategoryIcon, EmptyState, Spinner, AuthShell
    │   ├── pages/       Login, Signup, Dashboard, Transactions, Budgets
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js
    │   ├── hooks/       useTheme, useDebounce, useCategories
    │   ├── utils/       format, validators, csv, icons
    │   ├── App.jsx, main.jsx, index.css
    ├── vercel.json
    └── .env.example
```

## Run it locally

You need Node 18+ and a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster.

### 1. MongoDB Atlas

1. Create a free **M0** cluster.
2. **Database Access** → Add a database user (username + password). Avoid special characters in the password, or URL-encode them.
3. **Network Access** → Add IP address → `0.0.0.0/0` (allow from anywhere; needed for Render).
4. **Database** → Connect → Drivers → copy the connection string. Replace `<password>` and add the database name `finora` before the `?`:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/finora?retryWrites=true&w=majority`

### 2. Backend

```bash
cd server
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

Open `server/.env` and fill in `MONGO_URI` and `JWT_SECRET`. Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Start it:

```bash
npm run dev
```

You should see `MongoDB connected` and `Finora API running on port 5000`. Open http://localhost:5000/api/health — it should return `{"status":"ok",...}`.

### 3. Frontend

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173, create an account and start adding transactions.

## API reference

All routes except register/login need the header `Authorization: Bearer <token>`.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/auth/register | Create account (also creates default categories) |
| POST | /api/auth/login | Log in, returns JWT |
| GET | /api/auth/me | Current user |
| GET | /api/transactions | List. Query: `search`, `type`, `category`, `startDate`, `endDate`, `sort=newest\|oldest` |
| POST | /api/transactions | Create |
| PUT | /api/transactions/:id | Update |
| DELETE | /api/transactions/:id | Delete |
| GET | /api/dashboard/summary?month=11&year=2026 | All dashboard figures, charts and budget stats |
| GET | /api/budgets | List budgets (optional `month`, `year`) |
| POST | /api/budgets | Set the budget for a month (creates or updates) |
| PUT | /api/budgets/:id | Update a budget amount |
| GET | /api/categories | List categories |
| POST | /api/categories | Create |
| PUT | /api/categories/:id | Rename / change icon |
| DELETE | /api/categories/:id | Delete (409 if transactions still use it) |

## Calculation rules

- Total Income = sum of all income transactions
- Total Expenses = sum of all expense transactions
- Total Balance = Total Income − Total Expenses
- Monthly Expenses = expense transactions inside the selected month and year
- Remaining Budget = Monthly Budget − Monthly Expenses
- Budget % = Monthly Expenses ÷ Monthly Budget × 100 (warning at 80%, exceeded above 100%)

Dates are stored as UTC midnight of the chosen calendar day (`YYYY-MM-DD`), so a transaction never moves to another month because of a timezone.

## Security notes

- Passwords hashed with bcrypt (cost 10); the hash is never returned by the API (`select: false` plus a `toJSON` filter)
- The user id comes from the verified JWT, never from the request. Every query includes `user: req.user._id`, so users cannot read or change each other's data
- Input validated with express-validator; bad ObjectIds return 400; missing records return 404
- CORS only allows the origins in `CLIENT_URL`
- Secrets live in environment variables; `.env` is git-ignored
- The JWT is kept in `localStorage`. This is simple and fine for a course project; an httpOnly cookie is the more hardened option but needs extra cross-site cookie setup between Vercel and Render

See `DEPLOYMENT.md` to publish and `TESTING.md` to verify everything.
