# Linkstudio
Single-profile Linktree alternative for Vercel. Static responsive frontend + Vercel API + Neon Postgres.

## Deploy
1. Upload this folder to a new GitHub repository.
2. Import the repository in Vercel (Framework Preset: Other; output directory public).
3. Create a Neon database, copy its connection string, and add these Vercel environment variables:
   - DATABASE_URL: Neon connection string
   - ADMIN_PASSWORD: a long unique password (at least 16 characters)
   - SESSION_SECRET: a random secret, e.g. `openssl rand -hex 32`
4. Deploy/redeploy. The database table is created automatically on first request.
5. Open `/admin`, enter the password, add links and save. `/` is the public page.

Only one admin/profile is supported. Avatar uses a public image URL, not file uploads. No analytics or multi-user registration. Use a strong password and configure Vercel firewall rate limiting for POST /api/profile before public launch. Session expires after 24 hours. HTTPS required for login cookie.
