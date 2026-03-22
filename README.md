# Freelance Portfolio - PERN Stack

This project is now a full PERN stack app (Postgres + Express + React + Node).

## Structure
```
freelance portfolio/
+-- server/          Node + Express API
+-- client/          React frontend (Vite)
```

## Prerequisites
- Node.js (LTS)
- Postgres (local or hosted)

## Server setup
1) Create a database in Postgres, for example `freelance_portfolio`.
2) Copy environment template and update values.
```
copy server\.env.example server\.env
```
3) Install dependencies and setup database.
```
cd server
npm install
npm run db:setup
npm run db:seed
npm start
```
The API runs on `http://localhost:3001`.

If you already had a database, run this once to add the new project image field:
```
ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url TEXT;
```

## Client setup
```
cd client
npm install
npm run dev
```
The React app runs on `http://localhost:5173`.

## Environment
Server uses:
- `DATABASE_URL` (Postgres connection string)
- `JWT_SECRET`
- `CORS_ORIGINS`
- `PORT`

Client uses:
- `VITE_API_URL` (defaults to `http://localhost:3001/api`)

## Admin
Visit `http://localhost:5173/admin` and login:
- username: `admin`
- password: `Arshath@77`

Change your password after first login.

Reset admin password (optional):
```
cd server
npm run admin:reset
```

## API
Public:
- `POST /api/track`
- `POST /api/submit`
- `GET /api/services`
- `GET /api/testimonials`
- `GET /api/projects`

Admin:
- `POST /api/admin/login`
- `POST /api/admin/change-password`
- `GET /api/admin/analytics`
- `GET /api/admin/submissions`
- `PATCH /api/admin/submissions/:id`
- `DELETE /api/admin/submissions/:id`
- `GET /api/admin/services`
- `POST /api/admin/services`
- `PUT /api/admin/services/:id`
- `DELETE /api/admin/services/:id`
- `GET /api/admin/testimonials`
- `POST /api/admin/testimonials`
- `PUT /api/admin/testimonials/:id`
- `DELETE /api/admin/testimonials/:id`
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/:id`
- `POST /api/admin/projects/reorder`
- `POST /api/admin/projects/:id/image`
- `DELETE /api/admin/projects/:id`
