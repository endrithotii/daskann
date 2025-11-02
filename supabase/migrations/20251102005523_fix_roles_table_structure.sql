/*
  # Fix Roles Table Structure

  1. Changes to existing `roles` table
    - Add `description` column (text) if not exists
    - Add `created_by` column (uuid) if not exists
    - Make `name` unique if not already
  
  2. Notes
    - This fixes the schema to match the Department & Role Management page expectations
    - Existing data in roles table is preserved
*/

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'roles'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE roles ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

-- Add created_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'roles'
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE roles ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Make name column unique if not already (drop existing constraint first if exists)
DO $$
BEGIN
  -- Try to add unique constraint, ignore if already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'roles_name_key' 
    AND conrelid = 'roles'::regclass
  ) THEN
    ALTER TABLE roles ADD CONSTRAINT roles_name_key UNIQUE (name);
  END IF;
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN others THEN NULL;
END $$;
