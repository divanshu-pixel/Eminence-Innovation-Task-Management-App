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
