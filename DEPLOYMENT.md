# Deploying Finora (GitHub → MongoDB Atlas → Render → Vercel)

Order matters: database → backend → frontend → connect them.

## 0. Push to GitHub

From the `finora/` folder:

```bash
git init
git add .
git status          # check that no ".env" file is listed!
git commit -m "Finora MERN finance tracker"
git branch -M main
git remote add origin https://github.com/<your-username>/finora.git
git push -u origin main
```

Create the empty repository on github.com first (no README, no .gitignore).

## 1. MongoDB Atlas

Follow "MongoDB Atlas" in `README.md`. For Render you **must** allow `0.0.0.0/0` under Network Access. Keep your connection string ready.

## 2. Backend on Render

1. render.com → **New +** → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** Free
3. **Environment** variables:

   | Key | Value |
   | --- | --- |
   | `MONGO_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string (not the same as your local one) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `CLIENT_URL` | leave a placeholder for now, e.g. `http://localhost:5173` (you fix it in step 4) |
   | `NODE_ENV` | `production` |

   Do **not** set `PORT`; Render provides it.
4. Click **Create Web Service**. When the deploy is live, open `https://<your-service>.onrender.com/api/health`. It should show `{"status":"ok"...}`.

> The free tier sleeps after ~15 minutes without traffic. The first request after that can take up to a minute. This is normal. The frontend waits up to 60 seconds.

## 3. Frontend on Vercel

1. vercel.com → **Add New → Project** → import the same repo.
2. Settings:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (auto-detected)
   - Build command `npm run build`, output directory `dist` (defaults)
3. **Environment Variables:**

   | Key | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://<your-service>.onrender.com/api` |

   It must end with `/api`, with no trailing slash after it.
4. **Deploy**. Copy your Vercel URL, for example `https://finora-yourname.vercel.app`.

`client/vercel.json` rewrites every path to `index.html`, so refreshing on `/dashboard` or `/transactions` works instead of showing a 404.

## 4. Connect them (CORS)

Back in Render → your service → **Environment** → set:

```
CLIENT_URL=https://finora-yourname.vercel.app
```

No trailing slash. To allow several origins separate them with commas. Save; Render redeploys automatically.

If you change `VITE_API_URL` later, redeploy the Vercel project, because Vite bakes env variables in at build time.

## 5. Test the deployed app

1. Open the Vercel URL → **Sign up** with a new account → you land on the dashboard.
2. Add an income and an expense → dashboard cards and charts update.
3. **Refresh the page** (F5) → you stay logged in, no 404.
4. Edit and delete a transaction → numbers update.
5. Budget page → set a budget, spend past 80% and 100% → warning and exceeded alerts show.
6. Create, rename and delete a category; try deleting one that is in use → blocked with a message.
7. Log out, log in again; sign up a second user and confirm they see none of the first user's data.
8. Optional API check: `API_URL=https://<your-service>.onrender.com/api npm run test:smoke` (run inside `server/`).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Browser console: "blocked by CORS policy" | `CLIENT_URL` on Render must exactly equal your Vercel URL (https, no trailing slash). Redeploy after changing. |
| "Cannot reach the server" on login | Wrong `VITE_API_URL`, or the Render service is still waking up. Check `/api/health` and redeploy Vercel after fixing the variable. |
| Render logs: `MongooseServerSelectionError` | Atlas Network Access does not allow `0.0.0.0/0`, or the password in `MONGO_URI` has special characters that need URL-encoding. |
| Render logs: `Missing JWT_SECRET` | Add the variable in Render → Environment. |
| 404 after refreshing a page on Vercel | `client/vercel.json` is missing, or Root Directory is not `client`. |
| Works locally, not in production | Env variables in Vercel/Render are set per environment. Check both dashboards. |
