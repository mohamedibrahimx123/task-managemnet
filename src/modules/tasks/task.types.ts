export type TaskStatus = "pending" | "in_progress" | "completed";

export type TaskPriority = "low" | "medium" | "high";

// Complete Task returned from Database
export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Data required to create a Task
export interface CreateTaskInput {
  userId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

// Data used to partially update a Task
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

// Query parameters for Pagination, Filtering, and Sorting
export type TaskSortBy = "createdAt" | "dueDate" | "title" | "priority";
export type SortOrder = "asc" | "desc";

export interface TaskQueryInput {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  sortBy?: TaskSortBy;
  sortOrder?: SortOrder;
}

export interface TaskPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTasksResult {
  tasks: Task[];
  pagination: TaskPaginationMeta;
}
