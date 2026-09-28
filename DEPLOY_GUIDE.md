# RAGENIUS — GitHub + Vercel / Render deploy guide

## 1. Push to GitHub
1. Make sure `.env` is NOT in the folder you upload (it holds your Groq key). `.gitignore` already blocks it.
2. github.com -> New repository -> name `ragenius` -> Create (no README).
3. In the project folder:
   ```
   git init
   git add .
   git commit -m "RAGENIUS v1"
   git branch -M main
   git remote add origin https://github.com/<your-username>/ragenius.git
   git push -u origin main
   ```
   (No git? On the repo page use "uploading an existing file" and drag the folder contents — but not `.env`.)

## 2. Free PostgreSQL (needed on Vercel)
Vercel has no permanent disk, so SQLite data is lost. Create a free DB at neon.tech (or Supabase) and copy the connection string.

## 3. Deploy on Vercel
1. vercel.com -> Add New -> Project -> Import your GitHub repo.
2. Framework Preset: Other. Leave build settings empty.
3. Environment Variables: `GROQ_API_KEY`, `GROQ_MODEL`, `SECRET_KEY`, `DATABASE_URL`.
4. Deploy. Every `git push` redeploys automatically.

Vercel limits: uploads max ~4 MB per request, 60 s per request, uploaded files and profile photos are stored in temporary /tmp (they disappear). Best for a demo.

## 4. Recommended for the full app: Render
render.com -> New -> Web Service -> connect the repo. Build: `pip install -r requirements.txt`, Start: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`. Add the same environment variables. Attach a Disk mounted at /opt/render/project/src/uploads and instance for permanent files.
