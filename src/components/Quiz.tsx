import { useEffect, useState } from 'react';
import { supabase, Question, Answer } from '../lib/supabase';
import { Clock, Trophy } from 'lucide-react';

interface QuizProps {
  quizId: string;
  playerName: string;
  onComplete: (sessionId: string, totalScore: number) => void;
}

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];
const HOVER_COLORS = ['hover:bg-red-600', 'hover:bg-blue-600', 'hover:bg-yellow-600', 'hover:bg-green-600'];

export default function Quiz({ quizId, playerName, onComplete }: QuizProps) {
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    if (timeLeft > 0 && !selectedAnswer) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !selectedAnswer && questions.length > 0) {
      handleTimeout();
    }
  }, [timeLeft, selectedAnswer]);

  const loadQuiz = async () => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_number', { ascending: true });

      if (questionsError) throw questionsError;

      const questionsWithAnswers = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: answersData } = await supabase
            .from('answers')
            .select('*')
            .eq('question_id', question.id)
            .order('order_number', { ascending: true });

          return {
            ...question,
            answers: answersData || [],
          };
        })
      );

      setQuestions(questionsWithAnswers);

      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: quizId,
          player_name: playerName,
          total_score: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(sessionData.id);

      if (questionsWithAnswers.length > 0) {
        setTimeLeft(questionsWithAnswers[0].time_limit);
        setQuestionStartTime(Date.now());
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading quiz:', error);
      setLoading(false);
    }
  };

  const calculatePoints = (timeLimit: number, timeTaken: number, maxPoints: number) => {
    const timeRatio = Math.max(0, (timeLimit - timeTaken) / timeLimit);
    return Math.round(maxPoints * (0.5 + 0.5 * timeRatio));
  };

  const handleAnswer = async (answerId: string) => {
    if (selectedAnswer) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswerObj = currentQuestion.answers.find((a) => a.id === answerId);
    const correct = selectedAnswerObj?.is_correct || false;

    setSelectedAnswer(answerId);
    setIsCorrect(correct);
    setShowResult(true);

    let pointsEarned = 0;
    if (correct) {
      pointsEarned = calculatePoints(currentQuestion.time_limit, timeTaken, currentQuestion.points);
      setScore(score + pointsEarned);
    }

    await supabase.from('session_answers').insert({
      session_id: sessionId,
      question_id: currentQuestion.id,
      answer_id: answerId,
      time_taken: timeTaken,
      points_earned: pointsEarned,
    });

    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  const handleTimeout = async () => {
    const currentQuestion = questions[currentQuestionIndex];

    await supabase.from('session_answers').insert({
      session_id: sessionId,
      question_id: currentQuestion.id,
      answer_id: null,
      time_taken: currentQuestion.time_limit,
      points_earned: 0,
    });

    setShowResult(true);
    setIsCorrect(false);

    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(questions[nextIndex].time_limit);
      setQuestionStartTime(Date.now());
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = async () => {
    await supabase
      .from('quiz_sessions')
      .update({
        total_score: score,
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    onComplete(sessionId, score);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
          <p className="text-2xl text-gray-800">Ovaj kviz nema pitanja.</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-t-3xl p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-800">{score}</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold text-gray-700">
                  Pitanje {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-500" />
                <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-b-3xl p-8 shadow-2xl mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.answers.map((answer, index) => {
                const isSelected = selectedAnswer === answer.id;
                const showCorrect = showResult && answer.is_correct;
                const showWrong = showResult && isSelected && !answer.is_correct;

                return (
                  <button
                    key={answer.id}
                    onClick={() => handleAnswer(answer.id)}
                    disabled={selectedAnswer !== null}
                    className={`p-6 rounded-2xl font-bold text-xl text-white transition-all transform hover:scale-105 disabled:cursor-not-allowed shadow-lg ${
                      showCorrect
                        ? 'bg-green-500 ring-4 ring-green-300'
                        : showWrong
                        ? 'bg-red-500 ring-4 ring-red-300'
                        : `${COLORS[index % 4]} ${selectedAnswer ? 'opacity-50' : HOVER_COLORS[index % 4]}`
                    }`}
                  >
                    {answer.answer_text}
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div className={`mt-6 p-4 rounded-xl text-center text-lg font-semibold ${
                isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isCorrect ? '🎉 Tačno!' : '❌ Netačno!'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
