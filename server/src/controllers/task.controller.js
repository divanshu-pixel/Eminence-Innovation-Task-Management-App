import { Task } from '../models/task.model.js';
import {
  assertCanAccessTask,
  assertCanAssignTo,
  buildTaskVisibilityFilter
} from '../services/access.service.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';

const populateTask = (query) =>
  query.populate('createdBy', 'username email role').populate('assignedTo', 'username email role');

const emitTaskChange = (req, event, task) => {
  req.app.get('io')?.emit(event, task);
};

export const listTasks = asyncHandler(async (req, res) => {
  const visibilityFilter = await buildTaskVisibilityFilter(req.user);
  const statusFilter = req.validated.query.status ? { status: req.validated.query.status } : {};

  const tasks = await populateTask(Task.find({ ...visibilityFilter, ...statusFilter }))
    .sort({ updatedAt: -1 })
    .lean();

  res.json({ tasks });
});

export const createTask = asyncHandler(async (req, res) => {
  const { title, description = '', status, assignedTo } = req.validated.body;
  const assigneeId = assignedTo || req.user._id;
  await assertCanAssignTo(req.user, assigneeId);

  const task = await Task.create({
    title,
    description,
    status,
    createdBy: req.user._id,
    assignedTo: assigneeId
  });

  const populatedTask = await populateTask(Task.findById(task._id)).lean();
  emitTaskChange(req, 'task:created', populatedTask);
  res.status(201).json({ task: populatedTask });
});

export const getTaskById = asyncHandler(async (req, res) => {
  const task = await populateTask(Task.findById(req.validated.params.id));

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  await assertCanAccessTask(req.user, task);
  res.json({ task });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.validated.params.id);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  await assertCanAccessTask(req.user, task);

  const { title, description, status, assignedTo } = req.validated.body;

  if (assignedTo !== undefined) {
    await assertCanAssignTo(req.user, assignedTo);
    task.assignedTo = assignedTo;
  }

  if (title !== undefined) {
    task.title = title;
  }

  if (description !== undefined) {
    task.description = description;
  }

  if (status !== undefined) {
    task.status = status;
  }

  await task.save();

  const populatedTask = await populateTask(Task.findById(task._id)).lean();
  emitTaskChange(req, 'task:updated', populatedTask);
  res.json({ task: populatedTask });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.validated.params.id);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  await assertCanAccessTask(req.user, task);
  await task.deleteOne();

  emitTaskChange(req, 'task:deleted', { _id: task._id });
  res.status(204).send();
});
