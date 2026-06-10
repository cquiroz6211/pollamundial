-- First, drop existing duplicates so the UNIQUE constraint can be created
-- Keep the user with the oldest created_at (first registered), delete newer duplicates
DELETE FROM users
WHERE id NOT IN (
  SELECT MIN(id::text)::uuid
  FROM users
  GROUP BY name, group_id
);

-- Now create the UNIQUE constraint
ALTER TABLE users ADD CONSTRAINT uq_users_name_group UNIQUE (name, group_id);
