# Gombay 3D MERN Stack Application

This repository now contains both the existing Vite + React frontend and a brand-new Express/MongoDB backend so the project can evolve into a full MERN stack.

## Project structure

```
frontend/   # React client (Vite)
backend/    # Express + MongoDB API
```

## Backend setup

1. Copy the example environment file and fill in the secrets:

   ```bash
   cd backend
   cp .env.example .env
   ```

   | Variable | Description |
   | --- | --- |
   | `PORT` | Port for the API (defaults to `5000`) |
   | `MONGODB_URI` | MongoDB connection string |
   | `JWT_SECRET` | Secret used to sign JSON Web Tokens |
   | `ADMIN_SETUP_KEY` | One-time key required to register administrators |
   | `CORS_ORIGIN` | Comma separated list of allowed frontend origins |
   | `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for 3D file uploads |
   | `CLOUDINARY_API_KEY` | Cloudinary API key |
   | `CLOUDINARY_API_SECRET` | Cloudinary API secret |
   | `CLOUDINARY_ROOT_FOLDER` | Optional root Cloudinary folder (defaults to `gombay3d`) |
   | `CLOUDINARY_QUOTE_REQUESTS_FOLDER` | Optional quote request folder path override |
   | `CLOUDINARY_REFERENCE_PICS_FOLDER` | Optional reference pictures subfolder name/path |
   | `CLOUDINARY_PREMADE_ITEMS_FOLDER` | Optional premade items subfolder name/path |
   | `CLOUDINARY_FOLDER` | Legacy quote request folder override |
   | `SMTP_HOST` | SMTP host used for quote notification emails |
   | `SMTP_PORT` | SMTP port (for example `587` or `465`) |
   | `SMTP_SECURE` | Set to `true` when your SMTP server requires implicit TLS |
   | `SMTP_USER` | SMTP username / sender account |
   | `SMTP_PASS` | SMTP password or app password |
   | `SMTP_FROM` | Optional sender address override |
   | `QUOTE_NOTIFICATION_TO` | Optional comma-separated recipient list for quote notifications |
   | `ADMIN_DASHBOARD_URL` | Optional admin dashboard URL included in notification emails |

2. Install dependencies and start the development server:

   ```bash
   npm install
   npm run dev
   ```

   The server exposes the following endpoints:

   - `POST /api/auth/register` â€“ create the first admin user (requires the setup key)
   - `POST /api/auth/login` â€“ authenticate an admin and receive a JWT token
   - `GET /api/auth/me` â€“ fetch the current admin profile (requires `Authorization: Bearer <token>`)
   - `POST /api/quote-requests` â€“ submit customer quote request, upload model file to Cloudinary, save data to MongoDB
   - `GET /api/admin/quote-requests` â€“ list submitted quote requests (requires `Authorization: Bearer <token>`)
   - `GET /api/health` â€“ simple health check

   When Cloudinary credentials are configured, the backend ensures this folder structure exists on startup:

   - `gombay3d/quote_requests`
   - `gombay3d/reference_pics`
   - `gombay3d/premade_items`

   When SMTP is configured, the backend also sends a notification email for each new quote request.

## Frontend setup

1. Configure the API base URL if needed by creating a `.env` file inside `frontend/`:

   ```bash
   VITE_API_BASE=http://localhost:5000/api
   ```

   Without this variable the frontend falls back to requesting the relative `/api` path, which works when the backend is proxied behind the same domain.

2. Start the development server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Admin login page

The navigation bar now contains an **Admin** link that opens a secure login form (`/admin`).
Successful authentication stores the returned JWT token in the browser's `localStorage` (`gombay_admin_token`), making it ready for future admin-only features.
