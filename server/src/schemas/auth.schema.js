import { z } from 'zod';
import { ROLE_VALUES } from '../constants/roles.js';

export const registerSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(40),
    email: z.string().trim().email().max(120),
    password: z.string().min(8).max(128),
    role: z.enum(ROLE_VALUES).optional(),
    teamLead: z.string().regex(/^[a-f\d]{24}$/i).optional().nullable()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1)
  })
});
