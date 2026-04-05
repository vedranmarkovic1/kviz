import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateQuizModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Question {
  text: string;
  timeLimit: number;
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
}

export default function CreateQuizModal({ onClose, onSuccess }: CreateQuizModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      timeLimit: 20,
      answers: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        timeLimit: 20,
        answers: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      },
    ]);
    setCurrentStep(questions.length);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      alert('Mora biti najmanje jedno pitanje');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: string, value: any) => {
    const updated = [...questions];
    if (field === 'text') updated[index].text = value;
    else if (field === 'timeLimit') updated[index].timeLimit = value;
    setQuestions(updated);
  };

  const handleAnswerChange = (
    questionIndex: number,
    answerIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...questions];
    if (field === 'text') updated[questionIndex].answers[answerIndex].text = value;
    else if (field === 'isCorrect') {
      updated[questionIndex].answers.forEach((a, i) => {
        a.isCorrect = i === answerIndex;
      });
    }
    setQuestions(updated);
  };

  const handleAddAnswer = (questionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].answers.length < 5) {
      updated[questionIndex].answers.push({ text: '', isCorrect: false });
      setQuestions(updated);
    }
  };

  const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].answers.length > 2) {
      updated[questionIndex].answers.splice(answerIndex, 1);
      setQuestions(updated);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Naslov je obavezan');
      return false;
    }
    if (!author.trim()) {
      setError('Autor je obavezan');
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setError(`Pitanje ${i + 1} je obavezno`);
        return false;
      }
      for (let j = 0; j < questions[i].answers.length; j++) {
        if (!questions[i].answers[j].text.trim()) {
          setError(`Odgovor ${j + 1} na pitanju ${i + 1} je obavezan`);
          return false;
        }
      }
      if (!questions[i].answers.some((a) => a.isCorrect)) {
        setError(`Pitanje ${i + 1} mora imati barem jedan tačan odgovor`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Niste prijavljeni');
        setLoading(false);
        return;
      }

      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          author,
          user_id: session.user.id,
          is_active: true,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      for (let i = 0; i < questions.length; i++) {
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: quizData.id,
            question_text: questions[i].text,
            time_limit: questions[i].timeLimit,
            points: 1000,
            order_number: i + 1,
          })
          .select()
          .single();

        if (questionError) throw questionError;

        const answersToInsert = questions[i].answers.map((answer, j) => ({
          question_id: questionData.id,
          answer_text: answer.text,
          is_correct: answer.isCorrect,
          order_number: j + 1,
        }));

        const { error: answersError } = await supabase
          .from('answers')
          .insert(answersToInsert);

        if (answersError) throw answersError;
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Došlo je do greške');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-800">Kreiraj novi kviz</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {currentStep === 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">Osnovne informacije</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Naslov kviza
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="npr. Opšta kultura"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Tvoje ime"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opis
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="Opis kviza (opciono)"
                  rows={3}
                />
              </div>

              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all"
              >
                Nastavi na pitanja
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  Pitanja ({questions.length})
                </h3>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj pitanje
                </button>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentStep(i + 1)}
                    className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                      currentStep === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pitanje {i + 1}
                  </button>
                ))}
              </div>

              {questions.map(
                (question, questionIndex) =>
                  currentStep === questionIndex + 1 && (
                    <div key={questionIndex} className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Pitanje {questionIndex + 1}
                          </label>
                          <textarea
                            value={question.text}
                            onChange={(e) =>
                              handleQuestionChange(questionIndex, 'text', e.target.value)
                            }
                            className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                            placeholder="Unesite pitanje"
                            rows={2}
                          />
                        </div>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(questionIndex)}
                            className="ml-2 p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Vremenska granica (sekunde)
                        </label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={question.timeLimit}
                          onChange={(e) =>
                            handleQuestionChange(
                              questionIndex,
                              'timeLimit',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Odgovori
                          </label>
                          {question.answers.length < 5 && (
                            <button
                              type="button"
                              onClick={() => handleAddAnswer(questionIndex)}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                            >
                              + Dodaj odgovor
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {question.answers.map((answer, answerIndex) => (
                            <div key={answerIndex} className="flex gap-2">
                              <input
                                type="radio"
                                name={`correct-${questionIndex}`}
                                checked={answer.isCorrect}
                                onChange={() =>
                                  handleAnswerChange(
                                    questionIndex,
                                    answerIndex,
                                    'isCorrect',
                                    true
                                  )
                                }
                                className="w-4 h-4 mt-2 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={answer.text}
                                onChange={(e) =>
                                  handleAnswerChange(
                                    questionIndex,
                                    answerIndex,
                                    'text',
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                                placeholder={`Odgovor ${answerIndex + 1}`}
                              />
                              {question.answers.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveAnswer(questionIndex, answerIndex)
                                  }
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-lg transition-all"
                >
                  Nazad
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Kreiranja...' : 'Kreiraj kviz'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
