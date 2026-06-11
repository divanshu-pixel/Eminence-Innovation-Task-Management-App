import mongoose from 'mongoose';
import { USER_ROLES } from '../constants/roles.js';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/app-error.js';

const idEquals = (left, right) => String(left) === String(right);

export const getAssignableUserIds = async (user) => {
  if (user.role === USER_ROLES.MANAGER) {
    const users = await User.find().select('_id');
    return users.map((candidate) => candidate._id);
  }

  if (user.role === USER_ROLES.TEAM_LEAD) {
    const users = await User.find({
      $or: [{ _id: user._id }, { teamLead: user._id }]
    }).select('_id');
    return users.map((candidate) => candidate._id);
  }

  return [user._id];
};

export const buildTaskVisibilityFilter = async (user) => {
  if (user.role === USER_ROLES.MANAGER) {
    return {};
  }

  if (user.role === USER_ROLES.TEAM_LEAD) {
    const visibleUserIds = await getAssignableUserIds(user);
    return {
      $or: [{ assignedTo: { $in: visibleUserIds } }, { createdBy: { $in: visibleUserIds } }]
    };
  }

  return {
    $or: [{ assignedTo: user._id }, { createdBy: user._id }]
  };
};

export const assertCanAssignTo = async (actor, assigneeId) => {
  if (!mongoose.Types.ObjectId.isValid(assigneeId)) {
    throw new AppError('Invalid assignee.', 400);
  }

  const assignee = await User.findById(assigneeId).select('-password');

  if (!assignee) {
    throw new AppError('Assigned user was not found.', 404);
  }

  if (actor.role === USER_ROLES.MANAGER) {
    return assignee;
  }

  if (actor.role === USER_ROLES.TEAM_LEAD) {
    if (idEquals(assignee._id, actor._id) || idEquals(assignee.teamLead, actor._id)) {
      return assignee;
    }

    throw new AppError('Team Leads can assign tasks only to themselves or their team members.', 403);
  }

  if (!idEquals(assignee._id, actor._id)) {
    throw new AppError('Employees can assign tasks only to themselves.', 403);
  }

  return assignee;
};

export const assertCanAccessTask = async (actor, task) => {
  if (actor.role === USER_ROLES.MANAGER) {
    return;
  }

  if (actor.role === USER_ROLES.EMPLOYEE) {
    if (idEquals(task.assignedTo, actor._id) || idEquals(task.createdBy, actor._id)) {
      return;
    }

    throw new AppError('You can access only your own tasks.', 403);
  }

  const visibleUserIds = await getAssignableUserIds(actor);
  const canAccess = visibleUserIds.some(
    (id) => idEquals(id, task.assignedTo) || idEquals(id, task.createdBy)
  );

  if (!canAccess) {
    throw new AppError('You can access only tasks for your team.', 403);
  }
};
