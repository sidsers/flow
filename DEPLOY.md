# Deploying Flow to the web (Phase 4)

This puts your app online at a real URL so your whole team can use it —
not just your laptop. We'll use **Render** (free), and your existing
**MongoDB Atlas** database.

Your app is set up so that **one service runs everything** (the API and the
website together). That means one deploy, one URL, no extra configuration.

The honest caveat with the free plan: if nobody uses the app for 15 minutes,
it goes to sleep, and the next visit takes ~30–60 seconds to wake up. After
that it's fast again. Totally fine for internal use. (If that ever bugs you,
Render's $7/month plan keeps it awake 24/7.)

---

## Step 1 — Put your code on GitHub

Render deploys from GitHub, so your project needs to live there first.
The easiest no-typing way is **GitHub Desktop**.

1. Make a free GitHub account at https://github.com if you don't have one.
2. Download and install **GitHub Desktop**: https://desktop.github.com
3. Open GitHub Desktop and sign in.
4. Click **File → Add Local Repository**, then choose your `jira-clone` folder.
   - It'll say it's not a git repository yet — click **"create a repository"**.
   - Leave the defaults, click **Create Repository**.
5. Click **Publish repository** (top right).
   - Keep **"Keep this code private"** ticked. Click **Publish**.

Your code is now on GitHub. Your secrets are safe — the `.gitignore` file
makes sure your `.env` (with your passwords) is **never** uploaded.

---

## Step 2 — Create the web service on Render

1. Go to https://render.com and sign up — choose **"Sign in with GitHub"**.
   (No credit card needed.)
2. On the dashboard, click **New +** → **Web Service**.
3. Connect your GitHub and pick your `jira-clone` repository.
   - If it doesn't appear, click **"Configure GitHub App"** and give Render
     access to the repo, then come back.
4. Now fill in the settings:

   | Setting | What to enter |
   |---|---|
   | **Name** | `flow` (or anything — becomes part of your URL) |
   | **Region** | Pick the one closest to you (e.g. Singapore) |
   | **Branch** | `main` |
   | **Root Directory** | *(leave blank)* |
   | **Runtime** | Node |
   | **Build Command** | `npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

---

## Step 3 — Add your secret environment variables

Still on the create page, scroll to **Environment Variables** and add these
two (click "Add Environment Variable" for each):

| Key | Value |
|---|---|
| `MONGO_URI` | Your full Atlas connection string (same one from your `.env`) |
| `JWT_SECRET` | Your long random secret (same one from your `.env`) |

Do **not** add a `PORT` variable — Render sets that automatically.

Then click **Create Web Service** at the bottom.

---

## Step 4 — Watch it build, then open it

Render now installs everything and builds your app. Watch the logs scroll by
(takes 2–4 minutes). You're looking for:

```
✅ MongoDB connected
✅ Server running on http://localhost:10000
==> Your service is live 🎉
```

At the top of the page you'll see your live URL, like:

```
https://flow.onrender.com
```

Open it. You should see your Flow login screen — now reachable by anyone!

---

## Step 5 — Invite your team

Just send them the URL. Each person clicks **Create an account** and they're
in. Everyone shares the same projects, issues, and comments.

---

## Updating the app later

Whenever you (or I) change the code:

1. Open GitHub Desktop — it shows what changed.
2. Type a short summary in the box, click **Commit to main**.
3. Click **Push origin**.

Render notices the push and automatically rebuilds and redeploys. No extra
steps. Your changes are live in a few minutes.

---

## Troubleshooting

- **Build fails** → open the Render logs and read the last red lines. Usually
  a missing environment variable. Double-check `MONGO_URI` and `JWT_SECRET`
  are spelled exactly right.
- **App loads but login fails / "MongoDB connection failed"** → your
  `MONGO_URI` is wrong, OR your Atlas **Network Access** isn't set to
  `0.0.0.0/0` (allow from anywhere). You already set this, but double-check.
- **First visit is slow** → that's the free-tier sleep/wake. Normal. It's fast
  once awake.
