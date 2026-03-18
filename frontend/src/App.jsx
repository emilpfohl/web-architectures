import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ShoppingCart, CheckSquare, Calendar as CalendarIcon, Wallet, Home } from 'lucide-react';
import './App.css';

// Component Imports
import ShoppingList from './pages/ShoppingList';
import TodoPlanner from './pages/TodoPlanner';
import Calendar from './pages/Calendar';
import Finance from './pages/Finance';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Sidebar Navigation */}
        <aside className="sidebar glass-panel">
          <div className="sidebar-header">
            <div className="logo-icon">WG</div>
            <h2>Life</h2>
          </div>
          
          <nav className="nav-menu">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')} end>
              <Home size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/shopping" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <ShoppingCart size={20} />
              <span>Einkaufsliste</span>
            </NavLink>
            <NavLink to="/todos" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <CheckSquare size={20} />
              <span>Todo Planer</span>
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <CalendarIcon size={20} />
              <span>Kalender</span>
            </NavLink>
            <NavLink to="/finance" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              <Wallet size={20} />
              <span>Finanzcheck</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="/todos" element={<TodoPlanner />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/finance" element={<Finance />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
