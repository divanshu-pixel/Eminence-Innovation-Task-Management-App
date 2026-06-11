import { Router } from 'express';
import { USER_ROLES } from '../constants/roles.js';
import { listTeamLeads, listUsers, updateUser } from '../controllers/user.controller.js';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateUserSchema } from '../schemas/user.schema.js';

export const userRouter = Router();

userRouter.get('/team-leads', listTeamLeads);

userRouter.use(authenticate);
userRouter.get('/', authorizeRoles(USER_ROLES.MANAGER, USER_ROLES.TEAM_LEAD), listUsers);
userRouter.patch('/:id', authorizeRoles(USER_ROLES.MANAGER), validate(updateUserSchema), updateUser);
