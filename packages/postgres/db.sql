-- Note for LLM
-- This file is used to initialize the database schema and seed data for the application.
-- It includes the creation of necessary extensions, tables, indexes, and default users.
-- Never use default values for any table columns in the application code.
-- Always set them explicitly in the SQL queries to avoid unexpected behavior and ensure data integrity.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS plpgsql;

CREATE OR REPLACE FUNCTION uuid_v7()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
PARALLEL UNSAFE
AS $$
DECLARE
  ts_ms bigint;
  b bytea;
BEGIN
  ts_ms := floor(extract(epoch from clock_timestamp()) * 1000);

  -- 6 bytes timestamp (48-bit) + 10 random bytes = 16 bytes total
  b := decode(lpad(to_hex(ts_ms), 12, '0'), 'hex') || gen_random_bytes(10);

  -- set version = 7 (0b0111xxxx) in byte 6
  b := set_byte(b, 6, (get_byte(b, 6) & 15) | 112);

  -- set RFC4122 variant (0b10xxxxxx) in byte 8
  b := set_byte(b, 8, (get_byte(b, 8) & 63) | 128);

  return encode(b, 'hex')::uuid;
END;
$$;

DROP TABLE IF EXISTS file CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
	id            UUID PRIMARY KEY,
	email         VARCHAR(255) NOT NULL,
	firstname     VARCHAR(255) NOT NULL,
	lastname      VARCHAR(255) NOT NULL,
	pwd           TEXT NOT NULL,
  teacher       BOOLEAN NOT NULL,
	admin         BOOLEAN NOT NULL,
	archived      BOOLEAN NOT NULL,
	blocked       BOOLEAN NOT NULL,
	created_at    TIMESTAMPTZ NOT NULL,
	last_activity TIMESTAMPTZ NULL,
  search_tsv tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(email, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(firstname, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(lastname, '')), 'B')
  ) STORED
);

CREATE index if not exists users_search_idx ON users USING GIN (search_tsv);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_active ON users(email) WHERE archived = false;

-- User files table
CREATE TABLE file (
  id          UUID PRIMARY KEY,  
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename    VARCHAR(255),
  mime_type   VARCHAR(255),
  size        BIGINT NOT NULL,
  checksum    TEXT,              -- SHA-256
  created_at  TIMESTAMPTZ NOT NULL,
  last_access TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_file_user ON file(user_id);

-- Default users (password: 123456)
INSERT INTO users (id, firstname, lastname, email, pwd, teacher, admin, archived, blocked, created_at) VALUES
  ('019cf6df-d6ae-7000-9896-3f138d9a4344', 'Admin',   'User', 'admin@mail.com',   '$argon2id$v=19$m=65536,t=2,p=1$EI1ZwBTAoaRZ3+5176A9oqfzu8RDCvuVvt0RKGTGB4I$zci6Cbfjqx9mtoubshniXlaENt74JH0c3rHFmIBmhpY',   true,  true,  false, false, '2026-03-16T13:39:50.574Z'),
  ('019cf6e0-b8e4-7000-a092-0f9a77f99025', 'Teacher', 'User', 'teacher@mail.com', '$argon2id$v=19$m=65536,t=2,p=1$24b3qOZpUQmRyx0CSAo6HP51KnAUW4n0GUwkO5P+nYs$DTEL7EssLQ9cMEdaPOTHx5OQyi5QSo4aICWrlf5Jiik', true,  false, false, false, '2026-03-16T13:40:48.484Z'),
  ('019cf6e0-dc4e-7000-b7d1-7bd85737b8b5', 'Student', 'User', 'student@mail.com', '$argon2id$v=19$m=65536,t=2,p=1$rtmu59hzu3fU5tg8m46TlcBfB/nRhLuFeUb8OLnXgdk$yUXdSKT9KBdS9mlWzVq31sAY2HL1Hl53SUpHVGdZlBk', false, false, false, false, '2026-03-16T13:40:57.550Z');