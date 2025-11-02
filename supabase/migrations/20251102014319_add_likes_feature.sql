/*
  # Add Likes Feature for Discussion Responses

  1. Changes to Existing Tables
    - `discussions`
      - Add `enable_likes` (boolean, default false) - Controls whether likes are enabled for this discussion
  
  2. New Tables
    - `response_likes`
      - `id` (uuid, primary key)
      - `response_id` (uuid, foreign key to responses)
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - Unique constraint on (response_id, user_id) to prevent duplicate likes
  
  3. Security
    - Enable RLS on `response_likes` table
    - Add policy for authenticated users to view all likes
    - Add policy for authenticated users to add their own likes
    - Add policy for users to remove their own likes
*/

-- Add enable_likes column to discussions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'enable_likes'
  ) THEN
    ALTER TABLE discussions ADD COLUMN enable_likes boolean DEFAULT false;
  END IF;
END $$;

-- Create response_likes table
CREATE TABLE IF NOT EXISTS response_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(response_id, user_id)
);

-- Enable RLS
ALTER TABLE response_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for response_likes
CREATE POLICY "Anyone can view response likes"
  ON response_likes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add their own likes"
  ON response_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON response_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster like queries
CREATE INDEX IF NOT EXISTS idx_response_likes_response_id ON response_likes(response_id);
CREATE INDEX IF NOT EXISTS idx_response_likes_user_id ON response_likes(user_id);
