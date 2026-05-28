# Platform - Developer Collaboration Platform

This is a modern, production-ready developer collaboration and contribution platform.

## Architecture
- **Monorepo**: Powered by Turborepo.
- **Frontend**: React (Vite), Redux Toolkit, Tailwind CSS, ShadCN UI, Framer Motion.
- **Backend**: Node.js (Express), PostgreSQL (Prisma), Redis (BullMQ), Socket.io.
- **Integration**: GitHub App for OAuth and repository management.

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Docker and Docker Compose
- GitHub App credentials

### 2. Environment Variables
Create a `.env` file in `apps/api/` (see `.env.example` for reference).
You will need:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY` (as a string or path)
- `JWT_SECRET`

### 3. Installation
```bash
npm install
```

### 4. Database & Infrastructure
```bash
docker-compose up -d
cd apps/api
npx prisma migrate dev
```

### 5. Running the App
From the root directory:
```bash
npm run dev
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:4000](http://localhost:4000)

## Modules
1. **Auth**: GitHub OAuth only.
2. **Projects**: Owners can post challenges with bounties.
3. **Submissions**: Automated testing via BullMQ workers.
4. **Gamification**: XP and Leaderboards.
5. **Webhooks**: Real-time sync with GitHub repositories.
