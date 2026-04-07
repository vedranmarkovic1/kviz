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

-- Function to generate 6-digit PIN (only used when manually requested)
CREATE OR REPLACE FUNCTION generate_6_digit_pin()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_pin text;
  pin_exists boolean;
BEGIN
  LOOP
    new_pin := LPAD(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM quizzes WHERE pin_code = new_pin) INTO pin_exists;
    IF NOT pin_exists THEN
      EXIT;
    END IF;
  END LOOP;
  RETURN new_pin;
END;
$$;

-- PIN codes will be generated only when Play button is clicked
-- Existing quizzes without PIN will get one when first started

-- Create index for PIN lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_pin_code ON quizzes(pin_code);
