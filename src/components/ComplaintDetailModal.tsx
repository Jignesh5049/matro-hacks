import React, { useState } from 'react';
import { Complaint, Department, Priority, Language, ComplaintStatus } from '../types';
import { generateDraftResponse } from '../services/templates';
import { 
  X, 
  Send, 
  Clock, 
  Copy, 
  User, 
  HelpCircle, 
  History, 
  Check, 
  Link, 
  Unlink,
  MessageSquare
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: Complaint;
  allComplaints: Complaint[];
  onClose: () => void;
  onSaveComplaint: (updated: Complaint) => void;
  onLinkDuplicate: (primaryId: string, secondaryId: string) => void;
  onUnlinkDuplicate: (complaintId: string) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  allComplaints,
  onClose,
  onSaveComplaint,
  onLinkDuplicate,
  onUnlinkDuplicate
}) => {
  const [activeTab, setActiveTab] = useState<'triage' | 'response' | 'duplicates' | 'history'>('triage');

  // Form state
  const [department, setDepartment] = useState<Department>(complaint.department);
  const [priority, setPriority] = useState<Priority>(complaint.priority);
  const [status, setStatus] = useState<ComplaintStatus>(complaint.status);
  const [assignedUnit, setAssignedUnit] = useState<string>(complaint.assignedUnit || '');
  const [reviewerNotes, setReviewerNotes] = useState<string>(complaint.reviewerNotes || '');

  // Response draft state
  const [responseLanguage, setResponseLanguage] = useState<Language>(complaint.responseLanguage);
  const [responseText, setResponseText] = useState<string>(
    complaint.editedResponse || complaint.suggestedResponse
  );
  const [isApproved, setIsApproved] = useState<boolean>(complaint.isResponseApproved);

  const handleLanguageChange = (newLang: Language) => {
    setResponseLanguage(newLang);
    const draft = generateDraftResponse(newLang, {
      id: complaint.id,
      department,
      station: complaint.station,
      priority,
      passengerName: complaint.passengerName
    });
    setResponseText(draft.response);
  };

  const handleSave = () => {
    const isOverride = department !== complaint.department || priority !== complaint.priority;

    const newAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: isApproved !== complaint.isResponseApproved && isApproved ? 'Response Approved for Passenger' : 'Complaint Triage Updated',
      performedBy: 'Station Controller (Human Operator)',
      notes: reviewerNotes || (isOverride ? `Manual override: ${department} (${priority})` : 'Status updated')
    };

    const updated: Complaint = {
      ...complaint,
      department,
      priority,
      status,
      assignedUnit: assignedUnit || undefined,
      reviewerNotes,
      responseLanguage,
      editedResponse: responseText,
      isResponseApproved: isApproved,
      responseApprovedAt: isApproved ? new Date().toISOString() : undefined,
      isManuallyOverridden: isOverride || complaint.isManuallyOverridden,
      auditTrail: [newAuditEntry, ...complaint.auditTrail]
    };

    onSaveComplaint(updated);
    onClose();
  };

  const candidateDuplicates = allComplaints.filter(
    (c) =>
      c.id !== complaint.id &&
      (c.station.toLowerCase() === complaint.station.toLowerCase() ||
        c.duplicateClusterId === complaint.duplicateClusterId)
  );

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {complaint.id}
            </span>
            <span className={`badge-priority badge-${priority.toLowerCase()}`}>
              {priority}
            </span>
            <span className="badge-department">{department}</span>
            <span className={`badge-status ${status.toLowerCase().replace(/\s+/g, '')}`}>{status}</span>
          </div>

          <button onClick={onClose} style={{ color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ padding: '0.75rem 1.5rem 0', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          <div className="tab-pills" style={{ marginBottom: 0 }}>
            <button
              className={`tab-pill ${activeTab === 'triage' ? 'active' : ''}`}
              onClick={() => setActiveTab('triage')}
            >
              1. Triage & Explanation
            </button>
            <button
              className={`tab-pill ${activeTab === 'response' ? 'active' : ''}`}
              onClick={() => setActiveTab('response')}
            >
              2. Reply Draft ({responseLanguage.toUpperCase()})
            </button>
            <button
              className={`tab-pill ${activeTab === 'duplicates' ? 'active' : ''}`}
              onClick={() => setActiveTab('duplicates')}
            >
              3. Related Reports ({candidateDuplicates.length})
            </button>
            <button
              className={`tab-pill ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              4. History ({complaint.auditTrail.length})
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* TAB 1: TRIAGE */}
          {activeTab === 'triage' && (
            <div className="detail-grid">
              {/* Left Column: Original Complaint & Reasoning */}
              <div>
                <div className="detail-section-box">
                  <div className="detail-label">
                    <MessageSquare size={14} color="#2563eb" />
                    <span>Original Passenger Complaint</span>
                  </div>
                  <div className="original-quote-box">
                    "{complaint.originalText}"
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>Language: <strong className={`badge-lang ${complaint.detectedLanguage}`}>{complaint.detectedLanguage.toUpperCase()}</strong></span>
                    <span>• Channel: <strong>{complaint.sourceChannel}</strong></span>
                    <span>• Passenger: <strong>{complaint.passengerName || 'Anonymous'}</strong></span>
                  </div>

                  {complaint.normalizedText && (
                    <div style={{ marginTop: '0.65rem', padding: '0.5rem 0.75rem', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.8rem', color: '#92400e' }}>
                      <strong>{complaint.normalizedText}</strong>
                    </div>
                  )}
                </div>

                {/* Explainability Reasoning */}
                <div className="detail-section-box">
                  <div className="detail-label">
                    <HelpCircle size={14} color="#2563eb" />
                    <span>Why This Priority Was Assigned</span>
                  </div>

                  <div className="explainability-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        Urgency Score: <strong>{complaint.urgencyScore} / 100</strong>
                      </span>
                      {complaint.classificationExplanation.safetyOverride && (
                        <span style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 700 }}>
                          Safety Risk Flagged
                        </span>
                      )}
                    </div>

                    <ul style={{ paddingLeft: '1.25rem', color: '#334155', fontSize: '0.825rem', marginBottom: '0.75rem' }}>
                      {complaint.classificationExplanation.reasons.map((r, i) => (
                        <li key={i} style={{ marginBottom: '0.2rem' }}>{r}</li>
                      ))}
                    </ul>

                    {complaint.classificationExplanation.triggers.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Matched Keywords: </span>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {complaint.classificationExplanation.triggers.map((t, idx) => (
                            <span key={idx} style={{ background: '#f1f5f9', color: '#334155', padding: '0.1rem 0.45rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 600 }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="factor-bar-wrapper">
                      <div className="factor-bar-row">
                        <span>Safety Risk</span>
                        <span>{complaint.classificationExplanation.factorBreakdown.safetyRisk} / 40</span>
                      </div>
                      <div className="factor-bar">
                        <div className="factor-fill" style={{ width: `${(complaint.classificationExplanation.factorBreakdown.safetyRisk / 40) * 100}%`, background: '#dc2626' }} />
                      </div>

                      <div className="factor-bar-row">
                        <span>Accessibility (Lifts/Escalators)</span>
                        <span>{complaint.classificationExplanation.factorBreakdown.accessibilityImpact} / 30</span>
                      </div>
                      <div className="factor-bar">
                        <div className="factor-fill" style={{ width: `${(complaint.classificationExplanation.factorBreakdown.accessibilityImpact / 30) * 100}%`, background: '#ea580c' }} />
                      </div>

                      <div className="factor-bar-row">
                        <span>Passenger Impact / Gates</span>
                        <span>{complaint.classificationExplanation.factorBreakdown.passengerDisruption} / 20</span>
                      </div>
                      <div className="factor-bar">
                        <div className="factor-fill" style={{ width: `${(complaint.classificationExplanation.factorBreakdown.passengerDisruption / 20) * 100}%`, background: '#2563eb' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Operator Controls */}
              <div>
                <div className="detail-section-box">
                  <div className="detail-label">
                    <User size={14} color="#2563eb" />
                    <span>Station Controller Review</span>
                  </div>

                  {/* Priority Select */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                      Priority:
                    </label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                    >
                      <option value="P1">P1 — Critical Safety Hazard</option>
                      <option value="P2">P2 — High Impact (Lifts/Escalators)</option>
                      <option value="P3">P3 — Routine Service Complaint</option>
                      <option value="P4">P4 — Low Impact Feedback</option>
                    </select>
                  </div>

                  {/* Department Select */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                      Department Queue:
                    </label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as Department)}
                    >
                      <option value="Safety">Safety</option>
                      <option value="Lifts & Escalators">Lifts & Escalators</option>
                      <option value="Fare & Ticketing">Fare & Ticketing</option>
                      <option value="Cleanliness">Cleanliness</option>
                      <option value="Staff Behaviour">Staff Behaviour</option>
                      <option value="General Feedback / Other">General Feedback / Other</option>
                    </select>
                  </div>

                  {/* Status Select */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                      Complaint Status:
                    </label>
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                    >
                      <option value="Pending Review">Pending Review</option>
                      <option value="Approved">Approved</option>
                      <option value="In Progress">In Progress (Field Dispatched)</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Assigned Unit */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                      Assigned Field Crew:
                    </label>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="e.g. Station Electrical Team 1"
                      value={assignedUnit}
                      onChange={(e) => setAssignedUnit(e.target.value)}
                    />
                  </div>

                  {/* Operator Notes */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.785rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                      Controller Notes:
                    </label>
                    <textarea
                      style={{
                        width: '100%',
                        height: '70px',
                        fontSize: '0.825rem',
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        outline: 'none'
                      }}
                      placeholder="Verification notes or crew instructions..."
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ fontSize: '0.785rem', color: '#64748b', background: '#f1f5f9', padding: '0.65rem', borderRadius: '6px' }}>
                    <div>📍 Station: <strong>{complaint.station}</strong></div>
                    <div>🕒 Ingested: <strong>{new Date(complaint.createdAt).toLocaleTimeString()}</strong></div>
                    <div>💾 Storage: <strong>{complaint.syncStatus}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESPONSE DRAFT */}
          {activeTab === 'response' && (
            <div>
              <div className="detail-section-box">
                <div className="detail-label">
                  <Send size={14} color="#2563eb" />
                  <span>Multilingual Response Draft</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  Generated in the complainant's language. Operators must review and approve before sending.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#334155' }}>
                    Reply Language:
                  </span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className={`btn-secondary ${responseLanguage === 'gu' ? 'active' : ''}`}
                      style={{ backgroundColor: responseLanguage === 'gu' ? '#fef3c7' : '#ffffff' }}
                      onClick={() => handleLanguageChange('gu')}
                    >
                      ગુજરાતી (Gujarati)
                    </button>
                    <button
                      className={`btn-secondary ${responseLanguage === 'hi' ? 'active' : ''}`}
                      style={{ backgroundColor: responseLanguage === 'hi' ? '#ede9fe' : '#ffffff' }}
                      onClick={() => handleLanguageChange('hi')}
                    >
                      हिंदी (Hindi)
                    </button>
                    <button
                      className={`btn-secondary ${responseLanguage === 'en' ? 'active' : ''}`}
                      style={{ backgroundColor: responseLanguage === 'en' ? '#e0f2fe' : '#ffffff' }}
                      onClick={() => handleLanguageChange('en')}
                    >
                      English
                    </button>
                  </div>
                </div>

                <textarea
                  className="response-editor"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: isApproved ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isApproved ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="checkbox"
                      id="approveReplyCheck"
                      checked={isApproved}
                      onChange={(e) => setIsApproved(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="approveReplyCheck" style={{ fontSize: '0.85rem', fontWeight: 600, color: isApproved ? '#15803d' : '#334155', cursor: 'pointer' }}>
                      {isApproved ? '✓ Response Approved for Passenger Notification' : 'Authorize & Sign-off this Response Draft'}
                    </label>
                  </div>
                  {isApproved && (
                    <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
                      Ready for dispatch
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DUPLICATE REPORTS */}
          {activeTab === 'duplicates' && (
            <div>
              <div className="detail-section-box">
                <div className="detail-label">
                  <Copy size={14} color="#2563eb" />
                  <span>Related Reports at {complaint.station}</span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                  Linked complaints share the same issue, helping avoid duplicate field dispatches.
                </p>

                {candidateDuplicates.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                    No other reports found for this station.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {candidateDuplicates.map((cand) => {
                      const isLinked = cand.duplicateClusterId && cand.duplicateClusterId === complaint.duplicateClusterId;

                      return (
                        <div
                          key={cand.id}
                          style={{
                            background: isLinked ? '#fff7ed' : '#ffffff',
                            border: `1px solid ${isLinked ? '#fed7aa' : '#e2e8f0'}`,
                            borderRadius: '8px',
                            padding: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.825rem' }}>
                                {cand.id}
                              </span>
                              <span className={`badge-priority badge-${cand.priority.toLowerCase()}`}>
                                {cand.priority}
                              </span>
                              <span className="badge-department">{cand.department}</span>
                              <span className={`badge-lang ${cand.detectedLanguage}`}>{cand.detectedLanguage.toUpperCase()}</span>
                              {isLinked && (
                                <span style={{ background: '#ea580c', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                  LINKED
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.825rem', color: '#334155' }}>
                              "{cand.originalText}"
                            </div>
                          </div>

                          <div>
                            {isLinked ? (
                              <button
                                className="btn-secondary"
                                style={{ color: '#b91c1c', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                onClick={() => onUnlinkDuplicate(cand.id)}
                              >
                                <Unlink size={13} />
                                <span>Unlink</span>
                              </button>
                            ) : (
                              <button
                                className="btn-secondary"
                                style={{ color: '#c2410c', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                onClick={() => onLinkDuplicate(complaint.id, cand.id)}
                              >
                                <Link size={13} />
                                <span>Link</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HISTORY */}
          {activeTab === 'history' && (
            <div>
              <div className="detail-section-box">
                <div className="detail-label">
                  <History size={14} color="#2563eb" />
                  <span>Audit Trail</span>
                </div>

                <div className="timeline">
                  {complaint.auditTrail.map((entry) => (
                    <div key={entry.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{entry.action}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        By <strong>{entry.performedBy}</strong> • {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {entry.notes && (
                        <div style={{ marginTop: '0.25rem', color: '#475569', background: '#ffffff', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Check size={16} />
            <span>Save Triage Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
