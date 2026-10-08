import type { RequestHandler } from 'express';
import { Todo } from '../models/Todo';
import { HttpError } from '../middleware/errorHandler';

type IdHandler = RequestHandler<{ id: string }>;

const notFound = () => new HttpError(404, 'NOT_FOUND', 'Todo not found');

export const listTodos: RequestHandler = async (_req, res) => {
  // _id breaks ties between todos created in the same millisecond
  res.json(await Todo.find().sort({ createdAt: -1, _id: -1 }));
};

export const createTodo: RequestHandler = async (req, res) => {
  res.status(201).json(await Todo.create(req.body));
};

export const updateTodo: IdHandler = async (req, res) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: 'after',
  });
  if (!todo) throw notFound();
  res.json(todo);
};

export const toggleTodo: IdHandler = async (req, res) => {
  // flipped in the database in one step; read-then-write could lose a fast double click
  const todo = await Todo.findByIdAndUpdate(
    req.params.id,
    [{ $set: { done: { $not: '$done' } } }],
    {
      returnDocument: 'after',
      updatePipeline: true,
    },
  );
  if (!todo) throw notFound();
  res.json(todo);
};

export const deleteTodo: IdHandler = async (req, res) => {
  const todo = await Todo.findByIdAndDelete(req.params.id);
  if (!todo) throw notFound();
  res.status(204).end();
};
