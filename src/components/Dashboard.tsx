import React from 'react';
import { Complaint, DuplicateCluster } from '../types';
import { 
  AlertTriangle, 
  Inbox, 
  Copy, 
  CloudOff, 
  ShieldAlert, 
  Clock, 
  ChevronRight, 
  Wrench, 
  TrendingUp, 
  MapPin
} from 'lucide-react';

interface DashboardProps {
  complaints: Complaint[];
  duplicateClusters: DuplicateCluster[];
  pendingSyncCount: number;
  isOnline: boolean;
  onSelectComplaint: (complaint: Complaint) => void;
  onNavigateToInboxWithFilter: (filterKey: string, filterVal: string) => void;
  onNavigateToDuplicates: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  complaints,
  duplicateClusters,
  pendingSyncCount,
  isOnline,
  onSelectComplaint,
  onNavigateToInboxWithFilter,
  onNavigateToDuplicates
}) => {
  const totalCount = complaints.length;
  
  const p1Count = complaints.filter((c) => c.priority === 'P1').length;
  const p2Count = complaints.filter((c) => c.priority === 'P2').length;
  const p3Count = complaints.filter((c) => c.priority === 'P3').length;
  const p4Count = complaints.filter((c) => c.priority === 'P4').length;

  const unreviewedCritical = complaints.filter(
    (c) => (c.priority === 'P1' || c.priority === 'P2') && c.status === 'Pending Review'
  );

  const duplicateLinkedCount = complaints.filter((c) => c.duplicateClusterId).length;

  const deptCounts: { [key: string]: number } = {
    'Safety': complaints.filter((c) => c.department === 'Safety').length,
    'Lifts & Escalators': complaints.filter((c) => c.department === 'Lifts & Escalators').length,
    'Fare & Ticketing': complaints.filter((c) => c.department === 'Fare & Ticketing').length,
    'Cleanliness': complaints.filter((c) => c.department === 'Cleanliness').length,
    'Staff Behaviour': complaints.filter((c) => c.department === 'Staff Behaviour').length,
    'General Feedback / Other': complaints.filter((c) => c.department === 'General Feedback / Other').length
  };

  const langCounts = {
    en: complaints.filter((c) => c.detectedLanguage === 'en').length,
    gu: complaints.filter((c) => c.detectedLanguage === 'gu').length,
    hi: complaints.filter((c) => c.detectedLanguage === 'hi').length,
    gujlish: complaints.filter((c) => c.detectedLanguage === 'gujlish').length
  };

  const recentComplaints = [...complaints]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const criticalComplaints = complaints
    .filter((c) => c.priority === 'P1')
    .slice(0, 3);

  return (
    <div>
      {/* 4 Top Stat Cards */}
      <div className="stats-grid">
        {/* Total Complaints */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span>Total Complaints</span>
              <div className="stat-card-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <Inbox size={18} />
              </div>
            </div>
            <div className="stat-card-value">{totalCount}</div>
          </div>
          <div className="stat-card-sub">
            <span>Saved in local IndexedDB storage</span>
          </div>
        </div>

        {/* Unreviewed Critical */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span style={{ color: '#b91c1c' }}>Unreviewed Critical</span>
              <div className="stat-card-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="stat-card-value" style={{ color: '#b91c1c' }}>
              {unreviewedCritical.length}
            </div>
          </div>
          <div className="stat-card-sub" style={{ color: '#b91c1c' }}>
            <span>{p1Count} urgent safety hazards flagged</span>
          </div>
        </div>

        {/* Duplicate Clusters */}
        <div 
          className="stat-card" 
          style={{ cursor: 'pointer' }}
          onClick={onNavigateToDuplicates}
        >
          <div>
            <div className="stat-card-header">
              <span>Duplicate Groups</span>
              <div className="stat-card-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                <Copy size={18} />
              </div>
            </div>
            <div className="stat-card-value">{duplicateClusters.length}</div>
          </div>
          <div className="stat-card-sub">
            <span>{duplicateLinkedCount} complaints linked together</span>
          </div>
        </div>

        {/* Pending Sync */}
        <div className="stat-card">
          <div>
            <div className="stat-card-header">
              <span>Pending Sync</span>
              <div className="stat-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <CloudOff size={18} />
              </div>
            </div>
            <div className="stat-card-value">{pendingSyncCount}</div>
          </div>
          <div className="stat-card-sub">
            <span>{isOnline ? 'Ready for server sync' : 'Operating in offline mode'}</span>
          </div>
        </div>
      </div>

      {/* Critical Immediate Action Bar */}
      {criticalComplaints.length > 0 && (
        <div className="content-card" style={{ borderColor: '#fca5a5' }}>
          <div className="card-header" style={{ background: '#fef2f2' }}>
            <div className="card-title" style={{ color: '#991b1b' }}>
              <ShieldAlert size={18} color="#dc2626" />
              <span>Safety Critical Complaints (P1) — Operator Review Required</span>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}>
              {criticalComplaints.length} Immediate Safety Alerts
            </span>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
              {criticalComplaints.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                  onClick={() => onSelectComplaint(item)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#991b1b', fontFamily: 'monospace' }}>
                      {item.id}
                    </span>
                    <span className="badge-priority badge-p1">P1 Critical</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.5rem', fontWeight: 500, lineHeight: 1.4 }}>
                    "{item.originalText}"
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={12} /> {item.station}
                    </span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                      Urgency: {item.urgencyScore}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Priority & Department Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        {/* Priority Breakdown */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="#2563eb" />
                <span>Priority Breakdown</span>
              </div>
              <div className="card-subtitle">
                Automatic urgency score based on safety and passenger impact
              </div>
            </div>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* P1 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#b91c1c' }}>P1 — Immediate Safety Critical</span>
                  <span>{p1Count} ({totalCount ? Math.round((p1Count / totalCount) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '7px', background: '#fee2e2', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalCount ? (p1Count / totalCount) * 100 : 0}%`, background: '#dc2626', height: '100%' }} />
                </div>
              </div>

              {/* P2 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#c2410c' }}>P2 — High Operational Impact / Lifts</span>
                  <span>{p2Count} ({totalCount ? Math.round((p2Count / totalCount) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '7px', background: '#ffedd5', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalCount ? (p2Count / totalCount) * 100 : 0}%`, background: '#ea580c', height: '100%' }} />
                </div>
              </div>

              {/* P3 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#1d4ed8' }}>P3 — Routine Complaint</span>
                  <span>{p3Count} ({totalCount ? Math.round((p3Count / totalCount) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '7px', background: '#eff6ff', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalCount ? (p3Count / totalCount) * 100 : 0}%`, background: '#2563eb', height: '100%' }} />
                </div>
              </div>

              {/* P4 */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  <span style={{ color: '#15803d' }}>P4 — General Suggestion / Feedback</span>
                  <span>{p4Count} ({totalCount ? Math.round((p4Count / totalCount) * 100) : 0}%)</span>
                </div>
                <div style={{ height: '7px', background: '#f0fdf4', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: `${totalCount ? (p4Count / totalCount) * 100 : 0}%`, background: '#16a34a', height: '100%' }} />
                </div>
              </div>
            </div>

            {/* Languages */}
            <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.5rem' }}>
                Languages Detected:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge-lang gu">Gujarati: {langCounts.gu}</span>
                <span className="badge-lang gujlish">Gujlish: {langCounts.gujlish}</span>
                <span className="badge-lang hi">Hindi: {langCounts.hi}</span>
                <span className="badge-lang en">English: {langCounts.en}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Department Queues */}
        <div className="content-card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <Wrench size={18} color="#2563eb" />
                <span>Department Queues</span>
              </div>
              <div className="card-subtitle">
                Click a department to filter complaints inbox
              </div>
            </div>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(deptCounts).map(([dept, count]) => (
                <div 
                  key={dept}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigateToInboxWithFilter('department', dept)}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>{dept}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      background: '#e2e8f0',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      color: '#0f172a'
                    }}>
                      {count}
                    </span>
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="content-card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Clock size={18} color="#2563eb" />
              <span>Recent Complaints</span>
            </div>
            <div className="card-subtitle">
              Chronological passenger complaint stream
            </div>
          </div>
          <button 
            className="btn-secondary"
            onClick={() => onNavigateToInboxWithFilter('all', '')}
          >
            <span>View All ({totalCount})</span>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="table-container">
          <table className="metro-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Station</th>
                <th>Channel</th>
                <th>Language</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Complaint Summary</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.map((comp) => (
                <tr 
                  key={comp.id} 
                  className={comp.priority === 'P1' ? 'row-p1' : ''}
                  onClick={() => onSelectComplaint(comp)}
                >
                  <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                    {comp.id}
                  </td>
                  <td style={{ fontWeight: 500 }}>{comp.station}</td>
                  <td>
                    <span style={{ fontSize: '0.785rem', color: '#64748b' }}>{comp.sourceChannel}</span>
                  </td>
                  <td>
                    <span className={`badge-lang ${comp.detectedLanguage}`}>
                      {comp.detectedLanguage.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className="badge-department">{comp.department}</span>
                  </td>
                  <td>
                    <span className={`badge-priority badge-${comp.priority.toLowerCase()}`}>
                      {comp.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-status ${comp.status.toLowerCase().replace(/\s+/g, '')}`}>
                      {comp.status}
                    </span>
                  </td>
                  <td>
                    <div className="complaint-text-preview">
                      {comp.originalText}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
