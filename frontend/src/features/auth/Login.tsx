import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { validatePasswordInput } from '../../shared/lib/logic';
import { authFetch } from '../../shared/lib/authFetch';
import { AuthShowcase } from './AuthShowcase';

const fieldContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fieldItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Bitte fülle alle Felder aus.');
      return;
    }

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
    <div className="login-page relative min-h-screen overflow-hidden">
      <div className="bg-flare" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] lg:bg-[linear-gradient(115deg,transparent_0%,transparent_15%,color-mix(in_oklab,var(--color-primary)_20%,transparent)_35%,color-mix(in_oklab,var(--color-primary)_60%,transparent)_55%,color-mix(in_oklab,var(--color-primary)_90%,transparent)_75%,var(--color-primary)_92%)]"
      />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-4 pt-10 pb-28 sm:pt-14 sm:pb-32 lg:min-h-screen lg:-mt-10 lg:justify-center lg:pb-24">
        <div className="text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-40 w-full max-w-2xl rounded-full bg-[radial-gradient(ellipse_at_center,white_0%,white_40%,rgba(94,96,91,0.1)_70%,rgba(94,96,91,0)_100%)] blur-2xl sm:h-56 sm:max-w-3xl sm:blur-3xl lg:h-64"
          />
          <h1 className="relative z-10 font-headline text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Alles, was eure WG wirklich braucht
          </h1>
          <p className="relative z-10 mt-3 text-gray-500">
            Aufgaben, Einkaufsliste, Finanzen und Chat an einem Ort.
          </p>
        </div>

        <div className="relative z-10 mx-auto mt-10 grid w-full items-start gap-8 sm:mt-12 lg:mt-16 lg:grid-cols-[45%_55%]">
        <div className="flex w-full flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-2xl p-6 sm:p-8 rounded-[2rem] shadow-2xl shadow-primary/20 ring-1 ring-primary/15 border border-white/60"
          >
            <div className="text-center mb-8">
               <p className="text-gray-500">Willkommen zurück. Bitte melde dich an.</p>
            </div>

            <motion.form
            variants={fieldContainer}
            initial="hidden"
            animate="show"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
            data-cy="login-form"
          >
            <motion.div variants={fieldItem} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-gray-400 focus:scale-[1.01]"
                placeholder="deine@email.com"
                data-cy="login-email-input"
              />
            </motion.div>

            <motion.div variants={fieldItem} className="space-y-2">
              <label className="text-sm font-medium text-gray-700 ml-1">Passwort</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-white/50 border border-white focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-2xl outline-none transition-all placeholder:text-gray-400 focus:scale-[1.01]"
                  placeholder="••••••••"
                  data-cy="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  data-cy="login-password-toggle"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </motion.div>

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

            <motion.button
              variants={fieldItem}
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden py-4 bg-primary text-white font-medium rounded-2xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              data-cy="login-submit-button"
            >
              <span className="relative z-10">{loading ? 'Anmelden...' : 'Anmelden'}</span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </motion.button>
          </motion.form>

          <div className="mt-8 text-center text-sm text-gray-500">
            Noch kein Konto?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Jetzt registrieren
            </Link>
          </div>
        </motion.div>
        </div>

        <AuthShowcase />
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex items-center justify-between px-4 py-4 sm:px-[30px] sm:py-[30px]">
        <div className="pointer-events-auto flex items-center gap-4 sm:gap-5">
          <Link to="/contact" className="text-xs font-medium text-primary transition-opacity hover:opacity-80 sm:text-sm">
            Kontakt
          </Link>
          <Link to="/impressum" className="text-xs font-medium text-primary transition-opacity hover:opacity-80 sm:text-sm">
            Impressum
          </Link>
        </div>
        <div className="pointer-events-auto hidden lg:flex">
          <Link to="/about" className="text-sm font-medium text-white transition-opacity hover:opacity-80">
            Über uns
          </Link>
        </div>
      </div>
    </div>
  );
}
