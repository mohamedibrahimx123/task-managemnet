/// <reference path="../../utils/express.d.ts" />
import type { Request, Response, NextFunction } from "express";

import {
  getUserTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
} from "./task.service.js";

import { AppError } from "../../utils/AppError.js";
import type { TaskQueryInput } from "./task.types.js";

// ========================================
// 1. Get All Tasks (with Pagination, Filter & Sort)
// ========================================

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const query = req.query as unknown as TaskQueryInput;
    const result = await getUserTasks(userId, query);

    res.status(200).json({
      status: "success",
      results: result.tasks.length,
      pagination: result.pagination,
      data: {
        tasks: result.tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 2. Create Task
// ========================================

export const postTask = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const task = await createTask(userId, req.body);

    res.status(201).json({
      status: "success",
      message: "Task created successfully",
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 3. Get Task By ID
// ========================================

export const getTaskByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const taskId = req.params.id as string;
    const task = await getTaskById(taskId, userId);

    res.status(200).json({
      status: "success",
      data: {
        task,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 4. Update Task (PATCH)
// ========================================

export const patchTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const taskId = req.params.id as string;
    const updatedTask = await updateTask(taskId, userId, req.body);

    res.status(200).json({
      status: "success",
      message: "Task updated successfully",
      data: {
        task: updatedTask,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ========================================
// 5. Delete Task
// ========================================

export const deleteTaskController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const taskId = req.params.id as string;
    await deleteTask(taskId, userId);

    res.status(200).json({
      status: "success",
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
