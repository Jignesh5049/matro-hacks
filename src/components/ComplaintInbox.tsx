import React, { useState, useMemo } from 'react';
import { Complaint, FilterState } from '../types';
import { 
  Search, 
  Upload, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react';

interface ComplaintInboxProps {
  complaints: Complaint[];
  filterState: FilterState;
  onUpdateFilters: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSelectComplaint: (complaint: Complaint) => void;
  onBulkImport: (newComplaints: Partial<Complaint>[]) => { imported: number; errors: string[] };
  onOpenNewComplaint: () => void;
}

export const ComplaintInbox: React.FC<ComplaintInboxProps> = ({
  complaints,
  filterState,
  onUpdateFilters,
  onResetFilters,
  onSelectComplaint,
  onBulkImport,
  onOpenNewComplaint
}) => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Search
      if (filterState.searchQuery) {
        const q = filterState.searchQuery.toLowerCase();
        const matchesQuery =
          item.id.toLowerCase().includes(q) ||
          item.originalText.toLowerCase().includes(q) ||
          item.station.toLowerCase().includes(q) ||
          (item.passengerName && item.passengerName.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Priority
      if (filterState.priority && filterState.priority !== 'ALL') {
        if (item.priority !== filterState.priority) return false;
      }

      // Department
      if (filterState.department && filterState.department !== 'ALL') {
        if (item.department !== filterState.department) return false;
      }

      // Language
      if (filterState.language && filterState.language !== 'ALL') {
        if (item.detectedLanguage !== filterState.language) return false;
      }

      // Status
      if (filterState.status && filterState.status !== 'ALL') {
        if (item.status !== filterState.status) return false;
      }

      // Channel
      if (filterState.channel && filterState.channel !== 'ALL') {
        if (item.sourceChannel !== filterState.channel) return false;
      }

      // Duplicate Only
      if (filterState.duplicateOnly) {
        if (!item.duplicateClusterId && (!item.suggestedDuplicateIds || item.suggestedDuplicateIds.length === 0)) {
          return false;
        }
      }

      return true;
    });
  }, [complaints, filterState]);

  // Handle CSV/JSON import
  const handleProcessImport = () => {
    if (!importText.trim()) return;

    let itemsToProcess: any[] = [];
    const parseErrors: string[] = [];

    // Try parsing as JSON first
    if (importText.trim().startsWith('[') || importText.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(importText);
        itemsToProcess = Array.isArray(parsed) ? parsed : [parsed];
      } catch (err: any) {
        parseErrors.push(`JSON parsing error: ${err.message}`);
      }
    } else {
      // Parse as CSV
      const lines = importText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0].toLowerCase();
        const startIndex = firstLine.includes('text') || firstLine.includes('complaint') ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i];
          const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((p) => p.replace(/^"|"$/g, '').trim());
          if (parts.length >= 1 && parts[0]) {
            itemsToProcess.push({
              originalText: parts[0],
              station: parts[1] || 'Gandhinagar Capital',
              sourceChannel: parts[2] || 'Mobile App',
              passengerName: parts[3] || 'Anonymous Passenger'
            });
          } else {
            parseErrors.push(`Row ${i + 1}: empty or invalid format`);
          }
        }
      }
    }

    if (itemsToProcess.length === 0 && parseErrors.length > 0) {
      setImportResult({ imported: 0, errors: parseErrors });
      return;
    }

    const res = onBulkImport(itemsToProcess);
    const combinedErrors = [...parseErrors, ...res.errors];
    setImportResult({ imported: res.imported, errors: combinedErrors });

    if (res.imported > 0) {
      setTimeout(() => {
        if (combinedErrors.length === 0) {
          setShowImportModal(false);
          setImportResult(null);
          setImportText('');
        }
      }, 1800);
    }
  };

  const sampleBatchCSV = `originalText,station,sourceChannel,passengerName
"There is electrical smoke coming from breaker box in station basement",Motera Stadium,Mobile App,Kunal Joshi
"Station ni lift bandh chhe, wheelchair access nathi malto",Infocity,WhatsApp / SMS,Ghanshyam Patel
"પ્લેટફોર્મ પર પાણીની બોટલો અને કચરો ફેલાયેલો છે",Sector 10,Twitter / X,Rani Mukherjee
"Card tap kariyu pan gate open na thayu ane 20 rupiya cut thai gaya",Old High Court,Mobile App,Meet Vaghela
"Customer care assistant at token counter was very rude and aggressive",APMC,Paper Form,Sarla Ben
"Invalid record missing text",,Email,Test`;

  const handleExportCSV = () => {
    const headers = ['ID,Station,Channel,Language,Department,Priority,Status,OriginalText,SyncStatus'];
    const rows = filteredComplaints.map((c) => 
      `"${c.id}","${c.station}","${c.sourceChannel}","${c.detectedLanguage}","${c.department}","${c.priority}","${c.status}","${c.originalText.replace(/"/g, '""')}","${c.syncStatus}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sahaay_complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {/* Top Filter and Actions Bar */}
      <div className="content-card">
        <div className="filter-bar">
          {/* Search Box */}
          <div className="search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search grievances, IDs, stations, keywords..."
              value={filterState.searchQuery}
              onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="filter-group">
            {/* Priority Filter */}
            <select
              className="filter-select"
              value={filterState.priority}
              onChange={(e) => onUpdateFilters({ priority: e.target.value })}
            >
              <option value="ALL">All Priorities</option>
              <option value="P1">P1 — Critical Safety</option>
              <option value="P2">P2 — High Impact</option>
              <option value="P3">P3 — Routine</option>
              <option value="P4">P4 — Non-Urgent</option>
            </select>

            {/* Department Filter */}
            <select
              className="filter-select"
              value={filterState.department}
              onChange={(e) => onUpdateFilters({ department: e.target.value })}
            >
              <option value="ALL">All Departments</option>
              <option value="Safety">Safety</option>
              <option value="Lifts & Escalators">Lifts & Escalators</option>
              <option value="Fare & Ticketing">Fare & Ticketing</option>
              <option value="Cleanliness">Cleanliness</option>
              <option value="Staff Behaviour">Staff Behaviour</option>
              <option value="General Feedback / Other">General Feedback</option>
            </select>

            {/* Language Filter */}
            <select
              className="filter-select"
              value={filterState.language}
              onChange={(e) => onUpdateFilters({ language: e.target.value })}
            >
              <option value="ALL">All Languages</option>
              <option value="gu">Gujarati (ગુજરાતી)</option>
              <option value="gujlish">Gujlish (Mixed)</option>
              <option value="hi">Hindi (हिंदी)</option>
              <option value="en">English</option>
            </select>

            {/* Status Filter */}
            <select
              className="filter-select"
              value={filterState.status}
              onChange={(e) => onUpdateFilters({ status: e.target.value })}
            >
              <option value="ALL">All Review Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Duplicate Filter Toggle */}
            <button
              className={`btn-secondary ${filterState.duplicateOnly ? 'active' : ''}`}
              style={{
                backgroundColor: filterState.duplicateOnly ? 'rgba(251, 146, 60, 0.2)' : undefined,
                borderColor: filterState.duplicateOnly ? 'rgba(251, 146, 60, 0.5)' : undefined,
                color: filterState.duplicateOnly ? '#fdba74' : undefined
              }}
              onClick={() => onUpdateFilters({ duplicateOnly: !filterState.duplicateOnly })}
            >
              <Copy size={14} />
              <span>{filterState.duplicateOnly ? 'Showing Duplicates' : 'Filter Duplicates'}</span>
            </button>

            {/* Reset Filters */}
            <button className="btn-secondary" onClick={onResetFilters} title="Reset all filters">
              <RefreshCw size={14} />
              <span>Reset</span>
            </button>
          </div>

          {/* Action Buttons: Import / Export */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn-secondary" onClick={() => setShowImportModal(true)}>
              <Upload size={14} />
              <span>Bulk Import Batch</span>
            </button>

            <button className="btn-secondary" onClick={handleExportCSV} title="Export CSV for Operations Field Crew">
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Results Count Banner */}
        <div style={{ padding: '0.65rem 1.5rem', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border-dim)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.785rem', color: 'var(--text-dim)' }}>
          <span>
            Showing <strong style={{ color: '#fff' }}>{filteredComplaints.length}</strong> of <strong style={{ color: '#fff' }}>{complaints.length}</strong> passenger complaints
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--cyan-neon)' }}>
            ⚡ Click any row to inspect explainability trace, edit multilingual draft, or manage duplicate linking
          </span>
        </div>

        {/* Complaints Table */}
        <div className="table-container">
          <table className="metro-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Language</th>
                <th>Station</th>
                <th>Original Grievance</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Sync</th>
                <th>Duplicates</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-dim)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
                      <AlertCircle size={36} color="var(--text-dim)" />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>No complaints match the selected filter criteria</span>
                      <button className="btn-secondary" onClick={onResetFilters} style={{ marginTop: '0.5rem' }}>
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr
                    key={c.id}
                    className={c.priority === 'P1' ? 'row-p1' : ''}
                    onClick={() => onSelectComplaint(c)}
                  >
                    <td style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--cyan-neon)' }}>
                      {c.id}
                    </td>

                    <td>
                      <span className={`badge-priority badge-${c.priority.toLowerCase()}`}>
                        {c.priority}
                        {c.priority === 'P1' && ' ⚠️'}
                      </span>
                    </td>

                    <td>
                      <span className="badge-department">
                        {c.department}
                      </span>
                    </td>

                    <td>
                      <span className={`badge-lang ${c.detectedLanguage}`}>
                        {c.detectedLanguage.toUpperCase()}
                      </span>
                    </td>

                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>
                      {c.station}
                    </td>

                    <td>
                      <div className="complaint-text-preview" title={c.originalText}>
                        {c.originalText}
                      </div>
                    </td>

                    <td style={{ fontSize: '0.785rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {c.sourceChannel}
                    </td>

                    <td>
                      <span className={`badge-status ${c.status.toLowerCase().replace(/\s+/g, '')}`}>
                        {c.status}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      <span style={{
                        color: c.syncStatus === 'Synced' ? '#34d399' : c.syncStatus === 'Pending Sync' ? '#fbbf24' : '#94a3b8',
                        fontWeight: 700
                      }}>
                        {c.syncStatus === 'Synced' ? '● Synced' : c.syncStatus === 'Pending Sync' ? '⏳ Queued' : '💾 Local'}
                      </span>
                    </td>

                    <td>
                      {c.duplicateClusterId ? (
                        <span className="duplicate-flag" title={`Linked to duplicate group: ${c.duplicateClusterId}`}>
                          <Copy size={11} />
                          <span>Linked</span>
                        </span>
                      ) : (c.suggestedDuplicateIds && c.suggestedDuplicateIds.length > 0) ? (
                        <span className="duplicate-flag" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                          <Copy size={11} />
                          <span>Match</span>
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <div className="card-title">
                <Upload size={18} color="var(--cyan-neon)" />
                <span>Bulk Import Mixed-Language Grievance Batch</span>
              </div>
              <button onClick={() => setShowImportModal(false)}>
                <X size={20} color="var(--text-dim)" />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                Paste CSV or JSON records below. The on-device deterministic engine will automatically detect languages,
                classify departments, compute urgency scores (with P1 safety overrides), and draft responses in complainant languages.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }}
                  onClick={() => setImportText(sampleBatchCSV)}
                >
                  Load Sample Mixed-Language CSV Batch
                </button>
              </div>

              <textarea
                style={{
                  width: '100%',
                  height: '220px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.825rem',
                  padding: '1rem',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  background: 'rgba(5, 8, 17, 0.85)',
                  color: '#f8fafc',
                  outline: 'none'
                }}
                placeholder="originalText,station,sourceChannel,passengerName&#10;or [ { originalText: '...', station: '...' } ]"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
              />

              {/* Validation & Error reporting */}
              {importResult && (
                <div style={{ marginTop: '1rem', padding: '0.85rem', borderRadius: '8px', background: importResult.errors.length > 0 ? 'rgba(255, 51, 75, 0.15)' : 'rgba(16, 185, 129, 0.15)', border: `1px solid ${importResult.errors.length > 0 ? 'rgba(255, 51, 75, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: importResult.errors.length > 0 ? 'var(--p1-red)' : '#34d399' }}>
                    {importResult.imported > 0 ? `✓ Successfully ingested and classified ${importResult.imported} complaint(s) offline!` : 'Import Failed'}
                  </div>
                  {importResult.errors.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.785rem', color: '#fca5a5' }}>
                      <div style={{ fontWeight: 700 }}>Validation warnings (valid rows preserved):</div>
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem' }}>
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleProcessImport}>
                <CheckCircle size={15} />
                <span>Process & Ingest Batch Offline</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
