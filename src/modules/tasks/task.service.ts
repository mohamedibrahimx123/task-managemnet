import { AppError } from "../../utils/AppError.js";

import {
  createTask as createTaskRepository,
  findTasksByUserId,
  findTaskById,
  updateTask as updateTaskRepository,
  deleteTask as deleteTaskRepository,
} from "./task.repository.js";

import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryInput,
  PaginatedTasksResult,
} from "./task.types.js";

// ========================================
// 1. Create Task
// ========================================

export const createTask = async (
  userId: string,
  input: Omit<CreateTaskInput, "userId">,
): Promise<Task> => {
  const title = input.title.trim();

  if (!title) {
    throw new AppError("Task title is required", 400);
  }

  if (title.length > 150) {
    throw new AppError("Task title cannot exceed 150 characters", 400);
  }

  return createTaskRepository({
    ...input,
    userId,
    title,
  });
};

// ========================================
// 2. Get User Tasks (with Pagination, Filter & Sort)
// ========================================

export const getUserTasks = async (
  userId: string,
  options: TaskQueryInput = {},
): Promise<PaginatedTasksResult> => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, Math.min(100, options.limit ?? 10));

  const { tasks, total } = await findTasksByUserId(userId, {
    ...options,
    page,
    limit,
  });

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 1 : 0);

  return {
    tasks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// ========================================
// 3. Get Task By ID
// ========================================

export const getTaskById = async (
  taskId: string,
  userId: string,
): Promise<Task> => {
  const task = await findTaskById(taskId, userId);

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

// ========================================
// 4. Update Task (PATCH)
// ========================================

export const updateTask = async (
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<Task> => {
  const hasFieldsToUpdate = Object.values(input).some(
    (value) => value !== undefined,
  );

  if (!hasFieldsToUpdate) {
    throw new AppError("At least one field is required for update", 400);
  }

  if (input.title !== undefined) {
    const title = input.title.trim();

    if (!title) {
      throw new AppError("Task title cannot be empty", 400);
    }

    if (title.length > 150) {
      throw new AppError("Task title cannot exceed 150 characters", 400);
    }

    input = {
      ...input,
      title,
    };
  }

  const updatedTask = await updateTaskRepository(taskId, userId, input);

  if (!updatedTask) {
    throw new AppError("Task not found", 404);
  }

  return updatedTask;
};

// ========================================
// 5. Delete Task
// ========================================

export const deleteTask = async (
  taskId: string,
  userId: string,
): Promise<void> => {
  const deleted = await deleteTaskRepository(taskId, userId);

  if (!deleted) {
    throw new AppError("Task not found", 404);
  }
};
