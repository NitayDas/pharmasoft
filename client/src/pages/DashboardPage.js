import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <main style={{ padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827' }}>
      <section style={{ maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 12 }}>Welcome back</h1>
        <p style={{ marginBottom: 24, color: '#4b5563' }}>
          You are signed in as <strong>{user?.email || 'Unknown user'}</strong>.
        </p>
        <div style={{ display: 'grid', gap: 14, padding: 24, border: '1px solid #e5e7eb', borderRadius: 16, background: '#ffffff' }}>
          <div>
            <strong>Name:</strong> {user?.first_name || 'N/A'} {user?.last_name || ''}
          </div>
          <div>
            <strong>Role:</strong> {user?.role || 'N/A'}
          </div>
          <div>
            <strong>Phone:</strong> {user?.phone || 'N/A'}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ marginTop: 30, padding: '12px 18px', borderRadius: 10, border: 'none', background: '#0f766e', color: '#fff', cursor: 'pointer' }}
        >
          Logout
        </button>
      </section>
    </main>
  );
}
