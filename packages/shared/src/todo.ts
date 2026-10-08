import { z } from 'zod';

export const TITLE_MAX = 120;
export const DESC_MAX = 1000;

// at least one letter or digit, any script: rejects "!!!", allows "C++" and "買い物"
export const TITLE_PATTERN = /[\p{L}\p{N}]/u;
export const TITLE_PATTERN_MESSAGE = 'Title needs at least one letter or number';

// Body for POST /api/todos and PUT /api/todos/:id
export const todoInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: 'Title is required', abort: true })
    .max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters`)
    .regex(TITLE_PATTERN, TITLE_PATTERN_MESSAGE),
  description: z
    .string()
    .trim()
    .max(DESC_MAX, `Keep the description under ${DESC_MAX} characters`)
    .default(''),
});

export type TodoInput = z.input<typeof todoInputSchema>;
export type TodoValues = z.output<typeof todoInputSchema>;

export interface Todo {
  id: string;
  title: string;
  description: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
