import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './components/MainLayout';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { authFetch } from './utils/authFetch';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const checkAuth = async () => {
    try {
      const response = await authFetch('/api/auth/me');
      if (response.ok) {
        setIsAuthenticated(true);
        if (location.pathname === '/login' || location.pathname === '/register') {
          navigate('/');
        }
      } else {
        setIsAuthenticated(false);
        if (location.pathname !== '/login' && location.pathname !== '/register') {
          navigate('/login');
        }
      }
    } catch {
      setIsAuthenticated(false);
      if (location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="material-symbols-outlined animate-spin text-primary/40 text-4xl">progress_activity</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login onLoginSuccess={() => setIsAuthenticated(true)} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}

export default App;
