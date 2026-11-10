CREATE TYPE user_role AS ENUM (
  'user',
  'admin'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL,

  email VARCHAR(255) NOT NULL UNIQUE,

  password_hash VARCHAR(255) NOT NULL,

  role user_role NOT NULL DEFAULT 'user',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_name_not_empty
    CHECK (LENGTH(TRIM(name)) > 0)
);