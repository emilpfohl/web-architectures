import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Plus, MapPin } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/calendar';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        // Sort events chronologically
        const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sorted);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching events:", err));
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: title.trim(), 
          date, 
          time: time || 'Ganztägig' 
        })
      });
      const data = await res.json();
      const newEvents = [...events, data].sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(newEvents);
      setTitle('');
      setDate('');
      setTime('');
    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('de-DE', options);
  };

  return (
    <div className="page-container animate-fade-in">
      <header className="page-header">
        <h1>WG Kalender 📅</h1>
        <p>Gemeinsame Termine, Putztage oder Events.</p>
      </header>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        
        {/* Form Column */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2>Neuer Termin</h2>
            <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Titel (z.B. WG Party)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ margin: 0 }}
              />
              <input 
                type="date" 
                className="input-field" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ margin: 0 }}
              />
              <input 
                type="time" 
                className="input-field" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={{ margin: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                <Plus size={20} />
                Termin eintragen
              </button>
            </form>
          </div>
        </div>

        {/* Events List Column */}
        <div style={{ flex: 2, minWidth: '300px' }}>
          <div className="glass-panel" style={{ padding: '2rem', minHeight: '350px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarIcon size={24} color="var(--accent-blue)" /> 
              Kommende Termine
            </h2>
            
            {loading ? (
              <p style={{ marginTop: '1.5rem' }}>Lädt Termine...</p>
            ) : events.length === 0 ? (
              <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}>Keine anstehenden Termine.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                {events.map((ev, index) => {
                  const now = new Date();
                  const eventDate = new Date(ev.date);
                  const isPast = eventDate < new Date(now.setHours(0,0,0,0));

                  return (
                    <div 
                      key={ev.id || index} 
                      style={{ 
                        padding: '1.25rem', 
                        background: 'white', border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        opacity: isPast ? 0.5 : 1,
                        borderLeft: isPast ? '4px solid var(--text-secondary)' : '4px solid var(--accent-blue)'
                      }}
                    >
                      <h3 style={{ fontSize: '1.2rem', margin: 0, color: isPast ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {ev.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CalendarIcon size={14} />
                          {formatDate(ev.date)}
                        </div>
                        {ev.time && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Clock size={14} />
                            {ev.time} Uhr
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
