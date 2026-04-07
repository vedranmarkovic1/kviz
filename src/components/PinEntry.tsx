import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Key } from 'lucide-react';

interface PinEntryProps {
  onJoinQuiz: (quizId: string, playerName: string) => void;
}

export default function PinEntry({ onJoinQuiz }: PinEntryProps) {
  const [pin, setPin] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizFound, setQuizFound] = useState<any>(null);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate PIN format
      if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        setError('PIN mora imati 6 cifara');
        setLoading(false);
        return;
      }

      // Find quiz by PIN
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('pin_code', pin)
        .eq('is_active', true)
        .single();

      if (quizError || !quizData) {
        setError('Neispravan PIN kod');
        setLoading(false);
        return;
      }

      setQuizFound(quizData);
    } catch (error) {
      console.error('Error finding quiz:', error);
      setError('Greška pri pretrazi kviza');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuiz = async () => {
    if (!playerName.trim()) {
      setError('Unesite svoje ime');
      return;
    }

    if (!quizFound) {
      setError('Kviz nije pronađen');
      return;
    }

    setLoading(true);
    try {
      // Create session for this player
      const { data: sessionData, error: sessionError } = await supabase
        .from('quiz_sessions')
        .insert({
          quiz_id: quizFound.id,
          player_name: playerName.trim(),
          total_score: 0,
          status: 'waiting',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      onJoinQuiz(quizFound.id, playerName.trim());
    } catch (error) {
      console.error('Error joining quiz:', error);
      setError('Greška pri priključivanju kvizu');
      setLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    if (value.length === 6) {
      setQuizFound(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
              <Key className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            QuizMaster
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Unesite PIN kod za pristup kvizu
          </p>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!quizFound ? (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  PIN Kod
                </label>
                <input
                  type="text"
                  value={pin}
                  onChange={handlePinChange}
                  className="w-full px-4 py-4 text-2xl text-center border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Unesite 6-cifreni PIN kod
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || pin.length !== 6}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
              >
                {loading ? 'Tražim kviz...' : 'Pronađi kviz'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-green-800 mb-2">Kviz pronađen!</h3>
                <p className="text-green-700 font-semibold">{quizFound.title}</p>
                <p className="text-green-600 text-sm">{quizFound.description}</p>
                <p className="text-green-600 text-xs mt-1">Autor: {quizFound.author}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vaše ime
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Unesite svoje ime"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setQuizFound(null);
                    setPin('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 rounded-lg transition-all"
                >
                  Nazad
                </button>
                <button
                  onClick={handleJoinQuiz}
                  disabled={loading || !playerName.trim()}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  {loading ? 'Pridružujem se...' : 'Pridruži se kvizu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
