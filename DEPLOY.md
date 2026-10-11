# Putting the site online (Vercel + Render)

The site has two parts that go to two places:

| Part | Folder | Where | What it needs |
|---|---|---|---|
| Website | `frontend/` | Vercel | `VITE_API_BASE` = the API address |
| API + database | `backend/` | Render | `DATABASE_URL`, `ALLOWED_ORIGINS`, `ADMIN_PASSWORD` |

Deploy the API first, because the website needs its address.

## 1. API on Render

1. Render dashboard > New > Blueprint > choose this GitHub repo. It reads `render.yaml`.
2. Fill in the three values it asks for:
   - `DATABASE_URL`: the Supabase connection string (Project Settings > Database).
   - `ALLOWED_ORIGINS`: leave a placeholder for now, set it in step 3.
   - `ADMIN_PASSWORD`: a strong password for the first admin login.
3. When it is live, open `https://<your-api>.onrender.com/api/health`. It should say `{"status":"ok"}`.

The first start creates the tables in the database and the first admin account.
The free plan sleeps after 15 minutes without visitors, so the first page load can take about a minute.

## 2. Website on Vercel

From the `frontend` folder:

```
vercel login
vercel --prod
```

When it asks, accept the defaults (framework Vite, build `npm run build`, output `dist`).
Set the environment variable before the production build:

```
vercel env add VITE_API_BASE production      # value: https://<your-api>.onrender.com
vercel --prod
```

## 3. Connect them

In Render, set `ALLOWED_ORIGINS` to the Vercel address (for example `https://wopmi.vercel.app`) and redeploy.
Then open the Vercel address: the home page should load and `/admin/login` should accept the admin account.

## Photos

Uploaded photos are saved to the server's disk. On Render's free plan that disk is wiped on every redeploy,
so photos added in the admin disappear. For a lasting site, add a Render persistent disk (paid) mounted at
`backend/uploads`, or move uploads to object storage. The founder photo committed in `backend/uploads` is
restored on every deploy.
