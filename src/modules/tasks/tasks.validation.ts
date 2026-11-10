import { z } from "zod";

// ========================================
// Field Schemas
// ========================================

const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(150, "Title must not exceed 150 characters");

const descriptionSchema = z
  .string()
  .trim()
  .max(1000, "Description must not exceed 1000 characters")
  .nullable()
  .optional();

const statusSchema = z.enum(["pending", "in_progress", "completed"] as const);

const prioritySchema = z.enum(["low", "medium", "high"] as const);

const dueDateSchema = z.coerce.date().nullable().optional();

// ========================================
// Request Body Schemas
// ========================================

export const createTaskSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    dueDate: dueDateSchema,
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema,
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    dueDate: dueDateSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// ========================================
// Request Params Schemas
// ========================================

export const taskIdParamSchema = z
  .object({
    id: z.string().uuid("Invalid task ID format. Must be a valid UUID"),
  })
  .strict();

// ========================================
// Request Query Schemas (Filtering, Sorting, Pagination)
// ========================================

export const taskQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    search: z.string().trim().optional(),
    sortBy: z
      .enum(["createdAt", "dueDate", "title", "priority"] as const)
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"] as const).default("desc"),
  })
  .strict();
