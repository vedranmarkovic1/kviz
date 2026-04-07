-- Fix RLS policies to resolve 404 NOT_FOUND errors

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view active quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can create quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admin can manage all quizzes" ON quizzes;

DROP POLICY IF EXISTS "Anyone can view questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can insert questions" ON questions;
DROP POLICY IF EXISTS "Authenticated users can update questions" ON questions;

DROP POLICY IF EXISTS "Anyone can view answers" ON answers;
DROP POLICY IF EXISTS "Authenticated users can insert answers" ON answers;
DROP POLICY IF EXISTS "Authenticated users can update answers" ON answers;

DROP POLICY IF EXISTS "Anyone can create quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can view quiz sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "Anyone can update quiz sessions" ON quiz_sessions;

DROP POLICY IF EXISTS "Anyone can insert session answers" ON session_answers;
DROP POLICY IF EXISTS "Anyone can view session answers" ON session_answers;

-- Create new simplified policies for quizzes
CREATE POLICY "Enable read access for all users" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on user_id" ON quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Enable delete for users based on user_id" ON quizzes FOR DELETE USING (auth.uid() = user_id);

-- Create policies for questions
CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON questions FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for answers
CREATE POLICY "Enable read access for all users" ON answers FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON answers FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON answers FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for quiz_sessions
CREATE POLICY "Enable read access for all users" ON quiz_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON quiz_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON quiz_sessions FOR UPDATE USING (true);

-- Create policies for session_answers
CREATE POLICY "Enable read access for all users" ON session_answers FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON session_answers FOR INSERT WITH CHECK (true);

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can delete any profile" ON user_profiles;

CREATE POLICY "Enable read access for all users" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON user_profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for users based on user_id" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
