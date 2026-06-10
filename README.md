# Flow — Internal Jira Clone (Phase 1)

A simple internal issue tracker built with the MERN stack
(MongoDB, Express, React, Node.js).

**What works right now (Phase 1):**
- Create an account / sign in / sign out
- Secure login using tokens (JWT)
- A clean dashboard shell with a placeholder Kanban board
- Add real projects, draggable issue cards, and assignments.

---



## How to run it (two terminals)

The app has two halves: the **server** (backend) and the **client** (frontend).
Each runs in its own terminal window.

### Terminal 1 — start the backend

```bash
cd server
npm install
```

Now create your secrets file. Copy `.env.example` to a new file named `.env`,
then open `.env` and paste your MongoDB connection string into `MONGO_URI`,
and type any long random text into `JWT_SECRET`.

Then start it:

```bash
npm run dev
```

You should see: `✅ Server running on http://localhost:5000`

### Terminal 2 — start the frontend

```bash
cd client
npm install
npm run dev
```

You should see a local address like `http://localhost:5173`.
Open that in your browser.

---

## Try it out

1. Click **Create an account** and register.
2. You'll land on the dashboard.
3. Refresh the page — you stay logged in.
4. Click **Sign out**, then sign back in.

If that all works, Phase 1 is done. 🎉

---

## Folder map (so you know what's what)

```
server/
  server.js              ← starts the backend
  config/db.js           ← connects to MongoDB
  models/User.js         ← what a "user" looks like in the database
  controllers/           ← the logic for register / login
  middleware/auth.js     ← the "are you logged in?" gatekeeper
  routes/                ← maps web addresses to logic

client/
  src/main.jsx           ← starts the React app
  src/App.jsx            ← decides which page to show
  src/context/           ← remembers who's logged in
  src/pages/             ← Login, Register, Dashboard screens
  src/api.js             ← talks to the backend
  src/styles.css         ← all the styling
```

---

## Common hiccups

- **"MongoDB connection failed"** → your `MONGO_URI` is wrong, or you forgot to
  allow network access in Atlas, or you didn't replace `<password>` in the string.
- **Frontend loads but login does nothing** → make sure the backend terminal is
  still running on port 5000.
- **`npm` not found** → Node.js isn't installed correctly; reinstall from nodejs.org.
