import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './shared/components/MainLayout';
import { Login } from './features/auth/Login';
import { Register } from './features/auth/Register';
import { LandingPage } from './features/landing/LandingPage';
import { ContactPage } from './features/legal/ContactPage';
import { ImpressumPage } from './features/legal/ImpressumPage';
import { AboutPage } from './features/legal/AboutPage';
import { authFetch } from './shared/lib/authFetch';
import { setupPushNotifications } from './shared/lib/push';

const PUBLIC_PATHS = ['/login', '/register', '/welcome', '/contact', '/impressum', '/about'];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    try {
      const response = await authFetch('/api/auth/me');
      if (response.ok) {
        setIsAuthenticated(true);
        if (['/login', '/register', '/welcome'].includes(location.pathname)) {
          navigate('/');
        }
      } else {
        setIsAuthenticated(false);
        if (!PUBLIC_PATHS.includes(location.pathname)) {
          navigate('/welcome');
        }
      }
    } catch {
      setIsAuthenticated(false);
      if (!PUBLIC_PATHS.includes(location.pathname)) {
        navigate('/welcome');
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      setupPushNotifications();
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="material-symbols-outlined animate-spin text-primary/40 text-4xl">progress_activity</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
