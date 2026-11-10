import { pool } from "../../config/database.js";

import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskQueryInput,
} from "./task.types.js";

// ========================================
// Shared SELECT Query
// ========================================

const TASK_SELECT = `
  SELECT
    id,
    user_id AS "userId",
    title,
    description,
    status,
    priority,
    due_date AS "dueDate",
    created_at AS "createdAt",
    updated_at AS "updatedAt"
  FROM tasks
`;

// ========================================
// 1. Create Task
// ========================================

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  const { userId, title, description, status, priority, dueDate } = input;

  const query = `
    INSERT INTO tasks (
      user_id,
      title,
      description,
      status,
      priority,
      due_date
    )
    VALUES (
      $1,
      $2,
      $3,
      COALESCE($4::task_status, 'pending'),
      COALESCE($5::task_priority, 'medium'),
      $6
    )
    RETURNING
      id,
      user_id AS "userId",
      title,
      description,
      status,
      priority,
      due_date AS "dueDate",
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

  const values = [
    userId,
    title,
    description ?? null,
    status ?? null,
    priority ?? null,
    dueDate ?? null,
  ];

  const result = await pool.query<Task>(query, values);

  const task = result.rows[0];

  if (!task) {
    throw new Error("Failed to create task");
  }

  return task;
};

// ========================================
// 2. Get User Tasks (with Filtering, Sorting & Pagination)
// ========================================

export const findTasksByUserId = async (
  userId: string,
  options: TaskQueryInput = {},
): Promise<{ tasks: Task[]; total: number }> => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.max(1, Math.min(100, options.limit ?? 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["user_id = $1"];
  const values: unknown[] = [userId];

  if (options.status) {
    values.push(options.status);
    conditions.push(`status = $${values.length}`);
  }

  if (options.priority) {
    values.push(options.priority);
    conditions.push(`priority = $${values.length}`);
  }

  if (options.search && options.search.trim().length > 0) {
    values.push(`%${options.search.trim()}%`);
    conditions.push(`title ILIKE $${values.length}`);
  }

  const whereClause = conditions.join(" AND ");

  // Count query
  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM tasks
    WHERE ${whereClause};
  `;

  // Sort mapping
  const sortColumnMap: Record<string, string> = {
    createdAt: "created_at",
    dueDate: "due_date",
    title: "title",
    priority: "priority",
  };

  const sortColumn = sortColumnMap[options.sortBy ?? "createdAt"] ?? "created_at";
  const sortDirection = options.sortOrder?.toLowerCase() === "asc" ? "ASC" : "DESC";

  // For due_date, put NULLs last when ascending and descending
  const orderClause =
    sortColumn === "due_date"
      ? `ORDER BY due_date ${sortDirection} NULLS LAST, created_at DESC`
      : `ORDER BY ${sortColumn} ${sortDirection}`;

  // Data query values clone before adding limit and offset
  const dataValues = [...values];
  dataValues.push(limit);
  const limitIndex = dataValues.length;

  dataValues.push(offset);
  const offsetIndex = dataValues.length;

  const dataQuery = `
    ${TASK_SELECT}
    WHERE ${whereClause}
    ${orderClause}
    LIMIT $${limitIndex} OFFSET $${offsetIndex};
  `;

  const [countResult, dataResult] = await Promise.all([
    pool.query<{ total: number }>(countQuery, values),
    pool.query<Task>(dataQuery, dataValues),
  ]);

  const total = countResult.rows[0]?.total ?? 0;

  return {
    tasks: dataResult.rows,
    total,
  };
};

// ========================================
// 3. Get Task By ID
// ========================================

export const findTaskById = async (
  taskId: string,
  userId: string,
): Promise<Task | null> => {
  const query = `
    ${TASK_SELECT}
    WHERE id = $1
    AND user_id = $2
    LIMIT 1;
  `;

  const values = [taskId, userId];

  const result = await pool.query<Task>(query, values);

  return result.rows[0] ?? null;
};

// ========================================
// 4. Update Task (PATCH)
// ========================================

export const updateTask = async (
  taskId: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<Task | null> => {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.title !== undefined) {
    values.push(input.title);
    fields.push(`title = $${values.length}`);
  }

  if (input.description !== undefined) {
    values.push(input.description);
    fields.push(`description = $${values.length}`);
  }

  if (input.status !== undefined) {
    values.push(input.status);
    fields.push(`status = $${values.length}`);
  }

  if (input.priority !== undefined) {
    values.push(input.priority);
    fields.push(`priority = $${values.length}`);
  }

  if (input.dueDate !== undefined) {
    values.push(input.dueDate);
    fields.push(`due_date = $${values.length}`);
  }

  if (fields.length === 0) {
    return null;
  }

  fields.push("updated_at = NOW()");

  values.push(taskId);
  const taskIdIndex = values.length;

  values.push(userId);
  const userIdIndex = values.length;

  const query = `
    UPDATE tasks
    SET ${fields.join(", ")}
    WHERE id = $${taskIdIndex}
    AND user_id = $${userIdIndex}
    RETURNING
      id,
      user_id AS "userId",
      title,
      description,
      status,
      priority,
      due_date AS "dueDate",
      created_at AS "createdAt",
      updated_at AS "updatedAt";
  `;

  const result = await pool.query<Task>(query, values);

  return result.rows[0] ?? null;
};

// ========================================
// 5. Delete Task
// ========================================

export const deleteTask = async (
  taskId: string,
  userId: string,
): Promise<boolean> => {
  const query = `
    DELETE FROM tasks
    WHERE id = $1
    AND user_id = $2
    RETURNING id;
  `;

  const values = [taskId, userId];

  const result = await pool.query(query, values);

  return result.rowCount !== null && result.rowCount > 0;
};
