import { z } from 'zod';
import { TASK_STATUS } from '../models/task.model.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');

export const listTasksSchema = z.object({
  query: z.object({
    status: z.enum(Object.values(TASK_STATUS)).optional()
  })
});

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120),
    description: z.string().trim().max(1000).optional().default(''),
    status: z.enum(Object.values(TASK_STATUS)).optional(),
    assignedTo: objectId.optional()
  })
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: objectId
  }),
  body: z
    .object({
      title: z.string().trim().min(3).max(120).optional(),
      description: z.string().trim().max(1000).optional(),
      status: z.enum(Object.values(TASK_STATUS)).optional(),
      assignedTo: objectId.optional()
    })
    .refine((data) => Object.keys(data).length > 0, 'At least one field is required.')
});

export const taskIdSchema = z.object({
  params: z.object({
    id: objectId
  })
});
