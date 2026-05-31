# 🚀 Deployment Guide

This project is structured as a monorepo and is ready to be deployed to **Render** (Backend) and **Vercel** (Frontend).

## 1. Backend: Render (Express API)

Render is excellent for hosting the Node.js API and the required Redis instance.

### Step-by-Step Deployment:
1.  **New Web Service**: Connect your GitHub repository.
2.  **Root Directory**: `apps/api`
3.  **Runtime**: `Node`
4.  **Build Command**: `npm install`
5.  **Start Command**: `npm start`
6.  **Add a Redis Instance**:
    -   Create a new Redis instance on Render.
    -   Copy the `Internal Redis URL`.
7.  **Environment Variables**:
    -   `NODE_ENV`: `production`
    -   `PORT`: `4000` (Render will override this, but it's good for defaults)
    -   `MONGODB_URI`: Your MongoDB Atlas connection string.
    -   `REDIS_URL`: The Internal Redis URL from the previous step.
    -   `JWT_SECRET`: A long, random string.
    -   `GITHUB_CLIENT_ID`: From your GitHub OAuth App.
    -   `GITHUB_CLIENT_SECRET`: From your GitHub OAuth App.
    -   `FRONTEND_URL`: Your Vercel URL (e.g., `https://your-app.vercel.app`).
    -   `GITHUB_CALLBACK_URL`: `https://your-api.onrender.com/auth/github/callback`

---

## 2. Frontend: Vercel (React + Vite)

Vercel is the preferred choice for the React frontend.

### Step-by-Step Deployment:
1.  **New Project**: Connect your GitHub repository.
2.  **Root Directory**: `apps/web`
3.  **Framework Preset**: `Vite`
4.  **Build Command**: `npm run build`
5.  **Output Directory**: `dist`
6.  **Environment Variables**:
    -   `VITE_API_URL`: Your Render API URL (e.g., `https://your-api.onrender.com`).
    -   `VITE_SOCKET_URL`: (Optional, defaults to `VITE_API_URL`)

---

## 3. GitHub OAuth Configuration

You must update your GitHub OAuth App settings to match the production URLs:
-   **Homepage URL**: `https://your-app.vercel.app`
-   **Authorization callback URL**: `https://your-api.onrender.com/auth/github/callback`

---

## 4. Production Checklist
- [ ] **CORS**: Ensure `FRONTEND_URL` in the API matches the Vercel domain.
- [ ] **JWT**: Use a secure `JWT_SECRET`.
- [ ] **Database**: Use a production-grade MongoDB Atlas cluster.
- [ ] **Testing**: Run `npm run build` locally to ensure no compilation errors.
- [ ] **HTTPS**: Both Render and Vercel provide SSL by default.
