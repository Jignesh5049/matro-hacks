import React from 'react';
import { Complaint, DuplicateCluster } from '../types';
import { Copy, Unlink, AlertCircle, CheckCircle, ChevronRight, MapPin } from 'lucide-react';

interface DuplicateManagerProps {
  complaints: Complaint[];
  clusters: DuplicateCluster[];
  onSelectComplaint: (complaint: Complaint) => void;
  onConfirmCluster: (clusterId: string) => void;
  onUnlinkMember: (complaintId: string) => void;
}

export const DuplicateManager: React.FC<DuplicateManagerProps> = ({
  complaints,
  clusters,
  onSelectComplaint,
  onConfirmCluster,
  onUnlinkMember
}) => {
  const complaintsMap = new Map<string, Complaint>();
  complaints.forEach((c) => complaintsMap.set(c.id, c));

  return (
    <div>
      <div className="content-card">
        <div className="card-header">
          <div>
            <div className="card-title">
              <Copy size={18} color="#ea580c" />
              <span>Duplicate Complaint Groups</span>
            </div>
            <div className="card-subtitle">
              Complaints grouped by common issue, station location, and timing
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c2410c', background: '#ffedd5', padding: '0.25rem 0.65rem', borderRadius: '4px' }}>
            {clusters.length} Groups Found
          </span>
        </div>

        <div style={{ padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem' }}>
            When an incident occurs (such as a broken elevator or ticket machine issue), passengers report it in different languages (English, Gujarati, Gujlish).
            Sahaay AI groups them under one work item to save staff time while <strong>keeping every passenger's record and contact info safe</strong>.
          </p>

          {clusters.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
              <AlertCircle size={32} color="#cbd5e1" style={{ margin: '0 auto 0.5rem' }} />
              <div style={{ fontWeight: 600, color: '#0f172a' }}>No duplicate groups found</div>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>All complaints represent separate issues.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {clusters.map((cluster) => {
                const members = cluster.memberIds
                  .map((id) => complaintsMap.get(id))
                  .filter(Boolean) as Complaint[];

                return (
                  <div
                    key={cluster.clusterId}
                    style={{
                      background: '#fffaf5',
                      border: '1px solid #fed7aa',
                      borderRadius: '10px',
                      padding: '1.25rem'
                    }}
                  >
                    {/* Cluster Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #ffedd5', paddingBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#c2410c', fontFamily: 'monospace' }}>
                            {cluster.clusterId}
                          </span>
                          <span className="badge-department">{cluster.department}</span>
                          <span style={{ fontSize: '0.75rem', background: '#ea580c', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '999px', fontWeight: 700 }}>
                            {members.length} Reports Linked
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                          📍 {cluster.station} — {cluster.commonTopic}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-primary"
                          style={{ background: '#ea580c', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                          onClick={() => onConfirmCluster(cluster.clusterId)}
                        >
                          <CheckCircle size={14} />
                          <span>{cluster.confirmed ? 'Group Confirmed ✓' : 'Confirm Group'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Member Complaints List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#c2410c' }}>
                        Passenger Reports:
                      </span>
                      {members.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            padding: '0.75rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            cursor: 'pointer'
                          }}
                          onClick={() => onSelectComplaint(m)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: '#0f172a' }}>
                              {m.id}
                            </span>
                            <span className={`badge-priority badge-${m.priority.toLowerCase()}`}>
                              {m.priority}
                            </span>
                            <span className={`badge-lang ${m.detectedLanguage}`}>
                              {m.detectedLanguage.toUpperCase()}
                            </span>
                            <div style={{ fontSize: '0.825rem', color: '#1e293b', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              "{m.originalText}"
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {m.sourceChannel}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                            <button
                              className="btn-secondary"
                              style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', color: '#b91c1c' }}
                              onClick={() => onUnlinkMember(m.id)}
                              title="Unlink this complaint"
                            >
                              <Unlink size={12} />
                              <span>Unlink</span>
                            </button>
                            <ChevronRight size={14} color="#94a3b8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
