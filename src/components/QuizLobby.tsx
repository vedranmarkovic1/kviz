import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Clock, Play, Trophy } from 'lucide-react';

interface QuizLobbyProps {
  quizId: string;
  playerName: string;
  isHost: boolean;
  onQuizStart: (quizId: string, playerName: string) => void;
}

interface Player {
  id: string;
  player_name: string;
  joined_at: string;
}

export default function QuizLobby({ quizId, playerName, isHost, onQuizStart }: QuizLobbyProps) {
  const [quiz, setQuiz] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    loadQuizAndPlayers();
    
    // Set up real-time subscription for quiz sessions
    const subscription = supabase
      .channel(`quiz-${quizId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'quiz_sessions',
          filter: `quiz_id=eq.${quizId}`
        }, 
        (payload) => {
          console.log('Quiz session change:', payload);
          loadPlayers();
        }
      )
      .subscribe();

    // Set up polling as fallback
    const pollInterval = setInterval(() => {
      loadPlayers();
    }, 3000); // Poll every 3 seconds

    return () => {
      subscription.unsubscribe();
      clearInterval(pollInterval);
    };
  }, [quizId]);

  const loadQuizAndPlayers = async () => {
    try {
      // Load quiz info
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      // Load players
      await loadPlayers();
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    try {
      console.log('Loading players for quiz:', quizId);
      const { data: playersData, error: playersError } = await supabase
        .from('quiz_sessions')
        .select('*')
        .eq('quiz_id', quizId)
        .eq('status', 'waiting')
        .order('created_at', { ascending: true });

      console.log('Players data:', playersData);
      console.log('Players error:', playersError);

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleStartQuiz = async () => {
    if (!isHost) return;

    try {
      setLoading(true);
      
      // Update all waiting sessions to active
      const { error: updateError } = await supabase
        .from('quiz_sessions')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString()
        })
        .eq('quiz_id', quizId)
        .eq('status', 'waiting');

      if (updateError) throw updateError;

      setQuizStarted(true);
      
      // Start quiz for all players
      setTimeout(() => {
        onQuizStart(quizId, playerName);
      }, 1000);
    } catch (error) {
      console.error('Error starting quiz:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if quiz has started
    const checkQuizStatus = async () => {
      try {
        const { data: activeSession } = await supabase
          .from('quiz_sessions')
          .select('*')
          .eq('quiz_id', quizId)
          .eq('status', 'active')
          .limit(1)
          .single();

        if (activeSession && !isHost) {
          setQuizStarted(true);
          setTimeout(() => {
            onQuizStart(quizId, playerName);
          }, 1000);
        }
      } catch (error) {
        // No active session found
      }
    };

    const interval = setInterval(checkQuizStatus, 2000);
    return () => clearInterval(interval);
  }, [quizId, playerName, isHost, onQuizStart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white">Učitavanje lobija...</p>
        </div>
      </div>
    );
  }

  if (quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-20 h-20 text-yellow-300 mx-auto mb-4 animate-bounce" />
          <h1 className="text-4xl font-bold text-white mb-2">Kviz počinje!</h1>
          <p className="text-xl text-blue-100">Pripremite se...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Quiz Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz?.title}</h1>
            <p className="text-gray-600 mb-4">{quiz?.description}</p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {players.length} igrača
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                PIN: {quiz?.pin_code}
              </span>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Igrači u lobiju</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 text-center transform transition-all hover:scale-105"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-sm font-bold">{index + 1}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 truncate">{player.player_name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Host Controls */}
          {isHost ? (
            <div className="text-center">
              <button
                onClick={handleStartQuiz}
                disabled={loading || players.length === 0}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto text-lg"
              >
                <Play className="w-6 h-6" />
                {loading ? 'Pokretanje...' : 'Pokreni kviz'}
              </button>
              {players.length === 0 && (
                <p className="text-red-500 text-sm mt-2">Čekanje da se igrači pridruže...</p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-semibold">Čekanje da admin pokrene kviz...</p>
                <p className="text-yellow-600 text-sm mt-1">Budite spremni!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
