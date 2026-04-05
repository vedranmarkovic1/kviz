import { useEffect, useState } from 'react';
import { supabase, QuizSession, SessionAnswer, Question } from '../lib/supabase';
import { Trophy, Clock, CheckCircle, XCircle, Home } from 'lucide-react';

interface ResultsProps {
  sessionId: string;
  totalScore: number;
  onGoHome: () => void;
}

interface QuestionResult {
  question_text: string;
  time_taken: number;
  points_earned: number;
  is_correct: boolean;
}

export default function Results({ sessionId, totalScore, onGoHome }: ResultsProps) {
  const [session, setSession] = useState<QuizSession | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [sessionId]);

  const loadResults = async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      const { data: answersData, error: answersError } = await supabase
        .from('session_answers')
        .select('*, questions(*)')
        .eq('session_id', sessionId)
        .order('answered_at', { ascending: true });

      if (answersError) throw answersError;

      const results = await Promise.all(
        (answersData || []).map(async (answer: SessionAnswer & { questions: Question }) => {
          let isCorrect = false;

          if (answer.answer_id) {
            const { data: answerData } = await supabase
              .from('answers')
              .select('is_correct')
              .eq('id', answer.answer_id)
              .single();

            isCorrect = answerData?.is_correct || false;
          }

          return {
            question_text: answer.questions.question_text,
            time_taken: answer.time_taken,
            points_earned: answer.points_earned,
            is_correct: isCorrect,
          };
        })
      );

      setQuestionResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error loading results:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  const correctAnswers = questionResults.filter((r) => r.is_correct).length;
  const totalQuestions = questionResults.length;
  const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center">
            <div className="mb-6">
              <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-5xl font-bold text-gray-800 mb-2">Čestitamo, {session?.player_name}!</h1>
              <p className="text-xl text-gray-600">Završio/la si kviz!</p>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 mb-6">
              <div className="text-white">
                <p className="text-2xl mb-2">Tvoj konačni rezultat</p>
                <p className="text-7xl font-bold">{totalScore}</p>
                <p className="text-xl mt-2">poena</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700">{correctAnswers}</p>
                <p className="text-sm text-gray-600">Tačnih odgovora</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <Trophy className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700">{accuracy}%</p>
                <p className="text-sm text-gray-600">Tačnost</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Detalji po pitanjima</h2>
            <div className="space-y-4">
              {questionResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-2 ${
                    result.is_correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {result.is_correct ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-semibold text-gray-800">Pitanje {index + 1}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{result.question_text}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{result.time_taken}s</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-800">{result.points_earned} poena</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onGoHome}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <Home className="w-6 h-6" />
            Nazad na početnu
          </button>
        </div>
      </div>
    </div>
  );
}
