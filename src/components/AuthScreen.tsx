import { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User, Facebook } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx';
import { getSupabaseClient } from '../utils/supabase/client.tsx';

interface AuthScreenProps {
  onAuthSuccess: (user: any, accessToken: string) => void;
}

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/signin' : '/signup';
      const body =
        mode === 'login'
          ? { email, password }
          : { email, password, username };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-efd87c15${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri autentifikaciji');
      }

      if (mode === 'signup') {
        setMode('login');
        setError('');
        alert('Uspešno registrovan! Molimo prijavite se.');
      } else {
        onAuthSuccess(data.user, data.accessToken);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
      });

      if (error) {
        throw error;
      }

      alert(
        'Facebook prijava zahteva dodatnu konfiguraciju u Supabase dashboard-u. Molimo koristite email/lozinka prijavu.'
      );
    } catch (err: any) {
      console.error('Facebook login error:', err);
      setError('Facebook prijava trenutno nije dostupna');
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[var(--color-fircik-green-dark)] to-[var(--color-fircik-green)] landscape-only flex items-center justify-center p-4">
      {/* Scrollable container */}
      <div className="auth-container w-full max-w-md h-[90vh] overflow-y-auto flex justify-center items-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-fircik-white)] rounded-2xl shadow-2xl w-full p-4 sm:p-8 flex flex-col gap-4"
        >
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-4xl sm:text-5xl mb-2 text-[var(--color-fircik-green-dark)]">
              🂡 Fircik
            </h1>
            <p className="text-[var(--color-fircik-gray)] text-sm sm:text-base">
              {mode === 'login'
                ? 'Prijavite se na svoj nalog'
                : 'Kreirajte novi nalog'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[var(--color-fircik-gray)] mb-1 text-sm">
                  <User className="inline w-4 h-4 mr-1" />
                  Korisničko ime
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)] text-sm sm:text-base"
                  placeholder="Unesite korisničko ime"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-[var(--color-fircik-gray)] mb-1 text-sm">
                <Mail className="inline w-4 h-4 mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)] text-sm sm:text-base"
                placeholder="vas@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-[var(--color-fircik-gray)] mb-1 text-sm">
                <Lock className="inline w-4 h-4 mr-1" />
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-[var(--color-fircik-gray-light)] rounded-lg focus:border-[var(--color-fircik-green)] text-[var(--color-fircik-black)] text-sm sm:text-base"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-[var(--color-fircik-red-light)] text-white px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-fircik-green)] text-white py-2 sm:py-3 rounded-lg hover:bg-[var(--color-fircik-green-light)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                'Učitavanje...'
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  Prijavi se
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Registruj se
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--color-fircik-gray-light)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-fircik-white)] text-[var(--color-fircik-gray)]">
                ili
              </span>
            </div>
          </div>

          {/* Facebook login */}
          <button
            onClick={handleFacebookLogin}
            className="w-full bg-[#1877F2] text-white py-2 sm:py-3 rounded-lg hover:bg-[#166FE5] flex items-center justify-center gap-2 transition-colors"
          >
            <Facebook className="w-5 h-5" />
            Nastavi sa Facebook-om
          </button>

          {/* Switch mode */}
          <div className="mt-2 text-center text-sm">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="text-[var(--color-fircik-green)] hover:underline"
            >
              {mode === 'login'
                ? 'Nemate nalog? Registrujte se'
                : 'Već imate nalog? Prijavite se'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
