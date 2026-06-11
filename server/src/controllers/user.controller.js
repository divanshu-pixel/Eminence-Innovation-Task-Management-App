import { USER_ROLES } from '../constants/roles.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const filter =
    req.user.role === USER_ROLES.MANAGER
      ? {}
      : {
          $or: [{ _id: req.user._id }, { teamLead: req.user._id }]
        };

  const users = await User.find(filter)
    .select('-password')
    .populate('teamLead', 'username email role')
    .sort({ role: 1, username: 1 });

  res.json({ users });
});

export const listTeamLeads = asyncHandler(async (req, res) => {
  const teamLeads = await User.find({ role: USER_ROLES.TEAM_LEAD }).select('-password').sort('username');
  res.json({ users: teamLeads });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  const { username, role, teamLead } = req.validated.body;

  const user = await User.findById(id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (username !== undefined) {
    user.username = username;
  }

  if (role !== undefined) {
    user.role = role;
  }

  if (teamLead !== undefined) {
    if (teamLead) {
      const lead = await User.findOne({ _id: teamLead, role: USER_ROLES.TEAM_LEAD });
      if (!lead) {
        throw new AppError('Selected team lead is invalid.', 400);
      }
    }

    user.teamLead = teamLead;
  }

  if (user.role !== USER_ROLES.EMPLOYEE) {
    user.teamLead = null;
  }

  await user.save();
  req.app.get('io')?.emit('user:updated', user.toSafeObject());
  res.json({ user: user.toSafeObject() });
});
