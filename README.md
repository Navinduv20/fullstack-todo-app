# Todo App

A full-stack todo list built with React, Express and MongoDB in a TypeScript monorepo. Add,
edit, complete and delete tasks, with instant optimistic updates and undo on delete.

## Features

- Create, edit, complete and delete todos
- Changes appear instantly and roll back with a message if the server rejects them
- Undo for deletes
- The same validation rules in the browser and on the server, from one shared schema
- Loading, empty and error states, including when the backend or database is down
- Rate limiting on the API
- Responsive layout

## Tech stack

**Frontend** (`apps/frontend`)

| Package                                         | Used for                                              |
| ----------------------------------------------- | ----------------------------------------------------- |
| [React 19](https://react.dev)                   | UI                                                    |
| [Vite](https://vite.dev)                        | Dev server and build                                  |
| [Chakra UI v3](https://chakra-ui.com)           | Components, theming and toasts                        |
| [TanStack Query v5](https://tanstack.com/query) | Server state, caching, optimistic updates and retries |
| [React Hook Form](https://react-hook-form.com)  | Form state                                            |
| [Zod](https://zod.dev)                          | Form validation, via `@hookform/resolvers`            |
| [Motion](https://motion.dev)                    | List animations                                       |

**Backend** (`apps/backend`)

| Package                                                                        | Used for                                |
| ------------------------------------------------------------------------------ | --------------------------------------- |
| [Express 5](https://expressjs.com)                                             | HTTP API                                |
| [Mongoose 9](https://mongoosejs.com)                                           | MongoDB models and queries              |
| [Zod](https://zod.dev)                                                         | Request body and environment validation |
| [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit) | Per-IP rate limiting                    |
| [Helmet](https://helmetjs.github.io)                                           | Security headers                        |
| [cors](https://github.com/expressjs/cors)                                      | Cross-origin access for the frontend    |
| [dotenv](https://github.com/motdotla/dotenv)                                   | Loading `.env`                          |

**Shared** (`packages/shared`)

The Zod schema and TypeScript types used by both apps.

**Tooling**

| Package                                                                                                                                | Used for                         |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [TypeScript](https://www.typescriptlang.org)                                                                                           | Everything                       |
| npm workspaces                                                                                                                         | Monorepo                         |
| [Vitest](https://vitest.dev)                                                                                                           | Test runner                      |
| [Testing Library](https://testing-library.com) and [MSW](https://mswjs.io)                                                             | Frontend tests                   |
| [Supertest](https://github.com/forwardemail/supertest) and [mongodb-memory-server](https://github.com/typegoose/mongodb-memory-server) | Backend tests                    |
| [tsx](https://tsx.is) and [tsup](https://tsup.egoist.dev)                                                                              | Running and building the backend |
| ESLint and Prettier                                                                                                                    | Linting and formatting           |

## Project structure

```
apps/
  backend/     Express API
  frontend/    React app
packages/
  shared/      Zod schema and types used by both
docs/
  DESIGN.md    How it works and why
```

## Requirements

- Node 20.19 or newer to run the app. The test suite needs Node 22.22 or newer.
- A MongoDB instance: a local install, Atlas, or Docker.

## Getting started

```bash
npm install
cp apps/backend/.env.example apps/backend/.env   # then set MONGODB_URI if needed
npm run dev
```

The frontend is at http://localhost:5173 and the API at http://localhost:4000. In development
the frontend proxies `/api` to the backend, so no CORS setup is needed.

To run MongoDB in Docker instead of installing it:

```bash
docker run -d --name todo-mongo -p 127.0.0.1:27017:27017 -v todo-mongo-data:/data/db mongo:7
```

## Scripts

| Command                | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start backend and frontend together     |
| `npm test`             | Run all tests                           |
| `npm run typecheck`    | Type-check every workspace              |
| `npm run lint`         | ESLint                                  |
| `npm run format`       | Prettier                                |
| `npm run format:check` | Check formatting without changing files |
| `npm run build`        | Build every workspace                   |

## CI

GitHub Actions runs lint, format check, typecheck, tests and build on every push to `master`
and on pull requests. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Configuration

Backend (`apps/backend/.env`):

| Variable        | Default                 | Purpose                   |
| --------------- | ----------------------- | ------------------------- |
| `PORT`          | `4000`                  | API port                  |
| `MONGODB_URI`   | none, required          | MongoDB connection string |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origin allowed by CORS    |

Frontend (`apps/frontend/.env`, optional):

| Variable       | Purpose                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | Base URL of the API when it is not served from the same origin. Leave empty in development. |

## API

| Method and path             | Purpose                    |
| --------------------------- | -------------------------- |
| `GET /api/todos`            | List todos, newest first   |
| `POST /api/todos`           | Create a todo              |
| `PUT /api/todos/:id`        | Edit title and description |
| `PATCH /api/todos/:id/done` | Toggle done                |
| `DELETE /api/todos/:id`     | Delete a todo              |
| `GET /api/health`           | API and database status    |

Error responses and behaviour details are in [docs/DESIGN.md](docs/DESIGN.md).

## Limitations

- No authentication: everyone using the same backend sees the same list.
- No pagination.
- Last write wins if two tabs edit the same todo.
