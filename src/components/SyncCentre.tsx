import React, { useState } from 'react';
import { Complaint } from '../types';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  CloudOff, 
  RefreshCw, 
  AlertOctagon, 
  CheckCircle2, 
  Download, 
  Trash2, 
  RotateCcw,
  ShieldCheck,
  ServerOff
} from 'lucide-react';

interface SyncCentreProps {
  complaints: Complaint[];
  isOnline: boolean;
  isSimulatedOffline: boolean;
  onToggleSimulatedOffline: () => void;
  pendingSyncCount: number;
  lastSyncedTimestamp: string | null;
  onTriggerSyncAttempt: () => Promise<{ success: boolean; message: string }>;
  onResetSeedData: () => void;
  onExportDatabase: () => void;
  onClearDatabase: () => void;
}

export const SyncCentre: React.FC<SyncCentreProps> = ({
  complaints,
  isOnline,
  isSimulatedOffline,
  onToggleSimulatedOffline,
  pendingSyncCount,
  lastSyncedTimestamp,
  onTriggerSyncAttempt,
  onResetSeedData,
  onExportDatabase,
  onClearDatabase
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const effectiveOnline = isOnline && !isSimulatedOffline;

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await onTriggerSyncAttempt();
      setSyncFeedback(res);
    } finally {
      setIsSyncing(false);
    }
  };

  const pendingItems = complaints.filter(
    (c) => c.syncStatus === 'Pending Sync' || c.syncStatus === 'Saved Locally'
  );

  return (
    <div>
      {/* Top Status Cards */}
      <div className="stats-grid">
        {/* Network State */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span>Network Status</span>
              <div className="stat-card-icon" style={{ background: effectiveOnline ? '#f0fdf4' : '#fef2f2', color: effectiveOnline ? '#16a34a' : '#dc2626' }}>
                {effectiveOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
              </div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '1.5rem', color: effectiveOnline ? '#15803d' : '#b91c1c' }}>
              {effectiveOnline ? 'Online' : 'Offline Mode'}
            </div>
          </div>
          <div className="stat-card-sub" style={{ marginTop: '0.4rem' }}>
            <button
              className={`btn-sim-offline ${isSimulatedOffline ? 'active' : ''}`}
              onClick={onToggleSimulatedOffline}
            >
              {isSimulatedOffline ? 'Switch to Online Mode' : 'Simulate Offline (Airplane Mode)'}
            </button>
          </div>
        </div>

        {/* Local Storage */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span>Local Storage</span>
              <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Database size={18} />
              </div>
            </div>
            <div className="stat-card-value">{complaints.length} Records</div>
          </div>
          <div className="stat-card-sub">
            <span>Saved in browser IndexedDB</span>
          </div>
        </div>

        {/* Pending Sync */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span>Waiting for Sync</span>
              <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <CloudOff size={18} />
              </div>
            </div>
            <div className="stat-card-value">{pendingSyncCount}</div>
          </div>
          <div className="stat-card-sub">
            <span>{pendingSyncCount === 0 ? 'Everything saved locally' : 'Queued for next connection'}</span>
          </div>
        </div>

        {/* Last Confirmed Sync */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span>Last Server Sync</span>
              <div className="stat-card-icon" style={{ background: '#f1f5f9', color: '#64748b' }}>
                <ServerOff size={18} />
              </div>
            </div>
            <div className="stat-card-value" style={{ fontSize: '1.25rem', color: '#475569' }}>
              {lastSyncedTimestamp ? new Date(lastSyncedTimestamp).toLocaleTimeString() : 'None (Local Mode)'}
            </div>
          </div>
          <div className="stat-card-sub">
            <span>Independent of cloud</span>
          </div>
        </div>
      </div>

      {/* Sync Action */}
      <div className="content-card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <RefreshCw size={18} color="#2563eb" />
              <span>Server Synchronization</span>
            </div>
            <div className="card-subtitle">
              Complaints remain safely stored locally until confirmed by central metro server
            </div>
          </div>

          <button
            className="btn-primary"
            onClick={handleSyncClick}
            disabled={isSyncing}
          >
            <RefreshCw size={15} />
            <span>{isSyncing ? 'Checking Server...' : 'Sync With Server'}</span>
          </button>
        </div>

        <div style={{ padding: '1.25rem' }}>
          {/* Honest sync message */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
              <ShieldCheck size={16} color="#2563eb" />
              <span>Offline-First Reliability</span>
            </div>
            <p>
              When network connectivity drops in metro stations, station controllers can still log complaints, classify priorities, and review drafts without interruption.
              All data is stored securely on-device. When connection returns, records can be synced without data loss.
            </p>
          </div>

          {/* Sync Attempt Feedback */}
          {syncFeedback && (
            <div style={{ padding: '0.85rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', background: syncFeedback.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${syncFeedback.success ? '#bbf7d0' : '#fecaca'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', color: syncFeedback.success ? '#15803d' : '#b91c1c' }}>
                {syncFeedback.success ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
                <span>{syncFeedback.message}</span>
              </div>
            </div>
          )}

          {/* Pending Queue Table */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Queued Complaints ({pendingItems.length} records):
            </div>

            {pendingItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', background: '#f8fafc', borderRadius: '6px', color: '#64748b', fontSize: '0.825rem' }}>
                No pending changes. All records are saved in local storage.
              </div>
            ) : (
              <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="metro-table">
                  <thead>
                    <tr>
                      <th>Complaint ID</th>
                      <th>Station</th>
                      <th>Priority</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Sync State</th>
                      <th>Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.id}</td>
                        <td>{item.station}</td>
                        <td>
                          <span className={`badge-priority badge-${item.priority.toLowerCase()}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td><span className="badge-department">{item.department}</span></td>
                        <td>
                          <span className={`badge-status ${item.status.toLowerCase().replace(/\s+/g, '')}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706' }}>
                            {item.syncStatus}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {new Date(item.updatedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Controls */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title">
            <Database size={18} color="#2563eb" />
            <span>Data Management & Backup</span>
          </div>
        </div>
        <div style={{ padding: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={onExportDatabase}>
            <Download size={14} />
            <span>Export Database (JSON Backup)</span>
          </button>

          <button className="btn-secondary" onClick={onResetSeedData}>
            <RotateCcw size={14} />
            <span>Reset Demo Data (22 Complaints)</span>
          </button>

          <button className="btn-secondary" style={{ color: '#dc2626' }} onClick={onClearDatabase}>
            <Trash2 size={14} />
            <span>Clear Local Storage</span>
          </button>
        </div>
      </div>
    </div>
  );
};
