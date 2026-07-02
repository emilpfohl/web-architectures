import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validatePasswordInput } from '../utils/logic';
import { authFetch } from '../utils/authFetch';

export function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const passwordCheck = validatePasswordInput(password);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.error || 'Ungültiges Passwort');
      return;
    }

    setLoading(true);

    try {
      const response = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: passwordCheck.value }),
      });

      if (response.ok) {
        onLoginSuccess();
        navigate('/');
      } else {
        const data = await response.json();
        setError(data.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (err) {
      setError('Verbindung zum Server fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="bg-flare" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-2xl p-8 rounded-[2rem] shadow-glass border border-white/40"
      >
        <div className="text-center mb-8">
           <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Digital Sanctuary</h1>
           <p className="text-gray-500 mt-2">Willkommen zurück. Bitte melde dich an.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" data-cy="login-form">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">E-Mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-gray-400"
              placeholder="deine@email.com"
              required
              data-cy="login-email-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 ml-1">Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/50 border border-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-gray-400"
              placeholder="••••••••"
              required
              data-cy="login-password-input"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2"
              data-cy="login-error"
            >
              <div className="material-symbols-outlined text-base">error</div>
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-primary-foreground font-medium rounded-2xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            data-cy="login-submit-button"
          >
            {loading ? 'Anmelden...' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Noch kein Konto?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Jetzt registrieren
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
