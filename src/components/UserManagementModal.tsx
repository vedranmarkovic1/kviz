import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash2, Shield, User } from 'lucide-react';

interface UserManagementModalProps {
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserManagementModal({ onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error: err } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju korisnika');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';

      const { error: err } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (err) throw err;

      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri ažuriranju uloge');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Jeste li sigurni da želite obrisati korisnika ${username}?`)) {
      return;
    }

    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) throw authError;

      setUsers(users.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri brisanju korisnika');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 flex justify-between items-center rounded-t-3xl">
          <h2 className="text-2xl font-bold text-gray-800">Upravljanje korisnicima</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-gray-600 py-8">Nema korisnika</p>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                          <Shield className="w-4 h-4" />
                          Admin
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                          <User className="w-4 h-4" />
                          Korisnik
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleToggleRole(user.id, user.role)}
                      className={`font-bold py-2 px-4 rounded-lg transition-all text-sm ${
                        user.role === 'admin'
                          ? 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                          : 'bg-yellow-400 hover:bg-yellow-500 text-gray-800'
                      }`}
                    >
                      {user.role === 'admin' ? 'Ukloni admin' : 'Postavi admin'}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Obriši
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded-lg transition-all"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
}
