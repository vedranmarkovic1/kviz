-- Add PIN system for quiz access

-- Add PIN column to quizzes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'pin_code'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN pin_code text UNIQUE;
  END IF;
END $$;

-- Add session status to quiz_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed'));
  END IF;
END $$;

-- Add started_at column to quiz_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_sessions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE quiz_sessions ADD COLUMN started_at timestamptz;
  END IF;
END $$;

-- Function to generate 6-digit PIN
CREATE OR REPLACE FUNCTION generate_pin()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  pin text;
  pin_exists boolean;
BEGIN
  LOOP
    pin := LPAD(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM quizzes WHERE pin_code = pin) INTO pin_exists;
    IF NOT pin_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN pin;
END;
$$;

-- Trigger to auto-generate PIN when quiz is created
CREATE OR REPLACE FUNCTION set_quiz_pin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pin_code IS NULL OR NEW.pin_code = '' THEN
    NEW.pin_code := generate_pin();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS quiz_pin_trigger ON quizzes;
CREATE TRIGGER quiz_pin_trigger
  BEFORE INSERT ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_pin();

-- Update existing quizzes to have PIN codes
UPDATE quizzes SET pin_code = generate_pin() WHERE pin_code IS NULL OR pin_code = '';

-- Create index for PIN lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_pin_code ON quizzes(pin_code);
