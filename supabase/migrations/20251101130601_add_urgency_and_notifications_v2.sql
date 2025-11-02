/*
  # Add urgency field and notifications table

  ## Changes
  
  1. Adds `urgency` field to discussions table
  2. Creates notifications table for discussion notifications
  
  ## Notifications Table
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - Recipient user
  - `discussion_id` (uuid, foreign key) - Related discussion
  - `message` (text) - Notification message
  - `read` (boolean) - Read status
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable RLS on notifications table
  - Users can only view and update their own notifications
*/

-- Add urgency field to discussions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'urgency'
  ) THEN
    ALTER TABLE discussions ADD COLUMN urgency text NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high'));
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
  DROP POLICY IF EXISTS "System can create notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
END $$;

-- Notifications policies
CREATE POLICY "Users can view their notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_discussion ON notifications(discussion_id);
