import { useEffect, useRef, useState } from 'react';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Todo, TodoValues } from '@todo/shared';
import { isRetryable, todosApi, toUserMessage } from '../api/todos';
import { toaster } from '../components/Toaster';
import { strings } from '../utils/strings';

const TODOS_KEY = ['todos'] as const;
const UNDO_MS = 5000;

// server id -> temp id. Keeps the React key stable when the created todo replaces the
// optimistic one, otherwise the row remounts and animates in twice.
const stableKeys = new Map<string, string>();
export const stableKey = (id: string) => stableKeys.get(id) ?? id;
export const isTemp = (id: string) => id.startsWith('temp-');

// ~5s of retrying before the error banner shows
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 5;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => failureCount < MAX_RETRIES && isRetryable(error),
        retryDelay: RETRY_DELAY_MS,
        refetchOnWindowFocus: true,
        // default 'online' pauses requests while offline instead of failing them
        networkMode: 'always',
      },
      // no retries: a repeated toggle would flip the todo back
      mutations: { retry: 0, networkMode: 'always' },
    },
  });
}

export function useTodos() {
  return useQuery({ queryKey: TODOS_KEY, queryFn: todosApi.list });
}

function useOptimisticMutation<V, R>(
  mutationFn: (vars: V) => Promise<R>,
  apply: (todos: Todo[], vars: V) => Todo[],
  onSuccess?: (result: R, vars: V) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY });
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY);
      queryClient.setQueryData<Todo[]>(TODOS_KEY, (old = []) => apply(old, vars));
      return { previous };
    },
    onSuccess,
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(TODOS_KEY, context.previous);
      toaster.create({ type: 'error', title: toUserMessage(err) });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TODOS_KEY }),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const mutation = useOptimisticMutation(
    ({ input }: { tempId: string; input: TodoValues }) => todosApi.create(input),
    (todos, { tempId, input }) => {
      const now = new Date().toISOString();
      return [{ id: tempId, ...input, done: false, createdAt: now, updatedAt: now }, ...todos];
    },
    (created, { tempId }) => {
      stableKeys.set(created.id, tempId);
      queryClient.setQueryData<Todo[]>(TODOS_KEY, (old = []) =>
        old.map((t) => (t.id === tempId ? created : t)),
      );
    },
  );
  return (input: TodoValues) => mutation.mutate({ tempId: `temp-${crypto.randomUUID()}`, input });
}

export function useUpdateTodo() {
  return useOptimisticMutation(
    ({ id, input }: { id: string; input: TodoValues }) => todosApi.update(id, input),
    (todos, { id, input }) => todos.map((t) => (t.id === id ? { ...t, ...input } : t)),
  );
}

export function useToggleTodo() {
  return useOptimisticMutation(todosApi.toggle, (todos, id) =>
    todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  );
}

export function useUndoableDelete() {
  const queryClient = useQueryClient();
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const pending = useRef(new Set<string>());

  // closing the tab during the undo window would otherwise drop the delete
  useEffect(() => {
    const flush = () => {
      for (const id of pending.current) todosApi.remove(id).catch(() => {});
      pending.current.clear();
    };
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);

  const unhide = (id: string) =>
    setHiddenIds((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });

  const mutation = useMutation({
    mutationFn: todosApi.remove,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Todo[]>(TODOS_KEY, (old = []) => old.filter((t) => t.id !== id));
    },
    onError: (err) => toaster.create({ type: 'error', title: toUserMessage(err) }),
    onSettled: (_data, _err, id) => {
      unhide(id);
      return queryClient.invalidateQueries({ queryKey: TODOS_KEY });
    },
  });

  const requestDelete = (todo: Todo) => {
    pending.current.add(todo.id);
    setHiddenIds((ids) => new Set(ids).add(todo.id));
    toaster.create({
      title: strings.toast.deleted(todo.title),
      duration: UNDO_MS,
      action: {
        label: strings.toast.undo,
        onClick: () => {
          pending.current.delete(todo.id);
          unhide(todo.id);
        },
      },
      // The toast pauses on hover and when the tab is hidden, so the delete is sent when the
      // toast actually goes away, not on a separate timer that could fire while Undo is showing.
      onStatusChange: ({ status }) => {
        if (status === 'dismissing' && pending.current.delete(todo.id)) mutation.mutate(todo.id);
      },
    });
  };

  return { hiddenIds, requestDelete };
}
