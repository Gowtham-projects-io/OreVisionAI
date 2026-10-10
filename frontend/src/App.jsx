import { useState, useEffect, useCallback } from 'react'
import './index.css'
import { fetchHealth } from './api'
import LandingPage from './components/LandingPage'
import SatelliteExplorer from './components/SatelliteExplorer'
import ManganeseProspectivity from './components/ManganeseProspectivity'
import ChangeDetection from './components/ChangeDetection'
import Reports from './components/Reports'
import IndiaAtlas from './components/IndiaAtlas'

const TABS = [
  { id: 'home',          icon: '🚀', label: 'Mission Overview' },
  { id: 'india-atlas',   icon: '🇮🇳', label: 'India Mineral Map' },
  { id: 'explorer',      icon: '🛰️', label: 'Satellite Explorer' },
  { id: 'prospectivity', icon: '⚡', label: 'Mn Prospectivity' },
  { id: 'change',        icon: '🔄', label: 'Change Detection' },
  { id: 'reports',       icon: '📄', label: 'Reports' },
]

function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast ${t.type}`}
          onClick={() => onDismiss(t.id)}
          style={{ cursor: 'pointer' }}
        >
          <span>{t.type === 'error' ? '❌' : t.type === 'success' ? '✅' : 'ℹ️'}</span>
          <span style={{ color: 'var(--color-ice-white)' }}>{t.message}</span>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [health, setHealth] = useState(null)
  const [healthStatus, setHealthStatus] = useState('checking')
  const [toasts, setToasts] = useState([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [systemTime] = useState(() => new Date().toLocaleString())

  // ── Theme Toggle ──────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('orevision-theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('orevision-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  // Pilot AOI: Keonjhar–Sundargarh, Odisha (Bonai-Keonjhar Belt)
  const [sharedBbox, setSharedBbox] = useState({ west: 85.05, south: 21.75, east: 85.65, north: 22.35 })

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev.slice(-2), { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000)
  }, [])

  const dismissToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    fetchHealth()
      .then(data => {
        setHealth(data)
        setHealthStatus('ok')
      })
      .catch(() => {
        setHealthStatus('error')
        addToast('Cannot reach OreVision AI backend. Is the server running?', 'error')
      })
  }, [addToast])

  return (
    <div className="app">
      {/* ── Navbar ── */}
      <header className="navbar" style={{ zIndex: 100 }}>
        <div className="navbar-brand" onClick={() => setActiveTab('home')}>
          <div className="brand-icon-wrapper">
            <svg viewBox="0 0 100 100" className="brand-crystal-symbol" fill="none">
              <polygon points="50,6 90,30 90,70 50,94 10,70 10,30" stroke="#8B5CF6" strokeWidth="5" fill="#1A1824" />
              <polygon points="50,25 75,40 75,60 50,75 25,60 25,40" stroke="#F472A8" strokeWidth="4" />
              <circle cx="50" cy="50" r="7" fill="#8B5CF6" />
            </svg>
          </div>
          <div className="navbar-title">
            <h1>OreVision AI</h1>
            <span>Satellite Manganese Exploration</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="navbar-status">
            <div className={`status-dot ${healthStatus}`} />
            <span id="health-status-text">
              {healthStatus === 'checking' ? 'Connecting…' :
               healthStatus === 'ok' ?
                 (health?.credentials_configured ? 'Copernicus CDSE Live' : (health?.demo_mode ? 'Demo Mode Active' : 'No CDSE Keys')) :
               'Backend Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* ── Tab Nav (with Mobile Drawer Support) ── */}
      <nav className={`tab-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id)
              setMobileMenuOpen(false)
            }}
            id={`tab-${tab.id}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main className="main-content">
        {/* Credentials / Demo Mode Notice */}
        {healthStatus === 'ok' && health && !health.credentials_configured && activeTab !== 'home' && (
          health.demo_mode ? (
            <div className="alert alert-info" style={{ marginBottom: '1.2rem', borderLeft: '4px solid var(--color-permanganate)' }}>
              <span className="alert-icon">✨</span>
              <div>
                <strong>Simulation Demo Mode Active:</strong> Live Copernicus credentials are not configured in <code>backend/.env</code>.
                Simulated multispectral Sentinel-2 data and geological responses are active for interactive exploration.
              </div>
            </div>
          ) : (
            <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>
              <span className="alert-icon">🔑</span>
              <div>
                <strong>Copernicus Credentials Not Configured:</strong> Set <code>SH_CLIENT_ID</code> and <code>SH_CLIENT_SECRET</code> in <code>backend/.env</code>.
              </div>
            </div>
          )
        )}

        {/* Home / Futuristic Hero Landing */}
        {activeTab === 'home' && (
          <LandingPage
            onLaunchExploration={() => setActiveTab('prospectivity')}
            onViewSatelliteData={() => setActiveTab('explorer')}
            onOpenIndiaAtlas={() => setActiveTab('india-atlas')}
          />
        )}

        {/* India National Mineral Intelligence Atlas (Dedicated Page) */}
        {activeTab === 'india-atlas' && (
          <IndiaAtlas
            onSelectAOI={setSharedBbox}
            onNavigateTab={setActiveTab}
            onStatusMessage={addToast}
          />
        )}

        {/* Live Satellite Explorer */}
        {activeTab === 'explorer' && (
          <SatelliteExplorer
            bbox={sharedBbox}
            onBBoxChange={setSharedBbox}
            onNavigateTab={setActiveTab}
            onStatusMessage={addToast}
          />
        )}

        {/* AI/ML Manganese Prospectivity */}
        {activeTab === 'prospectivity' && (
          <ManganeseProspectivity
            initialBbox={sharedBbox}
            onStatusMessage={addToast}
          />
        )}

        {/* Multi-Date Surface Disturbance / Change Detection */}
        {activeTab === 'change' && (
          <ChangeDetection
            initialBbox={sharedBbox}
            onStatusMessage={addToast}
          />
        )}

        {/* Technical Reports & Audit */}
        {activeTab === 'reports' && (
          <Reports
            onStatusMessage={addToast}
          />
        )}
      </main>

      {/* ── Status Bar ── */}
      <footer className="status-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>🛰️ Copernicus Data Space Ecosystem · Sentinel-2 L2A & Sentinel-1 SAR</span>
        </div>
        <div>
          <span>Pilot Area: Keonjhar–Sundargarh, Odisha · Positive-Unlabeled (PU) Machine Learning Active</span>
        </div>
        <div>
          <span style={{ color: 'var(--color-permanganate)' }}>
            {systemTime}
          </span>
        </div>
      </footer>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
