# Innoworks - Developer Collaboration Platform

This is a modern developer collaboration and contribution platform powered by Turborepo.

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js**: v18 or higher
- **Docker**: For running PostgreSQL (via Prisma), Redis, and MongoDB
- **GitHub App**: You need a GitHub App to handle OAuth and repository interactions.

### 2. Environment Setup

#### Backend (apps/api)
Create a `.env` file in `apps/api/` with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=4000
FRONTEND_URL="http://localhost:5173"
JWT_SECRET=your_secure_jwt_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL="http://localhost:4000/auth/github/callback"
GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY="path/to/your/private-key.pem"
GITHUB_WEBHOOK_SECRET=your_webhook_secret
REDIS_URL="redis://localhost:6379"
```

#### Frontend (apps/web)
Create a `.env` file in `apps/web/` (optional, defaults to localhost:4000):
```env
VITE_API_URL=http://localhost:4000
```

### 3. Installation
From the root directory, install all dependencies for the entire monorepo:
```bash
npm install
```

### 4. Infrastructure
Start the required infrastructure (Redis, etc.) using Docker:
```bash
docker-compose up -d
```

### 5. Running the Application
Launch both the frontend and backend in development mode using Turborepo:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:4000](http://localhost:4000)

## 🛠️ Project Structure
- `apps/api`: Express.js backend with MongoDB and BullMQ workers.
- `apps/web`: React (Vite) frontend with Tailwind CSS and Redux Toolkit.
- `packages/`: Shared configurations and components (if any).

## ✨ Features
- **GitHub OAuth**: Secure login via GitHub.
- **Auto-Forking**: Missions are automatically forked to your account when accepted.
- **Automated PRs**: Solutions automatically raise Pull Requests on the upstream repo.
- **Engineering Metrics**: Real-time tracking of Consistency, Perfection, Collaboration, and more.
