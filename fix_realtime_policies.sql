-- Fix RLS policies for real-time quiz sessions

-- Drop existing quiz_sessions policies
DROP POLICY IF EXISTS "Enable read access for all users" ON quiz_sessions;
DROP POLICY IF EXISTS "Enable insert for all users" ON quiz_sessions;
DROP POLICY IF EXISTS "Enable update for all users" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can create quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can view quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can update quiz sessions" ON quiz_sessions;

-- Create new policies for quiz_sessions with proper real-time support
CREATE POLICY "Enable read access for all users" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON quiz_sessions FOR UPDATE USING (true);

-- Ensure RLS is enabled
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Grant real-time permissions
GRANT SELECT ON quiz_sessions TO anon;
GRANT SELECT ON quiz_sessions TO authenticated;
GRANT INSERT ON quiz_sessions TO anon;
GRANT INSERT ON quiz_sessions TO authenticated;
GRANT UPDATE ON quiz_sessions TO anon;
GRANT UPDATE ON quiz_sessions TO authenticated;

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE quiz_sessions;
