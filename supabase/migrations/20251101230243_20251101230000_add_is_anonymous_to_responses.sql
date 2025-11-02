/*
  # Add is_anonymous column to responses table

  ## Changes
  1. Add is_anonymous field to responses table to track if a response was submitted anonymously
  
  ## Structure
  - is_anonymous: Boolean field to indicate if the response should be displayed anonymously
*/

-- Add is_anonymous column to responses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'responses' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE responses ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;
  END IF;
END $$;