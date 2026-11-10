
-- =========================================
-- Migration: 002_create_tasks
-- Description: Create Tasks Table
-- =========================================

-- 1. Create Task Status Enum
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress',
  'completed'
);

-- 2. Create Task Priority Enum
CREATE TYPE task_priority AS ENUM (
  'low',
  'medium',
  'high'
);

-- 3. Create Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL,

  title VARCHAR(150) NOT NULL,

  description TEXT,

  status task_status NOT NULL DEFAULT 'pending',

  priority task_priority NOT NULL DEFAULT 'medium',

  due_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT tasks_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT tasks_title_not_empty
    CHECK (LENGTH(TRIM(title)) > 0)
);

-- 4. Create Indexes
CREATE INDEX idx_tasks_user_id
ON tasks(user_id);

CREATE INDEX idx_tasks_user_status
ON tasks(user_id, status);
