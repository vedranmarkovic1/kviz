-- Fix quiz_sessions table schema

-- Add missing created_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add started_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN started_at timestamptz;
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed'));
  END IF;
END $$;

-- Update existing records to have created_at if null
UPDATE quiz_sessions SET created_at = now() WHERE created_at IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz_id_status ON quiz_sessions(quiz_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_created_at ON quiz_sessions(created_at);

-- Drop and recreate RLS policies for quiz_sessions
DROP POLICY IF EXISTS "Enable read access for all users" ON quiz_sessions;
DROP POLICY IF EXISTS "Enable insert for all users" ON quiz_sessions;
DROP POLICY IF EXISTS "Enable update for all users" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can create quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can view quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can update quiz sessions" ON quiz_sessions;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON quiz_sessions FOR UPDATE USING (true);

-- Enable real-time (only if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'quiz_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE quiz_sessions;
  END IF;
END $$;
