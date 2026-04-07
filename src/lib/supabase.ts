import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uycmdsckaiocfdujkzxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5Y21kc2NrYWlvY2ZkdWprenhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzOTY1MzMsImV4cCI6MjA5MDk3MjUzM30.a7wFc7Xy0cm1b3gnyx742i8NZY5m1bRRTYzvh4i-oR0';

// Fallback to environment variables if available
const finalSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || supabaseUrl;
const finalSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || supabaseAnonKey;

console.log('Supabase URL:', finalSupabaseUrl);
console.log('Supabase Key:', finalSupabaseAnonKey ? 'Present' : 'Missing');

export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);

export type Quiz = {
  id: string;
  title: string;
  description: string;
  author: string;
  created_at: string;
  is_active: boolean;
  is_locked?: boolean;
  pin_code?: string;
  user_id?: string;
};

export type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  time_limit?: number;
  points?: number;
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
