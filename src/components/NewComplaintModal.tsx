import React, { useState, useEffect } from 'react';
import { Complaint, Channel } from '../types';
import { classifyComplaint } from '../services/classifier';
import { generateDraftResponse } from '../services/templates';
import { X, Plus, AlertTriangle, Sparkles } from 'lucide-react';

interface NewComplaintModalProps {
  onClose: () => void;
  onSubmit: (newComplaint: Complaint) => void;
  nextIdNumber: number;
}

const STATIONS = [
  'Gandhinagar Capital',
  'Infocity',
  'Motera Stadium',
  'Old High Court',
  'Sector 10',
  'APMC',
  'GIFT City',
  'Sabarmati',
  'Mahatma Mandir'
];

const CHANNELS: Channel[] = [
  'Mobile App',
  'Twitter / X',
  'Email',
  'Paper Form',
  'WhatsApp / SMS'
];

export const NewComplaintModal: React.FC<NewComplaintModalProps> = ({
  onClose,
  onSubmit,
  nextIdNumber
}) => {
  const [text, setText] = useState('');
  const [station, setStation] = useState('Gandhinagar Capital');
  const [channel, setChannel] = useState<Channel>('Mobile App');
  const [passengerName, setPassengerName] = useState('');
  const [passengerContact, setPassengerContact] = useState('');

  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    if (text.trim().length >= 3) {
      const result = classifyComplaint(text, station);
      setPreview(result);
    } else {
      setPreview(null);
    }
  }, [text, station]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const classification = classifyComplaint(text, station);
    const complaintId = `SAH-2026-${nextIdNumber}`;
    const now = new Date().toISOString();

    const draft = generateDraftResponse(classification.detectedLanguage, {
      id: complaintId,
      department: classification.department,
      station,
      priority: classification.priority,
      passengerName: passengerName || undefined
    });

    const newRecord: Complaint = {
      id: complaintId,
      createdAt: now,
      updatedAt: now,
      sourceChannel: channel,
      station,
      passengerName: passengerName || 'Anonymous Passenger',
      passengerContact: passengerContact || undefined,
      originalText: text.trim(),
      detectedLanguage: classification.detectedLanguage,
      normalizedText: classification.normalizedText,
      department: classification.department,
      priority: classification.priority,
      urgencyScore: classification.urgencyScore,
      classificationExplanation: classification.explanation,
      suggestedResponse: draft.response,
      responseLanguage: draft.responseLanguage,
      isResponseApproved: false,
      status: 'Pending Review',
      syncStatus: 'Saved Locally',
      auditTrail: [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          action: 'Complaint Created & Classified Offline',
          performedBy: 'Station Controller Form Entry',
          notes: `Deterministic score: ${classification.urgencyScore} (${classification.priority})`
        }
      ]
    };

    onSubmit(newRecord);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '680px' }}>
        <div className="modal-header">
          <div className="card-title">
            <Plus size={18} color="#2563eb" />
            <span>Log New Complaint</span>
          </div>
          <button onClick={onClose} style={{ color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Station and Channel row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Metro Station:
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={station}
                  onChange={(e) => setStation(e.target.value)}
                >
                  {STATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Source Channel:
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passenger details row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Passenger Name (Optional):
                </label>
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. Rahul Mehta"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                  Contact (Optional):
                </label>
                <input
                  type="text"
                  className="search-input"
                  placeholder="e.g. +91 98765 43210"
                  value={passengerContact}
                  onChange={(e) => setPassengerContact(e.target.value)}
                />
              </div>
            </div>

            {/* Original Complaint Textarea */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Complaint Text (Gujarati, Hindi, English, or Gujlish): *
              </label>
              <textarea
                style={{
                  width: '100%',
                  height: '110px',
                  padding: '0.75rem',
                  fontSize: '0.875rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  outline: 'none'
                }}
                placeholder="Enter complaint text as received..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                required
              />
            </div>

            {/* Real-time Preview */}
            {preview && (
              <div style={{ padding: '0.85rem', background: preview.priority === 'P1' ? '#fef2f2' : '#f0f9ff', border: `1px solid ${preview.priority === 'P1' ? '#fecaca' : '#bae6fd'}`, borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.825rem', color: preview.priority === 'P1' ? '#b91c1c' : '#0369a1' }}>
                    <Sparkles size={15} />
                    <span>Real-Time Classification Preview:</span>
                  </div>
                  <span className={`badge-priority badge-${preview.priority.toLowerCase()}`}>
                    {preview.priority}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span>Department: <strong>{preview.department}</strong></span>
                  <span>• Language: <strong className={`badge-lang ${preview.detectedLanguage}`}>{preview.detectedLanguage.toUpperCase()}</strong></span>
                  <span>• Urgency: <strong>{preview.urgencyScore} / 100</strong></span>
                </div>

                {preview.explanation.safetyOverride && (
                  <div style={{ marginTop: '0.4rem', color: '#b91c1c', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <AlertTriangle size={13} />
                    <span>Safety hazard detected — will be flagged as P1 for review.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!text.trim()}>
              <Plus size={15} />
              <span>Save Complaint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
