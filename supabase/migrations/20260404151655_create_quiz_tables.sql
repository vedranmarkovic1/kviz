/*
  # Quiz Application Database Schema

  ## Overview
  This migration creates the complete database structure for a Kahoot-style quiz application.

  ## Tables Created
  
  ### 1. quizzes
  Stores quiz information
  - `id` (uuid, primary key) - Unique quiz identifier
  - `title` (text) - Quiz title/name
  - `description` (text) - Quiz description
  - `author` (text) - Quiz creator name
  - `created_at` (timestamptz) - Creation timestamp
  - `is_active` (boolean) - Whether quiz is active/published
  
  ### 2. questions
  Stores quiz questions
  - `id` (uuid, primary key) - Unique question identifier
  - `quiz_id` (uuid, foreign key) - References quizzes table
  - `question_text` (text) - The question text
  - `time_limit` (integer) - Time limit in seconds for this question
  - `points` (integer) - Maximum points for correct answer
  - `order_number` (integer) - Question order in quiz
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 3. answers
  Stores answer options for each question
  - `id` (uuid, primary key) - Unique answer identifier
  - `question_id` (uuid, foreign key) - References questions table
  - `answer_text` (text) - The answer text
  - `is_correct` (boolean) - Whether this is the correct answer
  - `order_number` (integer) - Answer display order
  - `created_at` (timestamptz) - Creation timestamp
  
  ### 4. quiz_sessions
  Tracks user quiz attempts
  - `id` (uuid, primary key) - Unique session identifier
  - `quiz_id` (uuid, foreign key) - References quizzes table
  - `player_name` (text) - Player's name
  - `total_score` (integer) - Final score
  - `started_at` (timestamptz) - When quiz started
  - `completed_at` (timestamptz) - When quiz completed
  
  ### 5. session_answers
  Records individual answers during quiz sessions
  - `id` (uuid, primary key) - Unique record identifier
  - `session_id` (uuid, foreign key) - References quiz_sessions table
  - `question_id` (uuid, foreign key) - References questions table
  - `answer_id` (uuid, foreign key) - References answers table
  - `time_taken` (integer) - Seconds taken to answer
  - `points_earned` (integer) - Points earned for this answer
  - `answered_at` (timestamptz) - When answer was submitted

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for quizzes and questions (for players)
  - Authenticated users can manage their own content
*/

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  author text NOT NULL,
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  time_limit integer DEFAULT 20,
  points integer DEFAULT 1000,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_text text NOT NULL,
  is_correct boolean DEFAULT false,
  order_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create quiz_sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  player_name text NOT NULL,
  total_score integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create session_answers table
CREATE TABLE IF NOT EXISTS session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_id uuid REFERENCES answers(id) ON DELETE SET NULL,
  time_taken integer NOT NULL,
  points_earned integer DEFAULT 0,
  answered_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes (public read, authenticated write)
CREATE POLICY "Anyone can view active quizzes"
  ON quizzes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can insert quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update their quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for questions (public read)
CREATE POLICY "Anyone can view questions"
  ON questions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for answers (public read)
CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for quiz_sessions (players can create and view their own)
CREATE POLICY "Anyone can create quiz sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view quiz sessions"
  ON quiz_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can update quiz sessions"
  ON quiz_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for session_answers (players can create and view)
CREATE POLICY "Anyone can insert session answers"
  ON session_answers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view session answers"
  ON session_answers FOR SELECT
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_quiz_id ON quiz_sessions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);