-- Add quiz lock and PIN generation features

-- Add is_locked column to quizzes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN is_locked boolean DEFAULT false;
  END IF;
END $$;

-- Function to regenerate PIN for a quiz
CREATE OR REPLACE FUNCTION regenerate_quiz_pin(quiz_uuid uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_pin text;
  pin_exists boolean;
BEGIN
  LOOP
    new_pin := LPAD(floor(random() * 1000000)::text, 6, '0');
    SELECT EXISTS(SELECT 1 FROM quizzes WHERE pin_code = new_pin AND id != quiz_uuid) INTO pin_exists;
    IF NOT pin_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  UPDATE quizzes SET pin_code = new_pin WHERE id = quiz_uuid;
  RETURN new_pin;
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_is_locked ON quizzes(is_locked);

-- Update RLS policies to include is_locked
DROP POLICY IF EXISTS "Enable read access for all users" ON quizzes;
CREATE POLICY "Enable read access for all users" ON quizzes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON quizzes;
CREATE POLICY "Enable insert for authenticated users" ON quizzes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for users based on user_id" ON quizzes;
CREATE POLICY "Enable update for users based on user_id" ON quizzes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON quizzes;
CREATE POLICY "Enable delete for users based on user_id" ON quizzes FOR DELETE USING (auth.uid() = user_id);
