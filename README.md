# Eminence Innovation Task Management

A role-based task management application built with MongoDB, Express, Angular, Node.js, and Socket.IO.

## Features

- JWT authentication with protected API routes.
- Role-based task access for `Manager`, `Team Lead`, and `Employee`.
- Task creation, update, delete, filtering, and assignment.
- Real-time task/user updates with Socket.IO.
- Request logging and centralized server error logging.
- Server-side validation with Zod and Mongoose.

## Tech Stack

- Frontend: Angular, Angular Material, RxJS, Socket.IO client
- Backend: Node.js, Express, Socket.IO, Mongoose
- Database: MongoDB or MongoDB Atlas

## Roles

- `Manager`: can view users, team leads, and all tasks; can create, modify, delete, and reassign any task.
- `Team Lead`: can view and assign tasks to self or employees assigned to the lead.
- `Employee`: can create and modify only their own tasks. New tasks are assigned to the employee automatically.

## Prerequisites

- Node.js 20+
- npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Local Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd eminence-innovation-task-management
```

2. Install dependencies for the root, server, and client:

```bash
npm install
npm run install:all
```

3. Create the backend environment file:

```bash
cp server/.env.example server/.env
```

4. Update `server/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/task_management_assignment
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:4200
```

For Atlas, replace `MONGODB_URI` with your Atlas connection string.

5. Start both applications:

```bash
npm run dev
```

The Angular app runs at `http://localhost:4200`.
The API runs at `http://localhost:5001`.

## Useful Scripts

```bash
npm run dev
```

Runs the backend and frontend together.

```bash
npm run build
```

Builds the Angular frontend.

```bash
npm run start:server
```

Starts the backend server.

## Environment Variables

Backend variables:

| Variable | Description |
| --- | --- |
| `PORT` | API port. Render provides this automatically in production. |
| `MONGODB_URI` | MongoDB local or Atlas connection string. |
| `JWT_SECRET` | Secret key used to sign JWTs. |
| `JWT_EXPIRES_IN` | JWT expiry duration. Defaults to `1d`. |
| `CLIENT_ORIGIN` | Frontend URL allowed by CORS. |

Frontend API URLs:

- Local values live in `client/src/environments/environment.ts`.
- Production values live in `client/src/environments/environment.prod.ts`.
- Before deploying the frontend, replace `https://your-render-service.onrender.com` with your actual Render backend URL.

## Deployment

Recommended deployment split:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

Deployment order:

1. Push the full source code to GitHub.
2. Create a MongoDB Atlas cluster and get the connection string.
3. Deploy the backend on Render using the Atlas connection string.
4. Update `client/src/environments/environment.prod.ts` with the Render backend URL.
5. Deploy the frontend on Vercel.
6. Update the Render `CLIENT_ORIGIN` value with the final Vercel frontend URL.
7. Redeploy the Render backend.

## Render Backend Settings

Create a Render Web Service from the GitHub repository.

Use these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |

Environment variables:

```env
NODE_ENV=production
MONGODB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-long-random-secret>
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=<your-vercel-production-url>
```

Do not manually set `PORT` on Render. Render injects it automatically.

## Vercel Frontend Settings

Create a Vercel project from the same GitHub repository.

Use these settings:

| Setting | Value |
| --- | --- |
| Framework Preset | Angular |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist/client/browser` |

Before deploying, make sure `client/src/environments/environment.prod.ts` contains your Render backend URL:

```ts
export const environment = {
  apiBaseUrl: 'https://your-render-service.onrender.com/api',
  socketUrl: 'https://your-render-service.onrender.com'
};
```

## API Health Check

After deploying the backend, confirm it is running:

```text
https://your-render-service.onrender.com/api/health
```

Expected response:

```json
{ "status": "ok" }
```

## Notes

- Keep `server/.env` private. It is ignored by Git.
- Commit `server/.env.example`, but never commit real secrets.
- Render free instances can take a short time to wake after inactivity.
