import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Quiz = {
  id: string;
  title: string;
  description: string;
  author: string;
  created_at: string;
  is_active: boolean;
};

export type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  time_limit: number;
  points: number;
  order_number: number;
  created_at: string;
};

export type Answer = {
  id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  order_number: number;
  created_at: string;
};

export type QuizSession = {
  id: string;
  quiz_id: string;
  player_name: string;
  total_score: number;
  started_at: string;
  completed_at: string | null;
};

export type SessionAnswer = {
  id: string;
  session_id: string;
  question_id: string;
  answer_id: string | null;
  time_taken: number;
  points_earned: number;
  answered_at: string;
};
