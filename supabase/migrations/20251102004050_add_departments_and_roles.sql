/*
  # Add Departments and Roles System

  ## New Tables
  
  ### `departments`
  - `id` (uuid, primary key)
  - `name` (text, unique) - Department name (e.g., Marketing, IT, Medicine)
  - `description` (text, optional) - Department description
  - `created_at` (timestamptz)
  - `created_by` (uuid, foreign key to users) - Admin who created it
  
  ### `roles`
  - `id` (uuid, primary key)
  - `name` (text, unique) - Role name (e.g., Manager, Employee, Intern)
  - `description` (text, optional) - Role description
  - `created_at` (timestamptz)
  - `created_by` (uuid, foreign key to users) - Admin who created it
  
  ### `user_departments`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `department_id` (uuid, foreign key to departments)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, department_id)
  
  ### `user_roles`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key to users)
  - `role_id` (uuid, foreign key to roles)
  - `created_at` (timestamptz)
  - Unique constraint on (user_id, role_id)
  
  ### `discussion_departments`
  - `id` (uuid, primary key)
  - `discussion_id` (uuid, foreign key to discussions)
  - `department_id` (uuid, foreign key to departments)
  - `created_at` (timestamptz)
  
  ### `discussion_roles`
  - `id` (uuid, primary key)
  - `discussion_id` (uuid, foreign key to discussions)
  - `role_id` (uuid, foreign key to roles)
  - `created_at` (timestamptz)

  ## Security
  
  All tables have RLS enabled with appropriate policies for:
  - Super admin full access
  - Users can view departments and roles
  - Users can view their own assignments
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  );

CREATE POLICY "Users can view departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage roles"
  ON roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  );

CREATE POLICY "Users can view roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_departments table
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage user departments"
  ON user_departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  );

CREATE POLICY "Users can view user departments"
  ON user_departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin can manage user roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.is_super_admin = true
    )
  );

CREATE POLICY "Users can view user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create discussion_departments table
CREATE TABLE IF NOT EXISTS discussion_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discussion_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussion owner can manage discussion departments"
  ON discussion_departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discussions
      WHERE discussions.id = discussion_departments.discussion_id
      AND discussions.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discussions
      WHERE discussions.id = discussion_departments.discussion_id
      AND discussions.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view discussion departments"
  ON discussion_departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Create discussion_roles table
CREATE TABLE IF NOT EXISTS discussion_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discussion_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussion owner can manage discussion roles"
  ON discussion_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM discussions
      WHERE discussions.id = discussion_roles.discussion_id
      AND discussions.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM discussions
      WHERE discussions.id = discussion_roles.discussion_id
      AND discussions.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view discussion roles"
  ON discussion_roles
  FOR SELECT
  TO authenticated
  USING (true);
