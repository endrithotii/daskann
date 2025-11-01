/*
  # Add AI Analysis Results to Discussions

  ## Changes
  1. Add ai_analysis field to discussions table to store OpenAI response
  2. This will store the full JSON response with groups and consensus data
  
  ## Structure
  - ai_analysis: JSONB field to store the complete analysis result
*/

-- Add ai_analysis column to discussions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'discussions' AND column_name = 'ai_analysis'
  ) THEN
    ALTER TABLE discussions ADD COLUMN ai_analysis jsonb;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_discussions_ai_analysis ON discussions USING GIN (ai_analysis);
