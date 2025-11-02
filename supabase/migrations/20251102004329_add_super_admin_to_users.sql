/*
  # Add Super Admin Support

  1. Changes to `users` table
    - Add `is_super_admin` (boolean, default false) - Identifies super admin users
    - Only one email (admin@consensus.com) should be super admin
  
  2. Notes
    - Super admins have full access to department and role management
    - Regular admins can manage discussions
    - This creates a hierarchy: Super Admin > Admin > Employee
*/

-- Add is_super_admin column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'is_super_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_super_admin boolean DEFAULT false;
  END IF;
END $$;

-- Make admin@consensus.com a super admin if it exists
UPDATE users
SET is_super_admin = true
WHERE email = 'admin@consensus.com';
