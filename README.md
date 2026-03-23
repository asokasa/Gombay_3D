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
   | `CLOUDINARY_FOLDER` | Optional Cloudinary folder path for uploaded files |

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
