# Testing Finora

## 1. Automated API check (about 36 assertions)

With the backend running (`npm run dev` in `server/`), open a second terminal:

```bash
cd server
npm run test:smoke
```

You should end with `N passed, 0 failed`. It checks registration, login, weak and duplicate input, JWT protection, category CRUD, transaction CRUD, the balance / budget maths after every edit and delete, and that a second user cannot read, edit or delete the first user's data. It creates two throw-away users in your database.

## 2. Manual UI checklist

**Auth**
- [ ] Sign up with mismatched passwords → inline error
- [ ] Sign up with `abc` → password rules turn red, form blocked
- [ ] Sign up with an existing email → "already exists" banner
- [ ] Log in with a wrong password → "Invalid email or password"
- [ ] Log in correctly → redirected to the dashboard
- [ ] Refresh the page → still logged in
- [ ] Log out → redirected to login; visiting `/dashboard` sends you back to `/login`

**Transactions**
- [ ] Add an income and an expense → they appear in the table
- [ ] Edit one (change amount and category) → table updates
- [ ] Delete one → confirmation dialog, then it disappears
- [ ] Search by title, filter by type, category and date range, sort newest/oldest
- [ ] Filters with no match → "No transactions match your filters"
- [ ] Export CSV → file opens in Excel with the rows shown

**Dashboard** (check after every add / edit / delete)
- [ ] Balance = total income − total expenses
- [ ] Changing the month changes the month figures and the donut chart
- [ ] Bar chart shows the last 6 months
- [ ] Quick "Add transaction" updates everything without a page reload
- [ ] "Report" downloads a CSV with summary, categories and transactions

**Budget**
- [ ] Set a budget → progress bar and remaining amount appear
- [ ] Spend over 80% → amber warning; over 100% → red "exceeded" alert
- [ ] Edit the budget → numbers change
- [ ] Switch to another month → that month has its own budget

**Categories**
- [ ] Create a custom category with an icon, rename it, delete it
- [ ] Delete a category that has transactions → blocked with a message
- [ ] Creating a duplicate name → error

**Isolation**
- [ ] Log in as a second user → no transactions, default categories only

**Other**
- [ ] Dark mode toggle works and survives a refresh
- [ ] Resize to phone width → sidebar becomes a slide-in menu, tables scroll, modals fit

## 3. Manual API checks (optional, with curl)

```bash
curl http://localhost:5000/api/health
curl -i http://localhost:5000/api/transactions            # 401 without a token
curl -i -X DELETE http://localhost:5000/api/transactions/abc -H "Authorization: Bearer <token>"   # 400 invalid id
```
