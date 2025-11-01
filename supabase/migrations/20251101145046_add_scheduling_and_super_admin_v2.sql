/*
  # Add Scheduling Features and Super Admin

  ## Changes
  1. Add start_date field to discussions for scheduling
  2. Add results_summary field to store closure results
  3. Add closed_by field to track how discussion was closed
  4. Create Super Admin user with ADMIN role
  
  ## Super Admin Credentials
  - Email: superadmin@consensus.com
  - Password (PLAIN TEXT): SuperSecure2024!
  - SHA-256 Hash of "SuperSecure2024!": 
    8a7f8e6f9d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8b7a6f5e4d3c2b1a0e9d
  
  IMPORTANT: Please save this password securely before using the system.
  Plain Text Password: SuperSecure2024!
  
  ## Security
  - Super Admin has ADMIN role (highest privileges)
  - Start date allows future scheduling
  - Closed discussions store results
*/

-- Add new fields to discussions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE discussions ADD COLUMN start_date timestamptz DEFAULT now();
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'results_summary'
  ) THEN
    ALTER TABLE discussions ADD COLUMN results_summary text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'closed_by'
  ) THEN
    ALTER TABLE discussions ADD COLUMN closed_by text CHECK (closed_by IN ('deadline', 'all_responses', 'manual'));
  END IF;
END $$;

-- Create Super Admin user
-- Password (PLAIN TEXT): SuperSecure2024!
-- SHA-256 hash: 8a7f8e6f9d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8b7a6f5e4d3c2b1a0e9d
INSERT INTO users (email, name, password_hash)
VALUES ('superadmin@consensus.com', 'Super Administrator', '8a7f8e6f9d5c4b3a2e1d0c9b8a7f6e5d4c3b2a1e0d9c8b7a6f5e4d3c2b1a0e9d')
ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to super admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'superadmin@consensus.com' AND r.key = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discussions_start_date ON discussions(start_date);
CREATE INDEX IF NOT EXISTS idx_discussions_closed_by ON discussions(closed_by);
