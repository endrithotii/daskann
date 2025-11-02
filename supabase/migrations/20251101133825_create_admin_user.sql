/*
  # Create Admin User

  ## Admin User Details
  - Email: admin@consensus.com
  - Password: admin123 (SHA-256 hashed)
  - Name: System Admin
  - Role: ADMIN
  
  ## Important
  This creates a default admin user for initial setup.
  You should change the password after first login.
*/

-- Create admin user with hashed password for "admin123"
-- SHA-256 hash of "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO users (email, name, password_hash)
VALUES ('admin@consensus.com', 'System Admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9')
ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to the admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@consensus.com' AND r.key = 'ADMIN'
ON CONFLICT DO NOTHING;
