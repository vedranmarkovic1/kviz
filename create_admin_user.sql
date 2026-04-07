-- Create admin user for vedran.markovic with password vedranvoliivu10

-- Step 1: Create the user in auth.users
-- This needs to be done via Supabase Auth API or through the dashboard
-- But we can create the profile once the user exists

-- Step 2: Create user profile for the admin user
-- First, get the user ID after creating the auth user
-- Then insert into user_profiles with admin role

-- For now, here's the SQL to create the profile once you have the user ID:
INSERT INTO user_profiles (id, username, full_name, role)
VALUES (
  'USER_ID_HERE', -- Replace with actual UUID from auth.users after creating the user
  'vedran.markovic',
  'Vedran Marković',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Alternative approach: Create a function to handle user creation
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Check if admin user already exists in auth.users
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'vedran.markovic@example.com';
  
  IF admin_user_id IS NOT NULL THEN
    -- Create or update the user profile
    INSERT INTO user_profiles (id, username, full_name, role)
    VALUES (admin_user_id, 'vedran.markovic', 'Vedran Marković', 'admin')
    ON CONFLICT (id) DO UPDATE SET
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
    
    RAISE NOTICE 'Admin user profile created/updated for: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user not found in auth.users. Please create the user first via Supabase Auth.';
  END IF;
END;
$$;

-- Run the function
SELECT create_admin_user();

-- Clean up the function
DROP FUNCTION IF EXISTS create_admin_user();

-- Manual approach - get the user ID first then run this:
SELECT id, email FROM auth.users WHERE email = 'vedran.markovic@example.com';

-- After you get the UUID from the query above, run this:
-- Replace 'ACTUAL_UUID_HERE' with the UUID from the query above
INSERT INTO user_profiles (id, username, full_name, role)
VALUES (
  'ACTUAL_UUID_HERE', -- Replace with actual UUID from the query above
  'vedran.markovic',
  'Vedran Marković',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Or use this simpler approach that finds the user automatically:
INSERT INTO user_profiles (id, username, full_name, role)
SELECT 
  id,
  'vedran.markovic',
  'Vedran Marković',
  'admin'
FROM auth.users 
WHERE email = 'vedran.markovic@example.com'
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
