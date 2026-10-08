# Todo app: design notes

React frontend, Express API, MongoDB. One shared list, no accounts.

## What it does

| Feature | Endpoint |
|---|---|
| List todos, newest first | `GET /api/todos` |
| Create (title required, description optional) | `POST /api/todos` |
| Edit title and description | `PUT /api/todos/:id` |
| Toggle done | `PATCH /api/todos/:id/done` |
| Delete | `DELETE /api/todos/:id` |

`GET /api/health` reports whether the API is up and connected to the database.

## Layout

```
apps/
  backend/     Express 5 + Mongoose
    src/app.ts            builds the app (imported by tests, no port opened)
    src/index.ts          connects to Mongo, listens, shuts down on SIGINT/SIGTERM
    src/config.ts         env parsing, exits early if MONGODB_URI is missing
    src/routes, controllers, middleware, models
  frontend/    React 19 + Vite
    src/api/todos.ts      fetch wrapper, ApiError, error-to-message mapping
    src/hooks/useTodos.ts query client, list query, optimistic mutations, undoable delete
    src/components/       TodoForm, TodoItem, TodoList, Toaster
    src/utils/            strings (all UI copy), theme (Chakra tokens)
packages/
  shared/      zod schema and types used by both apps
```

It is a monorepo because of `packages/shared`: the same zod schema validates the form in the
browser and the request body on the server, and both sides share the `Todo` type.

## Validation

`todoInputSchema` in `packages/shared/src/todo.ts`:

- title: trimmed, 1 to 120 characters, must contain at least one letter or digit (so `!!!` is
  rejected, `C++` and `買い物` are fine)
- description: trimmed, up to 1000 characters, defaults to `""`

The server runs it in `validateBody` on POST and PUT. The form runs it through
`react-hook-form` with the zod resolver. Zod is the only validation layer; the Mongoose schema
just describes the stored shape.

## API behaviour

Success responses return the resource. Errors always look like this:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Title is required", "details": [{ "path": "title", "message": "Title is required" }] } }
```

| Case | Status | code |
|---|---|---|
| Body fails the zod schema | 400 | `VALIDATION_ERROR` |
| Body is not valid JSON | 400 | `BAD_JSON` |
| `:id` is not an ObjectId | 400 | `INVALID_ID` |
| Todo or route not found | 404 | `NOT_FOUND` |
| More than 50 requests a minute from one IP on `/api/todos` | 429 | `RATE_LIMITED` |
| Database not connected | 503 | `DB_UNAVAILABLE` |
| Anything else (logged server-side) | 500 | `INTERNAL` |

Things worth knowing:

- **PUT replaces both fields.** Leaving out `description` clears it. `done` in the body is
  ignored; only the toggle endpoint changes it.
- **The toggle flips the value in the database**, using an update pipeline
  (`{ $set: { done: { $not: '$done' } } }`), so there is no read-then-write gap. Mongoose 9
  needs `updatePipeline: true` for this.
- **The toggle is not idempotent.** Sending it twice flips it back, which is why the frontend
  never retries mutations.
- **Database down returns 503 immediately.** Without the check, Mongoose buffers the query for
  10 seconds and may run it after the client has given up.
- **The list sorts by `createdAt` then `_id`**, so todos created in the same millisecond keep
  a stable order.

## Frontend behaviour

Server state is handled by TanStack Query. All mutations except delete update the cached list
first and roll back if the request fails.

| Situation | What the user sees |
|---|---|
| First load | Skeleton rows |
| Backend or database down | The list is retried once a second for about 5 seconds, then an error banner with Retry |
| Request gets no answer | Abandoned after 5 seconds and treated as failed |
| Browser offline | Requests fail straight away (TanStack Query's default would pause and replay them) |
| Add, edit or toggle fails | The change is rolled back and a toast explains why |
| Empty list | Empty-state panel |
| Invalid form | Inline error under the field, submit disabled |

- **Create** inserts a row with a `temp-…` id. Its actions are disabled until the server
  responds. The row keeps the temp id as its React key afterwards so it does not remount.
- **Delete** hides the row and shows an Undo toast for 5 seconds. The DELETE request is sent
  when the toast goes away. If the tab is closed first, pending deletes are sent on `pagehide`.
- **Styling** is Chakra UI with a small set of colour tokens in `utils/theme.ts`. The navy
  panels use Chakra's `<Theme appearance="dark">`, so components inside them switch colours
  without per-component overrides.

## Tests

| Where | Tools | Covers |
|---|---|---|
| `packages/shared` | Vitest | Schema: trimming, blank and over-long titles, symbol-only titles |
| `apps/backend` | Vitest, Supertest, mongodb-memory-server | Each endpoint's success and error cases, rate limit, 503 without a database |
| `apps/frontend` | Vitest, Testing Library, MSW | List, empty and error states, form validation, optimistic add, rollback on 500 and offline, delete and undo |

## Limitations

- No authentication. Everyone using the same backend sees the same list.
- No pagination. Fine for hundreds of todos, not thousands.
- Last write wins if two tabs edit the same todo.
- A failed background refetch replaces the list with the error banner until Retry succeeds.
- The rate limit is per IP. Behind a reverse proxy, Express needs `trust proxy` set or all
  users share one bucket.
