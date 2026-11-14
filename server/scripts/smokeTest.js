// End-to-end API check. Start the server first (npm run dev), then in another terminal:
//   npm run test:smoke
// Optional: API_URL=https://your-api.onrender.com/api npm run test:smoke
// It creates two throw-away users, so run it against a dev/test database.

const BASE = process.env.API_URL || 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

const check = (name, condition, extra = '') => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
};

const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }
  return { status: res.status, data };
};

const run = async () => {
  const stamp = Date.now();
  const password = 'Test1234';
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const today = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  console.log(`Testing ${BASE}\n\nAuth`);
  const a = await call('POST', '/auth/register', {
    body: { name: 'Alice Test', email: `alice${stamp}@test.com`, password, confirmPassword: password },
  });
  check('register user A (201)', a.status === 201 && a.data.token, JSON.stringify(a.data));
  check('password hash is not returned', a.data.user && !('password' in a.data.user));

  const weak = await call('POST', '/auth/register', { body: { name: 'Weak', email: `w${stamp}@test.com`, password: 'abc' } });
  check('weak password rejected (400)', weak.status === 400);

  const dup = await call('POST', '/auth/register', { body: { name: 'Alice', email: `alice${stamp}@test.com`, password } });
  check('duplicate email rejected (409)', dup.status === 409);

  const bad = await call('POST', '/auth/login', { body: { email: `alice${stamp}@test.com`, password: 'Wrong1234' } });
  check('wrong password rejected (401)', bad.status === 401);

  const login = await call('POST', '/auth/login', { body: { email: `alice${stamp}@test.com`, password } });
  check('login works (200)', login.status === 200 && login.data.token);
  const tokenA = login.data.token;

  const me = await call('GET', '/auth/me', { token: tokenA });
  check('GET /auth/me returns the user', me.status === 200 && me.data.user?.name === 'Alice Test');
  check('protected route without token (401)', (await call('GET', '/transactions')).status === 401);

  const b = await call('POST', '/auth/register', { body: { name: 'Bob Test', email: `bob${stamp}@test.com`, password } });
  const tokenB = b.data.token;

  console.log('\nCategories');
  const cats = await call('GET', '/categories', { token: tokenA });
  const expenseCat = cats.data.categories?.find((c) => c.type === 'expense' && c.name === 'Food');
  const incomeCat = cats.data.categories?.find((c) => c.type === 'income' && c.name === 'Salary');
  check('default categories created (11)', cats.data.categories?.length === 11);

  const custom = await call('POST', '/categories', { token: tokenA, body: { name: 'Gym', icon: 'Dumbbell', type: 'expense' } });
  check('create custom category (201)', custom.status === 201);
  const dupCat = await call('POST', '/categories', { token: tokenA, body: { name: 'gym', icon: 'Dumbbell', type: 'expense' } });
  check('duplicate category name rejected (409)', dupCat.status === 409);
  const renamed = await call('PUT', `/categories/${custom.data.category._id}`, { token: tokenA, body: { name: 'Fitness', icon: 'Dumbbell' } });
  check('edit category', renamed.status === 200 && renamed.data.category.name === 'Fitness');
  const delCat = await call('DELETE', `/categories/${custom.data.category._id}`, { token: tokenA });
  check('delete unused category (200)', delCat.status === 200);

  console.log('\nTransactions + dashboard maths');
  const inc = await call('POST', '/transactions', {
    token: tokenA,
    body: { title: 'Salary', amount: 5000, type: 'income', category: incomeCat._id, date: today },
  });
  check('create income (201)', inc.status === 201, JSON.stringify(inc.data));
  const exp = await call('POST', '/transactions', {
    token: tokenA,
    body: { title: 'Groceries', amount: 1200, type: 'expense', category: expenseCat._id, date: today, notes: 'weekly' },
  });
  check('create expense (201)', exp.status === 201);
  const expId = exp.data.transaction?._id;

  const mismatch = await call('POST', '/transactions', {
    token: tokenA,
    body: { title: 'Wrong', amount: 10, type: 'income', category: expenseCat._id, date: today },
  });
  check('category/type mismatch rejected (400)', mismatch.status === 400);

  const budget = await call('POST', '/budgets', { token: tokenA, body: { amount: 2000, month, year } });
  check('set budget (201)', budget.status === 201);
  const budgetId = budget.data.budget?._id;

  let s = (await call('GET', `/dashboard/summary?month=${month}&year=${year}`, { token: tokenA })).data;
  check('balance = income - expenses (3800)', s.totals?.balance === 3800, JSON.stringify(s.totals));
  check('budget % = 60', s.budgetStats?.percentage === 60);
  check('remaining budget = 800', s.budgetStats?.remaining === 800);
  check('category breakdown has Food', s.categoryBreakdown?.[0]?.name === 'Food');

  const upd = await call('PUT', `/transactions/${expId}`, {
    token: tokenA,
    body: { title: 'Groceries', amount: 1800, type: 'expense', category: expenseCat._id, date: today },
  });
  check('edit transaction (200)', upd.status === 200);
  s = (await call('GET', `/dashboard/summary?month=${month}&year=${year}`, { token: tokenA })).data;
  check('after edit: balance 3200', s.totals?.balance === 3200);
  check('after edit: status = warning (90%)', s.budgetStats?.status === 'warning');

  const budgetUpd = await call('PUT', `/budgets/${budgetId}`, { token: tokenA, body: { amount: 1500 } });
  check('edit budget (200)', budgetUpd.status === 200);
  s = (await call('GET', `/dashboard/summary?month=${month}&year=${year}`, { token: tokenA })).data;
  check('after budget edit: status = exceeded', s.budgetStats?.status === 'exceeded');

  const inUse = await call('DELETE', `/categories/${expenseCat._id}`, { token: tokenA });
  check('category in use cannot be deleted (409)', inUse.status === 409);

  const list = await call('GET', '/transactions?search=gro&type=expense&sort=oldest', { token: tokenA });
  check('search + filter + sort works', list.data.count === 1);

  console.log('\nSecurity / isolation');
  check("user B cannot edit A's transaction (404)", (await call('PUT', `/transactions/${expId}`, {
    token: tokenB,
    body: { title: 'Hack', amount: 1, type: 'expense', category: expenseCat._id, date: today },
  })).status === 404);
  check("user B cannot delete A's transaction (404)", (await call('DELETE', `/transactions/${expId}`, { token: tokenB })).status === 404);
  check("user B cannot edit A's budget (404)", (await call('PUT', `/budgets/${budgetId}`, { token: tokenB, body: { amount: 1 } })).status === 404);
  check("user B sees none of A's transactions", (await call('GET', '/transactions', { token: tokenB })).data.count === 0);
  const sb = (await call('GET', `/dashboard/summary?month=${month}&year=${year}`, { token: tokenB })).data;
  check("user B's dashboard is empty", sb.totals?.balance === 0 && sb.budget === null);
  check('invalid ObjectId returns 400', (await call('DELETE', '/transactions/not-an-id', { token: tokenA })).status === 400);

  const del = await call('DELETE', `/transactions/${expId}`, { token: tokenA });
  check('delete transaction (200)', del.status === 200);
  s = (await call('GET', `/dashboard/summary?month=${month}&year=${year}`, { token: tokenA })).data;
  check('after delete: balance 5000', s.totals?.balance === 5000);
  check('deleted transaction is gone (404 on repeat)', (await call('DELETE', `/transactions/${expId}`, { token: tokenA })).status === 404);

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
};

run().catch((err) => {
  console.error('Smoke test crashed. Is the server running?', err.message);
  process.exit(1);
});
