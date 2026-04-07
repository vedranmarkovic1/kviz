import { useEffect, useState } from 'react';
import { supabase, Quiz } from '../lib/supabase';
import { PlayCircle, Trophy, Clock } from 'lucide-react';

interface HomeProps {
  onStartQuiz: (quizId: string, playerName: string) => void;
}

export default function Home({ onStartQuiz }: HomeProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzes();
    checkQuizLink();
  }, []);

  const checkQuizLink = () => {
    const path = window.location.pathname;
    if (path.startsWith('/quiz/') && path.length > 6) {
      const quizId = path.substring(6);
      setSelectedQuiz(quizId);
    }
  };

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (selectedQuiz && playerName.trim()) {
      onStartQuiz(selectedQuiz, playerName.trim());
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="w-16 h-16 text-yellow-300 mr-4" />
            <h1 className="text-6xl font-bold text-white">QuizMaster</h1>
          </div>
          <p className="text-xl text-blue-100">
            {selectedQuiz ? 'Pozvan si na kviz!' : 'Testiraj svoje znanje kroz zabavne kvizove!'}
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl p-12 text-center">
            <Clock className="w-20 h-20 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Nema dostupnih kvizova</h2>
            <p className="text-gray-600">Kvizovi će uskoro biti dodati. Vrati se kasnije!</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {selectedQuiz ? 'Pozvani si na ovaj kviz:' : 'Izaberi svoj kviz'}
              </h2>

              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Unesi svoje ime..."
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="grid gap-4 mb-6">
                {(selectedQuiz
                  ? quizzes.filter((quiz) => quiz.id === selectedQuiz)
                  : quizzes
                ).map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => setSelectedQuiz(quiz.id)}
                    className={`text-left p-6 rounded-2xl border-3 transition-all transform hover:scale-102 ${
                      selectedQuiz === quiz.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg scale-102'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.title}</h3>
                    <p className="text-gray-600 mb-2">{quiz.description}</p>
                    <p className="text-sm text-gray-500">Autor: {quiz.author}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={handleStart}
                disabled={!selectedQuiz || !playerName.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-5 rounded-2xl font-bold text-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <PlayCircle className="w-8 h-8" />
                Počni kviz!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
