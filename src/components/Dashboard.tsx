import { useEffect, useState } from 'react';
import { supabase, Quiz } from '../lib/supabase';
import { Plus, LogOut, Settings, Trash2, CreditCard as Edit3, Play, Key, Lock, Unlock, RefreshCw } from 'lucide-react';
import CreateQuizModal from './CreateQuizModal';
import UserManagementModal from './UserManagementModal';

interface DashboardProps {
  onLogout: () => void;
  onLogin: () => void;
  onNavigate: (screen: string) => void;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
}

export default function Dashboard({ onLogout, onLogin, onNavigate }: DashboardProps) {
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
        // Load public quizzes for non-authenticated users
        const { data: publicQuizzesData } = await supabase
          .from('quizzes')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        setQuizzes(publicQuizzesData || []);
        setUser(null);
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
      // Generate PIN if it doesn't exist
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('pin_code')
        .eq('id', quizId)
        .single();

      if (!quizData?.pin_code) {
        const { data: newPin, error: pinError } = await supabase
          .rpc('regenerate_quiz_pin', { quiz_uuid: quizId });

        if (pinError) throw pinError;
        alert(`PIN generisan: ${newPin}`);
      }

      // Navigate to quiz lobby as host with quizId
      onNavigate(`quizLobby?quizId=${quizId}&host=true`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('Greška pri startovanju kviza');
    }
  };

  const handleToggleLock = async (quizId: string, isLocked: boolean) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ is_locked: !isLocked })
        .eq('id', quizId);

      if (error) throw error;
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error toggling lock:', error);
      alert('Greška pri zaključavanju/otključavanju kviza');
    }
  };

  const handleRegeneratePin = async (quizId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('regenerate_quiz_pin', { quiz_uuid: quizId });

      if (error) throw error;
      alert(`Novi PIN: ${data}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error('Error regenerating PIN:', error);
      alert('Greška pri generisanju novog PIN-a');
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white">QuizMaster</h1>
              <p className="text-blue-100 mt-2 text-sm sm:text-base">
                {user ? (
                  <>
                    Dobrodošao, {user?.full_name || user?.username}
                    {user?.role === 'admin' && <span className="ml-2 text-xs bg-yellow-400 text-gray-800 px-3 py-1 rounded-full font-bold">ADMIN</span>}
                  </>
                ) : (
                  'Pristupite kvizovima ili se prijavite'
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              {user ? (
                <>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => setShowUserManagement(true)}
                      className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Upravljanje korisnicima</span>
                      <span className="sm:hidden">Korisnici</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    Odjavi se
                  </button>
                </>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold py-2 px-3 sm:py-3 sm:px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-xs sm:text-sm"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                  Login
                </button>
              )}
            </div>
          </div>

          <div className="mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => onNavigate('pinEntry')}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 sm:px-8 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-sm sm:text-base"
            >
              <Key className="w-5 h-5 sm:w-6 sm:h-6" />
              Uđi u kviz sa PIN kodom
            </button>
            
            {user && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-bold py-3 px-4 sm:px-8 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-sm sm:text-base"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                Kreiraj novi kviz
              </button>
            )}
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center shadow-2xl">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {user ? 'Nemaš kvizova' : 'Nema dostupnih kvizova'}
              </h2>
              <p className="text-gray-600 mb-6">
                {user 
                  ? 'Kreiraj svoj prvi kviz klikom na dugme iznad'
                  : 'Prijavite se da kreirate kvizove ili sačekajte da admini dodaju nove kvizove'
                }
              </p>
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all"
                >
                  Kreiraj kviz
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white rounded-2xl sm:rounded-3xl shadow-lg hover:shadow-2xl transition-all overflow-hidden transform hover:scale-105"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-32 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-blue-100 text-sm">KVIZ</p>
                      <p className="text-white text-2xl font-bold">{quiz.title.substring(0, 1)}</p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">
                      {quiz.description || 'Nema opisa'}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-500 mb-4">
                      <span className="font-semibold">Autor: {quiz.author}</span>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {quiz.is_locked && (
                          <span className="bg-red-100 text-red-800 px-1 sm:px-2 py-1 rounded-full font-bold flex items-center gap-1 text-xs">
                            <Lock className="w-3 h-3" />
                            <span className="hidden sm:inline">Zaključan</span>
                            <span className="sm:hidden">🔒</span>
                          </span>
                        )}
                        {quiz.pin_code && (
                          <span className="bg-blue-100 text-blue-800 px-1 sm:px-2 py-1 rounded-full font-mono font-bold text-xs">
                            PIN: {quiz.pin_code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {quiz.pin_code ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(quiz.pin_code);
                            alert(`PIN kod ${quiz.pin_code} kopiran u clipboard!`);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm"
                        >
                          <span className="hidden sm:inline">Kopiraj PIN</span>
                          <span className="sm:hidden">📋</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex-1 bg-gray-400 text-gray-200 font-bold py-2 px-2 sm:px-4 rounded-lg text-xs sm:text-sm cursor-not-allowed"
                          title="PIN će biti generisan kada se startuje kviz"
                        >
                          <span className="hidden sm:inline">Nema PIN</span>
                          <span className="sm:hidden">❌</span>
                        </button>
                      )}

                      {(quiz.user_id === user?.id || user?.role === 'admin') && (
                        <>
                          <button
                            onClick={() => handleStartQuiz(quiz.id)}
                            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm"
                            title="Startuj kviz"
                          >
                            <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">▶</span>
                          </button>

                          <button
                            onClick={() => handleToggleLock(quiz.id, quiz.is_locked || false)}
                            className={`flex items-center justify-center gap-1 font-bold py-2 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm ${
                              quiz.is_locked 
                                ? 'bg-orange-200 hover:bg-orange-300 text-orange-700' 
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            }`}
                            title={quiz.is_locked ? 'Otključaj kviz' : 'Zaključaj kviz'}
                          >
                            {quiz.is_locked ? <Unlock className="w-3 h-3 sm:w-4 sm:h-4" /> : <Lock className="w-3 h-3 sm:w-4 sm:h-4" />}
                          </button>

                          <button
                            onClick={() => handleRegeneratePin(quiz.id)}
                            className="flex items-center justify-center gap-1 bg-purple-200 hover:bg-purple-300 text-purple-700 font-bold py-2 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm"
                            title="Generiši novi PIN"
                          >
                            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (quiz.user_id === user?.id || user?.role === 'admin') {
                                window.location.href = `/edit/${quiz.id}`;
                              }
                            }}
                            className="flex items-center justify-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm"
                            title="Uredi"
                          >
                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteQuiz(quiz.id)}
                            className="flex items-center justify-center gap-1 bg-red-200 hover:bg-red-300 text-red-700 font-bold py-2 px-2 sm:px-4 rounded-lg transition-all text-xs sm:text-sm"
                            title="Obriši"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </>
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
