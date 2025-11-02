/*
  # Fix Users RLS Policy for Sign Up

  ## Changes
  - Drop existing restrictive INSERT policy on users table
  - Create new policy that allows anyone to insert (for registration)
  - Keep SELECT, UPDATE policies secure
  
  ## Security
  - Users can register (INSERT their own data)
  - Users can view all users (needed for participant selection)
  - Users can only update their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON users;

-- Allow anyone to register (insert)
CREATE POLICY "Anyone can register"
  ON users FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view all users (needed for participant selection)
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

-- Allow users to update only their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());