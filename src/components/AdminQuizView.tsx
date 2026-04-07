import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Trophy, Clock, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

interface AdminQuizViewProps {
  quizId: string;
  onQuizEnd: () => void;
}

interface Question {
  id: string;
  question_text: string;
  answers: Answer[];
}

interface Answer {
  id: string;
  answer_text: string;
  is_correct: boolean;
}

interface PlayerAnswer {
  player_name: string;
  answer_text: string;
  is_correct: boolean;
}

export default function AdminQuizView({ quizId, onQuizEnd }: AdminQuizViewProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [playerAnswers, setPlayerAnswers] = useState<PlayerAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    loadQuizData();
    
    // Set up real-time subscription for player answers
    const subscription = supabase
      .channel(`quiz-answers-${quizId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'session_answers',
          filter: `quiz_id=eq.${quizId}`
        }, 
        (payload) => {
          console.log('New answer:', payload);
          loadPlayerAnswers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      // Load quiz
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      // Load questions with answers
      const { data: questionsData } = await supabase
        .from('questions')
        .select(`
          *,
          answers (*)
        `)
        .eq('quiz_id', quizId)
        .order('order_number');

      // Load players
      const { data: playersData } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('status', 'active');

      setQuiz(quizData);
      setQuestions(questionsData || []);
      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error loading quiz data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerAnswers = async () => {
    try {
      const { data: answersData } = await supabase
        .from('session_answers')
        .select(`
          *,
          quiz_sessions!inner(player_name)
        `)
        .eq('quiz_id', quizId)
        .eq('question_id', questions[currentQuestionIndex]?.id);

      const formattedAnswers: PlayerAnswer[] = answersData?.map(answer => ({
        player_name: answer.quiz_sessions.player_name,
        answer_text: answer.selected_answer,
        is_correct: answer.is_correct
      })) || [];

      setPlayerAnswers(formattedAnswers);
    } catch (error) {
      console.error('Error loading player answers:', error);
    }
  };

  useEffect(() => {
    if (quizStarted && questions.length > 0) {
      loadPlayerAnswers();
    }
  }, [currentQuestionIndex, quizStarted]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const getAnswerStats = () => {
    const stats: { [key: string]: number } = {};
    playerAnswers.forEach(answer => {
      stats[answer.answer_text] = (stats[answer.answer_text] || 0) + 1;
    });
    return stats;
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white">Učitavanje admin panela...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{quiz?.title}</h1>
              <p className="text-gray-600">Admin Panel - Pregled odgovora</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 text-blue-600">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">{players.length}</span>
                </div>
                <p className="text-xs text-gray-500">Igrači</p>
              </div>
              <button
                onClick={onQuizEnd}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-all"
              >
                Završi kviz
              </button>
            </div>
          </div>
        </div>

        {!quizStarted ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Spremni za početak kviza?</h2>
            <p className="text-gray-600 mb-8">
              {players.length} igrača je spremno. Kliknite da započnete.
            </p>
            <button
              onClick={handleStartQuiz}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg transition-all text-lg"
            >
              Pokreni kviz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Question Panel */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Pitanje {currentQuestionIndex + 1} / {questions.length}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg"
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-lg font-semibold text-gray-800 mb-4">
                  {currentQuestion?.question_text}
                </p>

                <div className="space-y-3">
                  {currentQuestion?.answers?.map((answer) => (
                    <div
                      key={answer.id}
                      className={`p-4 rounded-lg border-2 flex items-center gap-3 ${
                        answer.is_correct
                          ? 'bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      {answer.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`font-medium ${
                        answer.is_correct ? 'text-green-800' : 'text-gray-700'
                      }`}>
                        {answer.answer_text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Vreme: {currentQuestion?.time_limit} sekundi</span>
                <span>•</span>
                <span>Poeni: {currentQuestion?.points}</span>
              </div>
            </div>

            {/* Statistics Panel */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Statistika odgovora</h2>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  Ukupno odgovora: {playerAnswers.length} / {players.length}
                </p>

                {Object.entries(getAnswerStats()).map(([answer, count]) => {
                  const percentage = (count / players.length) * 100;
                  const isCorrect = currentQuestion?.answers?.find(a => a.answer_text === answer)?.is_correct;
                  
                  return (
                    <div key={answer} className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${
                          isCorrect ? 'text-green-700' : 'text-gray-700'
                        }`}>
                          {answer}
                        </span>
                        <span className="text-sm text-gray-600">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isCorrect ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Detalji igrača:</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {playerAnswers.map((answer, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">
                        {answer.player_name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{answer.answer_text}</span>
                        {answer.is_correct ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
