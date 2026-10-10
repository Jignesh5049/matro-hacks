import React from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Inbox, 
  Copy, 
  Plus, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'dashboard' | 'inbox' | 'duplicates' | 'sync';
  onSelectTab: (tab: 'dashboard' | 'inbox' | 'duplicates' | 'sync') => void;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  unreviewedCriticalCount: number;
  duplicateClusterCount: number;
  pendingSyncCount: number;
  onOpenNewComplaint: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  unreviewedCriticalCount,
  duplicateClusterCount,
  pendingSyncCount,
  onOpenNewComplaint
}) => {
  const effectiveOnline = isOnline && !isSimulatedOffline;

  return (
    <header className="metro-navbar">
      <div className="navbar-inner">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="brand-badge">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="brand-title">
              Sahaay AI
              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>
                • Metro Operations
              </span>
            </div>
            <div className="brand-sub">
              Offline-First Passenger Grievance System (PS-07)
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button 
            className={`nav-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-btn ${currentTab === 'inbox' ? 'active' : ''}`}
            onClick={() => onSelectTab('inbox')}
          >
            <Inbox size={15} />
            <span>Complaints</span>
            {unreviewedCriticalCount > 0 && (
              <span style={{
                background: '#dc2626',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                marginLeft: '0.2rem'
              }}>
                {unreviewedCriticalCount}
              </span>
            )}
          </button>

          <button 
            className={`nav-btn ${currentTab === 'duplicates' ? 'active' : ''}`}
            onClick={() => onSelectTab('duplicates')}
          >
            <Copy size={15} />
            <span>Duplicates</span>
            {duplicateClusterCount > 0 && (
              <span style={{
                background: '#ea580c',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                marginLeft: '0.2rem'
              }}>
                {duplicateClusterCount}
              </span>
            )}
          </button>

          <button 
            className={`nav-btn ${currentTab === 'sync' ? 'active' : ''}`}
            onClick={() => onSelectTab('sync')}
          >
            <RefreshCw size={15} />
            <span>Offline & Sync</span>
            {pendingSyncCount > 0 && (
              <span style={{
                background: '#f59e0b',
                color: '#000',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                marginLeft: '0.2rem'
              }}>
                {pendingSyncCount}
              </span>
            )}
          </button>
        </nav>

        {/* Controls and Status */}
        <div className="nav-actions">
          {/* Offline Toggle */}
          <button 
            className={`btn-sim-offline ${isSimulatedOffline ? 'active' : ''}`}
            onClick={onToggleSimulatedOffline}
            title="Toggle airplane mode simulator to prove 100% on-device offline workflow"
          >
            {effectiveOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{isSimulatedOffline ? 'Airplane Mode: ON' : 'Test Offline Mode'}</span>
          </button>

          {/* Network Pill */}
          <div className={`status-pill ${effectiveOnline ? 'status-online' : 'status-offline'}`}>
            <span className={`status-dot ${effectiveOnline ? 'online' : 'offline'}`} />
            <span>{effectiveOnline ? 'Online' : 'Offline (Local)'}</span>
          </div>

          {/* New Complaint Button */}
          <button className="btn-primary" onClick={onOpenNewComplaint}>
            <Plus size={15} />
            <span>New Complaint</span>
          </button>
        </div>
      </div>
    </header>
  );
};
