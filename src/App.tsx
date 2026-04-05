import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Results from './components/Results';
import Dashboard from './components/Dashboard';

type AppState =
  | { screen: 'login' }
  | { screen: 'register' }
  | { screen: 'home' }
  | { screen: 'dashboard' }
  | { screen: 'quiz'; quizId: string; playerName: string }
  | { screen: 'results'; sessionId: string; totalScore: number };

function App() {
  const [state, setState] = useState<AppState>({ screen: 'login' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setState({ screen: 'dashboard' });
      } else {
        setIsAuthenticated(false);
        setState({ screen: 'login' });
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsAuthenticated(true);
        setState({ screen: 'dashboard' });
      } else {
        setIsAuthenticated(false);
        setState({ screen: 'login' });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setState({ screen: 'login' });
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
    setIsAuthenticated(true);
    setState({ screen: 'dashboard' });
  };

  const handleRegisterSuccess = () => {
    setState({ screen: 'login' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setState({ screen: 'login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
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
    return <Dashboard onLogout={handleLogout} />;
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
