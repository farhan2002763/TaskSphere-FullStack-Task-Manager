# TaskFlow Pro — VIP Task Dashboard

**Progree Full Stack Development Internship | Task 3**

**Developer:** Farhan Ahmed Siddiqui  
**Student ID:** B9/2731  
**Project:** Interactive Dynamic Task Dashboard Platform

## Features

- Premium dark navy / electric-blue / violet responsive dashboard
- Functional sidebar and mobile hamburger navigation
- Dashboard metrics: total, open, completed, high priority
- Complete CRUD: create, list, edit, delete and toggle completion
- SQLite database persists task changes across restarts
- Task fields: title, description, priority, category, due date and status
- Search, status tabs, priority/due-date sorting, quick filters
- Completion progress ring and actionable empty states
- Focus mode: 25-minute in-browser Pomodoro timer
- Form validation, accessible labels, toasts, delete confirmation
- API health endpoint, input validation, rate limiting, security headers
- Responsive layout for desktop, tablet and mobile

## Run locally (Windows, macOS, Linux)

1. Install **Node.js 20 or newer**.
2. Extract the ZIP and open the `TaskFlow_Pro_VIP_Task3` folder in VS Code.
3. Open Terminal in that folder.
4. Run `npm install` (requires internet for the initial dependency download).
5. Run `npm start`.
6. Visit **http://127.0.0.1:3001** in Chrome/Opera.
7. Do not open `public/index.html` directly; the app needs its local API.

No domain, hosting, deployment, GitHub or account is needed. The SQLite database is created automatically when the server starts. The optional Google Fonts use internet; system-font fallbacks work offline.

## Testing

Run `npm test` in the same folder to execute an automated CRUD/validation API test. Test creates and deletes its own sample task. Manual responsive screenshots should be captured in DevTools and saved under `evidence/`.

## REST API

| Method | Endpoint | Function |
|---|---|---|
| GET | `/api/health` | Server health |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task / completion |
| DELETE | `/api/tasks/:id` | Delete task |

Task JSON: `{ "title": "Finish project", "description": "...", "priority": "High", "category": "Development", "due_date": "2026-11-01", "completed": 0 }`.

## Architecture

Vanilla JS client (`public/`) -> asynchronous Fetch API -> Express server (`server.js`) -> persistent local SQLite (`taskflow.sqlite`).

## Important notes

This is an educational, single-user **local-only** internship app bound to 127.0.0.1. It has no login system and should not be exposed publicly. The Pomodoro timer is browser-tab-based; it does not run after the tab is closed. This project is separate from the user's BCC and Blogs by Mehak live websites.
