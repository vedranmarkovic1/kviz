import { useEffect, useState } from 'react';
import { supabase, Quiz } from '../lib/supabase';
import { Plus, LogOut, Settings, Trash2, CreditCard as Edit3, Play } from 'lucide-react';
import CreateQuizModal from './CreateQuizModal';
import UserManagementModal from './UserManagementModal';

interface DashboardProps {
  onLogout: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadUserAndQuizzes();
  }, [refreshTrigger]);

  const loadUserAndQuizzes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        onLogout();
        return;
      }

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        setUser(profileData);

        let quizzesQuery = supabase.from('quizzes').select('*');

        if (profileData.role !== 'admin') {
          quizzesQuery = quizzesQuery.eq('user_id', session.user.id);
        }

        const { data: quizzesData } = await quizzesQuery.order('created_at', {
          ascending: false,
        });

        setQuizzes(quizzesData || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!window.confirm('Jeste li sigurni da želite obrisati ovaj kviz?')) return;

    try {
      await supabase.from('quizzes').delete().eq('id', quizId);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Greška pri brisanju kviza');
    }
  };

  const handleStartQuiz = async (quizId: string) => {
    try {
      // Create a new quiz session
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: quizId,
          player_name: 'Quiz Master',
          total_score: 0,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Redirect to quiz with session ID
      window.location.href = `/quiz/${quizId}?session=${sessionData.id}&host=true`;
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Greška pri startovanju kviza');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white">Dashboard</h1>
              <p className="text-blue-100 mt-2">
                Dobrodošao, {user?.full_name || user?.username}
                {user?.role === 'admin' && <span className="ml-2 text-xs bg-yellow-400 text-gray-800 px-3 py-1 rounded-full font-bold">ADMIN</span>}
              </p>
            </div>

            <div className="flex gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Settings className="w-5 h-5" />
                  Upravljanje korisnicima
                </button>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                <LogOut className="w-5 h-5" />
                Odjavi se
              </button>
            </div>
          </div>

          <div className="mb-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            >
              <Plus className="w-6 h-6" />
              Kreiraj novi kviz
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Nemaš kvizova</h2>
              <p className="text-gray-600 mb-6">
                Kreiraj svoj prvi kviz klikom na dugme iznad
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
              >
                Kreiraj kviz
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:scale-105"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-blue-100 text-sm">KVIZ</p>
                      <p className="text-white text-2xl font-bold">{quiz.title.substring(0, 1)}</p>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {quiz.description || 'Nema opisa'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <span className="font-semibold">Autor:</span>
                      <span>{quiz.author}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const quizLink = `${window.location.origin}/quiz/${quiz.id}`;
                          navigator.clipboard.writeText(quizLink);
                          alert('Link kviza kopiran u clipboard');
                        }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                      >
                        Podeli
                      </button>

                      {(quiz.user_id === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleStartQuiz(quiz.id)}
                          className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
                          title="Startuj kviz"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (quiz.user_id === user?.id || user?.role === 'admin') {
                            window.location.href = `/edit/${quiz.id}`;
                          }
                        }}
                        className="flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg transition-all text-sm"
                        title="Uredi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {(quiz.user_id === user?.id || user?.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="flex items-center justify-center gap-1 bg-red-200 hover:bg-red-300 text-red-700 font-bold py-2 px-4 rounded-lg transition-all text-sm"
                          title="Obriši"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateQuizModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}

      {showUserManagement && user?.role === 'admin' && (
        <UserManagementModal
          onClose={() => {
            setShowUserManagement(false);
            setRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
