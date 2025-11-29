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
    <div className="auth-screen-container landscape-only">
      <div className="auth-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-card"
        >
          {/* Header */}
          <div className="auth-header">
            <h1 className="auth-title">🂡 Fircik</h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Prijavite se na svoj nalog'
                : 'Kreirajte novi nalog'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">
                  <User />
                  Korisničko ime
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input"
                  placeholder="Unesite korisničko ime"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <Mail />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="vas@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock />
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                'Učitavanje...'
              ) : mode === 'login' ? (
                <>
                  <LogIn />
                  Prijavi se
                </>
              ) : (
                <>
                  <UserPlus />
                  Registruj se
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <div className="divider-text">
              <span>ili</span>
            </div>
          </div>

          {/* Facebook login */}
          <button
            onClick={handleFacebookLogin}
            className="facebook-button"
          >
            <Facebook />
            Nastavi sa Facebook-om
          </button>

          {/* Switch mode */}
          <div className="switch-mode">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="switch-button"
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