/*
  # Initial Database Schema for Consensus Platform

  ## Tables Created
  
  1. **users** - Store user account information
     - `id` (uuid, primary key) - Unique user identifier
     - `email` (text, unique) - User email address
     - `name` (text) - User display name
     - `password_hash` (text) - Hashed password
     - `created_at` (timestamptz) - Account creation timestamp
  
  2. **roles** - System roles (ADMIN, USER, etc.)
     - `id` (uuid, primary key) - Role identifier
     - `key` (text, unique) - Role key (ADMIN, USER)
     - `name` (text) - Display name
     - `created_at` (timestamptz) - Creation timestamp
  
  3. **user_roles** - Many-to-many relationship between users and roles
     - `user_id` (uuid, foreign key) - User reference
     - `role_id` (uuid, foreign key) - Role reference
  
  4. **departments** - Organizational departments
     - `id` (uuid, primary key) - Department identifier
     - `name` (text) - Department name
     - `created_at` (timestamptz) - Creation timestamp
  
  5. **teams** - Teams within organization
     - `id` (uuid, primary key) - Team identifier
     - `name` (text) - Team name
     - `department_id` (uuid, foreign key) - Parent department
     - `created_at` (timestamptz) - Creation timestamp
  
  6. **org_memberships** - User organizational memberships
     - `user_id` (uuid, foreign key) - User reference
     - `team_id` (uuid, foreign key, nullable) - Team reference
     - `department_id` (uuid, foreign key, nullable) - Department reference
  
  7. **discussions** - Discussion topics
     - `id` (uuid, primary key) - Discussion identifier
     - `owner_id` (uuid, foreign key) - Creator user
     - `title` (text) - Discussion title
     - `prompt` (text) - Discussion prompt/question
     - `deadline_at` (timestamptz, nullable) - Response deadline
     - `is_anonymous` (boolean) - Anonymous responses flag
     - `status` (text) - Discussion status (open/closed)
     - `created_at` (timestamptz) - Creation timestamp
  
  8. **discussion_participants** - Discussion invitees
     - `id` (uuid, primary key) - Participant record identifier
     - `discussion_id` (uuid, foreign key) - Discussion reference
     - `user_id` (uuid, foreign key) - User reference
     - `invited_at` (timestamptz) - Invitation timestamp
     - `responded` (boolean) - Response status
  
  9. **responses** - User responses to discussions
     - `id` (uuid, primary key) - Response identifier
     - `discussion_id` (uuid, foreign key) - Discussion reference
     - `user_id` (uuid, foreign key) - User reference
     - `text` (text) - Response content
     - `created_at` (timestamptz) - Response timestamp

  ## Security
  - Enable RLS on all tables
  - Basic policies for authenticated access
  - Default roles created (ADMIN, USER)
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO roles (key, name)
VALUES 
  ('ADMIN', 'Administrator'),
  ('USER', 'User')
ON CONFLICT (key) DO NOTHING;

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create org_memberships table
CREATE TABLE IF NOT EXISTS org_memberships (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, team_id, department_id)
);

ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt text NOT NULL,
  deadline_at timestamptz,
  is_anonymous boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Create discussion_participants table
CREATE TABLE IF NOT EXISTS discussion_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_at timestamptz DEFAULT now(),
  responded boolean NOT NULL DEFAULT false,
  UNIQUE(discussion_id, user_id)
);

ALTER TABLE discussion_participants ENABLE ROW LEVEL SECURITY;

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (will be refined in later migrations)
CREATE POLICY "Allow all operations for authenticated users"
  ON roles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON user_roles FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON departments FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON teams FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users"
  ON org_memberships FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON teams(department_id);
CREATE INDEX IF NOT EXISTS idx_discussions_owner_id ON discussions(owner_id);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON discussions(status);
CREATE INDEX IF NOT EXISTS idx_discussion_participants_discussion_id ON discussion_participants(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_participants_user_id ON discussion_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_responses_discussion_id ON responses(discussion_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);