-- Sample Quiz Data for QuizMaster
-- Run this in Supabase SQL Editor to create a test quiz

-- Create a sample quiz
INSERT INTO quizzes (id, title, description, author, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Opšta kultura', 'Testiraj svoje znanje iz različitih oblasti!', 'Admin', true)
ON CONFLICT (id) DO NOTHING;

-- Create questions for the quiz
INSERT INTO questions (id, quiz_id, question_text, time_limit, points, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Koji je glavni grad Francuske?', 15, 1000, 1),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Koliko planeta ima u Sunčevom sistemu?', 15, 1000, 2),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'Ko je napisao "Hamlet"?', 20, 1000, 3),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'Koja je najveća planeta u Sunčevom sistemu?', 15, 1000, 4),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'U kojoj godini je pao Berlinski zid?', 20, 1000, 5)
ON CONFLICT (id) DO NOTHING;

-- Answers for Question 1: Glavni grad Francuske
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Pariz', true, 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'London', false, 2),
  ('550e8400-e29b-41d4-a716-446655440001', 'Berlin', false, 3),
  ('550e8400-e29b-41d4-a716-446655440001', 'Madrid', false, 4)
ON CONFLICT DO NOTHING;

-- Answers for Question 2: Broj planeta
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '7', false, 1),
  ('550e8400-e29b-41d4-a716-446655440002', '8', true, 2),
  ('550e8400-e29b-41d4-a716-446655440002', '9', false, 3),
  ('550e8400-e29b-41d4-a716-446655440002', '10', false, 4)
ON CONFLICT DO NOTHING;

-- Answers for Question 3: Hamlet autor
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'Charles Dickens', false, 1),
  ('550e8400-e29b-41d4-a716-446655440003', 'William Shakespeare', true, 2),
  ('550e8400-e29b-41d4-a716-446655440003', 'Mark Twain', false, 3),
  ('550e8400-e29b-41d4-a716-446655440003', 'Ernest Hemingway', false, 4)
ON CONFLICT DO NOTHING;

-- Answers for Question 4: Najveća planeta
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'Mars', false, 1),
  ('550e8400-e29b-41d4-a716-446655440004', 'Jupiter', true, 2),
  ('550e8400-e29b-41d4-a716-446655440004', 'Saturn', false, 3),
  ('550e8400-e29b-41d4-a716-446655440004', 'Zemlja', false, 4)
ON CONFLICT DO NOTHING;

-- Answers for Question 5: Berlinski zid
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005', '1987', false, 1),
  ('550e8400-e29b-41d4-a716-446655440005', '1989', true, 2),
  ('550e8400-e29b-41d4-a716-446655440005', '1991', false, 3),
  ('550e8400-e29b-41d4-a716-446655440005', '1985', false, 4)
ON CONFLICT DO NOTHING;

-- Add another quiz for variety
INSERT INTO quizzes (id, title, description, author, is_active)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Sportski kviz', 'Koliko dobro poznaješ svetske sportove?', 'SportsFan', true)
ON CONFLICT (id) DO NOTHING;

-- Questions for Sports Quiz
INSERT INTO questions (id, quiz_id, question_text, time_limit, points, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440100', 'Koliko igrača ima na terenu u fudbalu (jedan tim)?', 12, 1000, 1),
  ('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440100', 'U kojoj zemlji su održane prve moderne Olimpijske igre?', 15, 1000, 2),
  ('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440100', 'Koliko Grand Slam turnira ima u tenisu godišnje?', 15, 1000, 3)
ON CONFLICT (id) DO NOTHING;

-- Answers for Sports Question 1
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440101', '10', false, 1),
  ('550e8400-e29b-41d4-a716-446655440101', '11', true, 2),
  ('550e8400-e29b-41d4-a716-446655440101', '12', false, 3),
  ('550e8400-e29b-41d4-a716-446655440101', '9', false, 4)
ON CONFLICT DO NOTHING;

-- Answers for Sports Question 2
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440102', 'Italija', false, 1),
  ('550e8400-e29b-41d4-a716-446655440102', 'Grčka', true, 2),
  ('550e8400-e29b-41d4-a716-446655440102', 'Francuska', false, 3),
  ('550e8400-e29b-41d4-a716-446655440102', 'Nemačka', false, 4)
ON CONFLICT DO NOTHING;

-- Answers for Sports Question 3
INSERT INTO answers (question_id, answer_text, is_correct, order_number)
VALUES
  ('550e8400-e29b-41d4-a716-446655440103', '3', false, 1),
  ('550e8400-e29b-41d4-a716-446655440103', '4', true, 2),
  ('550e8400-e29b-41d4-a716-446655440103', '5', false, 3),
  ('550e8400-e29b-41d4-a716-446655440103', '6', false, 4)
ON CONFLICT DO NOTHING;
