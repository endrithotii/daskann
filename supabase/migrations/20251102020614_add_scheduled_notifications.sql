/*
  # Add Scheduled Notifications System

  1. New Table
    - `scheduled_notifications`
      - `id` (uuid, primary key)
      - `discussion_id` (uuid, references discussions)
      - `user_id` (uuid, references users)
      - `notify_at` (timestamptz) - When to send the notification
      - `sent` (boolean) - Whether the notification has been sent
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `scheduled_notifications` table
    - Add policies for authenticated users to view their scheduled notifications
    - Only discussion owners can create scheduled notifications
*/

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notify_at timestamptz NOT NULL,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scheduled notifications"
  ON scheduled_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Discussion owners can create scheduled notifications"
  ON scheduled_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discussions
      WHERE discussions.id = discussion_id
      AND discussions.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_notify_at 
  ON scheduled_notifications(notify_at) 
  WHERE sent = false;