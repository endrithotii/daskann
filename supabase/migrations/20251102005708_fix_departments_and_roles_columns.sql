/*
  # Fix Departments and Roles Tables

  1. Changes to `departments` table
    - Add `description` column if not exists
    - Add `created_by` column if not exists
  
  2. Changes to `roles` table
    - Make `key` column nullable or auto-generate it
    - Ensure all required columns exist

  3. Notes
    - Fixes schema issues preventing creation of departments and roles
    - Preserves existing data
*/

-- Fix departments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE departments ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'departments'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE departments ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Fix roles table - make key nullable or auto-generate from name
DO $$
BEGIN
  -- Check if key column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'roles'
    AND column_name = 'key'
    AND is_nullable = 'NO'
  ) THEN
    -- Make key nullable
    ALTER TABLE roles ALTER COLUMN key DROP NOT NULL;
  END IF;
END $$;

-- Add a trigger to auto-generate key from name if key is null
CREATE OR REPLACE FUNCTION generate_role_key()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.key IS NULL OR NEW.key = '' THEN
    NEW.key := UPPER(REPLACE(NEW.name, ' ', '_'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_generate_role_key ON roles;
CREATE TRIGGER auto_generate_role_key
  BEFORE INSERT OR UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION generate_role_key();
