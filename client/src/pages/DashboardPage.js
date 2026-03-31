import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh' }}>
        <aside style={{ background: '#111827', color: '#f8fafc', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#0f766e', display: 'grid', placeItems: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>P</span>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Pharma POS</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Sales dashboard</div>
              </div>
            </div>
            <nav style={{ display: 'grid', gap: 10 }}>
              {['Dashboard', 'Pharma Purchase', 'Non Pharma Purchase', 'Invoice', 'Cash Closer', 'Settings'].map((label) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: label === 'Invoice' ? 'rgba(15,118,110,.12)' : 'transparent',
                    color: '#f8fafc',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
              Logged in as
            </div>
            <div style={{ fontWeight: 700, lineHeight: 1.4 }}>{user?.email || 'No email'}</div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
              <button
                onClick={handleLogout}
                type="button"
                style={{ flex: 1, background: '#0f766e', border: 'none', padding: '12px 14px', borderRadius: 10, color: '#fff', cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main style={{ padding: '32px 34px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
            <div>
              <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Welcome back,</p>
              <h1 style={{ margin: '6px 0 0', fontSize: 32 }}>Invoice dashboard</h1>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Balance</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>৳ 12,850.00</div>
              </div>
              <button style={{ border: 'none', borderRadius: 12, padding: '12px 18px', background: '#0f766e', color: '#fff', cursor: 'pointer' }}>
                New Sale
              </button>
            </div>
          </header>

          <section style={{ display: 'grid', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 18 }}>
              {[
                { label: 'Total Sales', value: '৳ 162,300', accent: '#0284c7' },
                { label: 'Total Discount', value: '৳ 4,800', accent: '#9333ea' },
                { label: 'Previous', value: '৳ 18,450', accent: '#ea580c' },
              ].map((item) => (
                <div key={item.label} style={{ background: '#ffffff', borderRadius: 24, padding: '22px', boxShadow: '0 18px 45px rgba(15,23,42,.05)' }}>
                  <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: item.accent }}>{item.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18 }}>
                <div style={{ background: '#ffffff', borderRadius: 24, padding: '22px', boxShadow: '0 18px 45px rgba(15,23,42,.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20 }}>Invoice</h2>
                      <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 13 }}>Create and review your latest sales</p>
                    </div>
                    <button style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 16px', background: '#f8fafc', cursor: 'pointer' }}>
                      Edit
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: 18 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Return ID</div>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>#INV-0042</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Supplier</div>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>Mirpur Pharma</div>
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: 18, padding: '18px', display: 'grid', gap: 14 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 12, fontSize: 12, color: '#64748b', textTransform: 'uppercase' }}>
                        {['Item', 'Unit', 'Qty', 'Rate', 'Amount', 'Disc %', 'Net'].map((header) => (
                          <div key={header} style={{ fontWeight: 700 }}>{header}</div>
                        ))}
                      </div>
                      {['Paracetamol', 'Vitamin C', 'Cough Syrup'].map((item, index) => (
                        <div key={item} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: index < 2 ? '1px solid #e2e8f0' : 'none' }}>
                          <div style={{ fontSize: 14, color: '#0f172a' }}>{item}</div>
                          <div style={{ fontSize: 14, color: '#334155' }}>Box</div>
                          <div style={{ fontSize: 14, color: '#334155' }}>{index + 1}</div>
                          <div style={{ fontSize: 14, color: '#334155' }}>৳{40 + index * 20}</div>
                          <div style={{ fontSize: 14, color: '#0f172a' }}>৳{(40 + index * 20) * (index + 1)}</div>
                          <div style={{ fontSize: 14, color: '#334155' }}>{index === 2 ? '0' : '5'}</div>
                          <div style={{ fontSize: 14, color: '#0f172a' }}>৳{(40 + index * 20) * (index + 1) - (index === 2 ? 0 : 5)}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Previous</span>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>৳ 6,800</span>
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Change</span>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>৳ 2,000</span>
                      </div>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Grand Total</span>
                        <span style={{ fontSize: 18, fontWeight: 700 }}>৳ 9,300</span>
                      </div>
                    </div>
                  </div>
                </div>

                <aside style={{ background: '#ffffff', borderRadius: 24, padding: '24px', boxShadow: '0 18px 45px rgba(15,23,42,.05)' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Quick actions</div>
                  {[
                    { label: 'Pay with Points', color: '#6366f1' },
                    { label: 'Full Paid', color: '#f59e0b' },
                    { label: 'Cash Payment', color: '#16a34a' },
                    { label: 'Card Payment', color: '#0f766e' },
                  ].map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: action.color,
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginBottom: 10,
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </aside>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
