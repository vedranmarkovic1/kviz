/*
  # Add User Profiles and Roles

  1. New Tables
    - `user_profiles` - User profile information with roles
      - `id` (uuid, primary key) - References auth.users
      - `username` (text, unique)
      - `full_name` (text)
      - `role` (text) - 'admin' or 'user'
      - `created_at` (timestamptz)
  
  2. Modified Tables
    - Link quizzes to user_profiles for ownership
    - Add user_id to quizzes table for filtering by creator
  
  3. Security
    - Enable RLS on user_profiles
    - Users can view own profile
    - Admin can view all profiles
    - Updated quiz policies for user-specific access
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now()
);

-- Add user_id column to quizzes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete any profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Updated RLS for quizzes
DROP POLICY IF EXISTS "Anyone can view active quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can update their quizzes" ON quizzes;

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

CREATE POLICY "Admin can manage all quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
