import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { onlineManager, QueryClientProvider } from '@tanstack/react-query';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { Todo } from '@todo/shared';
import App from './App';
import { Toaster } from './components/Toaster';
import { createQueryClient } from './hooks/useTodos';
import { system } from './utils/theme';

const todo: Todo = {
  id: '64b7f9f0c2a4e1a2b3c4d5e6',
  title: 'Buy milk',
  description: '',
  done: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const server = setupServer(http.get('/api/todos', () => HttpResponse.json([todo])));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  onlineManager.setOnline(true);
});
afterAll(() => server.close());

function renderApp() {
  const queryClient = createQueryClient();
  const defaults = queryClient.getDefaultOptions();
  queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retry: false } });
  render(
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
      </QueryClientProvider>
    </ChakraProvider>,
  );
}

describe('App', () => {
  it('lists todos from the API', async () => {
    renderApp();
    expect(screen.getByRole('heading', { name: 'Todos' })).toBeInTheDocument();
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    server.use(http.get('/api/todos', () => HttpResponse.json([])));
    renderApp();
    expect(await screen.findByText(/Nothing to do/)).toBeInTheDocument();
  });

  it('shows an error with a retry button when loading fails', async () => {
    server.use(http.get('/api/todos', () => HttpResponse.json({}, { status: 500 })));
    renderApp();
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('validates the title and keeps submit disabled while invalid', async () => {
    const user = userEvent.setup();
    renderApp();
    const title = screen.getByLabelText('Title');
    const submit = screen.getByRole('button', { name: 'Add task' });
    expect(submit).toBeDisabled();

    await user.type(title, 'a');
    await waitFor(() => expect(submit).toBeEnabled());

    await user.clear(title);
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.type(title, '!!!');
    expect(
      await screen.findByText('Title needs at least one letter or number'),
    ).toBeInTheDocument();
    expect(submit).toBeDisabled();
  });

  it('adds a todo optimistically and keeps it once the server responds', async () => {
    const created: Todo = { ...todo, id: '64b7f9f0c2a4e1a2b3c4d5e7', title: 'Walk the dog' };
    server.use(
      http.post('/api/todos', () => {
        server.use(http.get('/api/todos', () => HttpResponse.json([created, todo])));
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderApp();
    await screen.findByText('Buy milk');

    await user.type(screen.getByLabelText('Title'), 'Walk the dog');
    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(await screen.findByText('Walk the dog')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit Walk the dog' })).toBeEnabled(),
    );
    expect(screen.getByLabelText('Title')).toHaveValue('');
  });

  it('rolls an optimistic toggle back when the server fails', async () => {
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.patch('/api/todos/:id/done', async () => {
        await held;
        return HttpResponse.json({ error: { code: 'INTERNAL', message: 'boom' } }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    renderApp();
    const checkbox = await screen.findByRole('checkbox', { name: /Buy milk/ });

    await user.click(checkbox);
    await waitFor(() => expect(screen.getByRole('checkbox', { name: /Buy milk/ })).toBeChecked());

    release();
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /Buy milk/ })).not.toBeChecked(),
    );
  });

  it('rolls a change back when the browser is offline instead of queueing it', async () => {
    let attempted = false;
    server.use(
      http.patch('/api/todos/:id/done', async () => {
        attempted = true;
        await delay(50);
        return HttpResponse.error();
      }),
    );
    const user = userEvent.setup();
    renderApp();
    const checkbox = await screen.findByRole('checkbox', { name: /Buy milk/ });

    onlineManager.setOnline(false);
    await user.click(checkbox);

    // The request is sent despite being offline (not paused), fails, and the tick is undone.
    await waitFor(() => expect(attempted).toBe(true));
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: /Buy milk/ })).not.toBeChecked(),
    );
  });

  it('undo brings a deleted todo back without calling the API', async () => {
    let deletes = 0;
    server.use(
      http.delete('/api/todos/:id', () => {
        deletes += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Delete Buy milk' }));
    await waitFor(() => expect(screen.queryByText('Buy milk')).not.toBeInTheDocument());

    await user.click(await screen.findByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('Buy milk')).toBeInTheDocument();
    expect(deletes).toBe(0);
  });

  it('sends the delete once the undo toast has gone', async () => {
    let deletes = 0;
    server.use(
      http.delete('/api/todos/:id', () => {
        deletes += 1;
        server.use(http.get('/api/todos', () => HttpResponse.json([])));
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole('button', { name: 'Delete Buy milk' }));
    expect(deletes).toBe(0);
    await waitFor(() => expect(deletes).toBe(1), { timeout: 8000 });
    expect(await screen.findByText(/Nothing to do/)).toBeInTheDocument();
  }, 10_000);
});
