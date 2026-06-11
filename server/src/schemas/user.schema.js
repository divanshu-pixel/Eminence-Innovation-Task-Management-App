import { z } from 'zod';
import { ROLE_VALUES } from '../constants/roles.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');

export const updateUserSchema = z.object({
  params: z.object({
    id: objectId
  }),
  body: z.object({
    username: z.string().trim().min(3).max(40).optional(),
    role: z.enum(ROLE_VALUES).optional(),
    teamLead: objectId.optional().nullable()
  })
});
