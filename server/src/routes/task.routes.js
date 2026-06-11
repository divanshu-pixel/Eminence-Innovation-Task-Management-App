import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask
} from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createTaskSchema,
  listTasksSchema,
  taskIdSchema,
  updateTaskSchema
} from '../schemas/task.schema.js';

export const taskRouter = Router();

taskRouter.use(authenticate);
taskRouter.get('/', validate(listTasksSchema), listTasks);
taskRouter.post('/', validate(createTaskSchema), createTask);
taskRouter.get('/:id', validate(taskIdSchema), getTaskById);
taskRouter.patch('/:id', validate(updateTaskSchema), updateTask);
taskRouter.delete('/:id', validate(taskIdSchema), deleteTask);
