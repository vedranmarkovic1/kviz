-- Fix quizzes table to add user_id column and update policies

-- Step 1: Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN user_id uuid;
  END IF;
END $$;

-- Step 2: Drop ALL existing policies on quizzes table
DROP POLICY IF EXISTS "Anyone can view active quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can update their quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;

-- Step 3: Create new policies that work with user_id
CREATE POLICY "Anyone can view active quizzes"
  ON quizzes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can create quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own quizzes"
  ON quizzes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 4: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY,
  username text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Step 5: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies on user_profiles and create new ones
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can delete any profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Step 7: Create admin user profile if it doesn't exist
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

-- Step 8: Update existing quizzes to have user_id (set to first admin user if null)
UPDATE quizzes 
SET user_id = (SELECT id FROM user_profiles WHERE role = 'admin' LIMIT 1)
WHERE user_id IS NULL;
