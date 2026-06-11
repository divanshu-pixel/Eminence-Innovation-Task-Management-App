import { USER_ROLES } from '../constants/roles.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { signAccessToken } from '../services/token.service.js';

const buildAuthResponse = (user) => ({
  user: user.toSafeObject ? user.toSafeObject() : user,
  token: signAccessToken(user)
});

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, role = USER_ROLES.EMPLOYEE, teamLead = null } = req.validated.body;

  if (role === USER_ROLES.EMPLOYEE && teamLead) {
    const lead = await User.findOne({ _id: teamLead, role: USER_ROLES.TEAM_LEAD });
    if (!lead) {
      throw new AppError('Selected team lead is invalid.', 400);
    }
  }

  if (role !== USER_ROLES.EMPLOYEE && teamLead) {
    throw new AppError('Only employees can be assigned to a team lead.', 400);
  }

  const user = await User.create({
    username,
    email,
    password,
    role,
    teamLead: role === USER_ROLES.EMPLOYEE ? teamLead : null
  });

  req.app.get('io')?.emit('user:created', user.toSafeObject());

  res.status(201).json(buildAuthResponse(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  res.json(buildAuthResponse(user));
});

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});
