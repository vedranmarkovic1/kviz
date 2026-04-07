import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Results from './components/Results';
import Dashboard from './components/Dashboard';
import PinEntry from './components/PinEntry';
import QuizLobby from './components/QuizLobby';

type AppState =
  | { screen: 'login' }
  | { screen: 'register' }
  | { screen: 'home' }
  | { screen: 'dashboard' }
  | { screen: 'pinEntry' }
  | { screen: 'quizLobby'; quizId: string; playerName: string; isHost: boolean }
  | { screen: 'quiz'; quizId: string; playerName: string }
  | { screen: 'results'; sessionId: string; totalScore: number };

function App() {
  const [state, setState] = useState<AppState>({ screen: 'pinEntry' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    checkQuizLink();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setState({ screen: 'dashboard' });
      } else {
        setState({ screen: 'pinEntry' });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkQuizLink = () => {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (path.startsWith('/lobby/') && path.length > 7) {
      const quizId = path.substring(7);
      const isHost = urlParams.get('host') === 'true';
      
      // Go to quiz lobby
      setState({ 
        screen: 'quizLobby', 
        quizId, 
        playerName: isHost ? 'Quiz Master' : '', 
        isHost 
      });
    } else if (path === '/pin' || path === '/') {
      // Go to PIN entry
      setState({ screen: 'pinEntry' });
    } else if (path.startsWith('/quiz/') && path.length > 6) {
      const quizId = path.substring(6);
      const sessionId = urlParams.get('session');
      const isHost = urlParams.get('host') === 'true';
      
      if (isHost && sessionId) {
        // Host mode - go to quiz with session
        setState({ screen: 'quiz', quizId, playerName: 'Quiz Master' });
      } else {
        // Player mode - go to PIN entry
        setState({ screen: 'pinEntry' });
      }
    }
  };

  const checkAuth = async () => {
    try {
      console.log('Checking authentication...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'Found' : 'Not found');
      if (session) {
        setState({ screen: 'dashboard' });
      } else {
        setState({ screen: 'pinEntry' });
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Greška pri proveri autentikacije');
      setState({ screen: 'pinEntry' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = (quizId: string, playerName: string) => {
    setState({ screen: 'quiz', quizId, playerName });
  };

  const handleQuizComplete = (sessionId: string, totalScore: number) => {
    setState({ screen: 'results', sessionId, totalScore });
  };

  const handleGoHome = () => {
    setState({ screen: 'home' });
  };

  const handleLoginSuccess = () => {
    setState({ screen: 'dashboard' });
  };

  const handleRegisterSuccess = () => {
    setState({ screen: 'login' });
  };

  const handleJoinQuiz = (quizId: string, playerName: string) => {
    setState({ 
      screen: 'quizLobby', 
      quizId, 
      playerName, 
      isHost: false 
    });
  };

  const handleLobbyQuizStart = (quizId: string, playerName: string) => {
    setState({ screen: 'quiz', quizId, playerName });
  };

  const handleLogout = () => {
    setState({ screen: 'pinEntry' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
          {error && <p className="text-red-200 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (state.screen === 'login') {
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setState({ screen: 'register' })}
      />
    );
  }

  if (state.screen === 'register') {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onSwitchToLogin={() => setState({ screen: 'login' })}
      />
    );
  }

  if (state.screen === 'dashboard') {
    return <Dashboard onLogout={handleLogout} onLogin={() => setState({ screen: 'login' })} onNavigate={(screen) => {
      if (screen.startsWith('quizLobby?')) {
        const params = new URLSearchParams(screen.split('?')[1]);
        const quizId = params.get('quizId');
        const isHost = params.get('host') === 'true';
        if (quizId) {
          setState({ screen: 'quizLobby', quizId, playerName: 'Quiz Master', isHost });
        }
      } else {
        setState({ screen: screen as any });
      }
    }} />;
  }

  if (state.screen === 'pinEntry') {
    return <PinEntry onJoinQuiz={handleJoinQuiz} onLogin={() => setState({ screen: 'login' })} />;
  }

  if (state.screen === 'quizLobby') {
    return (
      <QuizLobby
        quizId={state.quizId}
        playerName={state.playerName}
        isHost={state.isHost}
        onQuizStart={handleLobbyQuizStart}
      />
    );
  }

  if (state.screen === 'quiz') {
    return (
      <Quiz
        quizId={state.quizId}
        playerName={state.playerName}
        onComplete={handleQuizComplete}
      />
    );
  }

  if (state.screen === 'results') {
    return (
      <Results
        sessionId={state.sessionId}
        totalScore={state.totalScore}
        onGoHome={handleGoHome}
      />
    );
  }

  return <Home onStartQuiz={handleStartQuiz} />;
}

export default App;
