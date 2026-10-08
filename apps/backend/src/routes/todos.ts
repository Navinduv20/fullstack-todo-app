import { Router } from 'express';
import { todoInputSchema } from '@todo/shared';
import { validateBody, validateObjectId } from '../middleware/validate';
import { createTodo, deleteTodo, listTodos, toggleTodo, updateTodo } from '../controllers/todos';

export const todosRouter = Router();

todosRouter.param('id', validateObjectId);

todosRouter.get('/', listTodos);
todosRouter.post('/', validateBody(todoInputSchema), createTodo);
todosRouter.put('/:id', validateBody(todoInputSchema), updateTodo);
todosRouter.patch('/:id/done', toggleTodo);
todosRouter.delete('/:id', deleteTodo);
