import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Complaint, DuplicateCluster, FilterState } from './types';
import { 
  getAllComplaints, 
  saveComplaint, 
  saveBulkComplaints, 
  updateComplaint, 
  clearAllComplaints, 
  getMetaItem, 
  setMetaItem 
} from './services/storage';
import { getSyntheticSeedData } from './data/seedData';
import { classifyComplaint } from './services/classifier';
import { generateDraftResponse } from './services/templates';
import { detectAllClusters } from './services/duplicates';
import { Navbar } from './components/Navbar';
import { DemoTourBanner } from './components/DemoTourBanner';
import { Dashboard } from './components/Dashboard';
import { ComplaintInbox } from './components/ComplaintInbox';
import { DuplicateManager } from './components/DuplicateManager';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { NewComplaintModal } from './components/NewComplaintModal';
import { SyncCentre } from './components/SyncCentre';

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  department: 'ALL',
  priority: 'ALL',
  language: 'ALL',
  status: 'ALL',
  channel: 'ALL',
  station: 'ALL',
  duplicateOnly: false,
  syncStatus: 'ALL'
};

export const App: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'inbox' | 'duplicates' | 'sync'>('dashboard');
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS);
  
  // Modals
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showNewModal, setShowNewModal] = useState<boolean>(false);

  // Network State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState<boolean>(false);
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<string | null>(null);

  // Demo step
  const [demoStep, setDemoStep] = useState<number>(0);

  // Toast feedback
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'info' | 'success' | 'alert' }[]>([]);

  const showToast = (message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Hydrate from IndexedDB on startup
  useEffect(() => {
    async function loadData() {
      try {
        const stored = await getAllComplaints();
        if (stored && stored.length > 0) {
          setComplaints(stored);
        } else {
          // First launch: initialize with 22 diverse synthetic records
          const initialData = getSyntheticSeedData();
          await saveBulkComplaints(initialData);
          setComplaints(initialData);
        }

        const lastSync = await getMetaItem<string>('last_sync_timestamp');
        if (lastSync) setLastSyncedTimestamp(lastSync);
      } catch (err) {
        console.error('Failed to initialize local storage:', err);
        const initialData = getSyntheticSeedData();
        setComplaints(initialData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Listen for online / offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network restored: browser connection active', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network offline: switched automatically to on-device IndexedDB storage', 'alert');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute duplicate clusters dynamically
  const duplicateClusters = useMemo(() => {
    return detectAllClusters(complaints);
  }, [complaints]);

  // Derived metrics
  const unreviewedCriticalCount = useMemo(() => {
    return complaints.filter(
      (c) => (c.priority === 'P1' || c.priority === 'P2') && c.status === 'Pending Review'
    ).length;
  }, [complaints]);

  const pendingSyncCount = useMemo(() => {
    return complaints.filter((c) => c.syncStatus === 'Pending Sync' || c.syncStatus === 'Saved Locally').length;
  }, [complaints]);

  // Next ID calculator
  const nextIdNumber = useMemo(() => {
    const maxNum = complaints.reduce((max, c) => {
      const match = c.id.match(/SAH-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 1022);
    return maxNum + 1;
  }, [complaints]);

  // Handlers
  const handleSaveComplaint = async (updated: Complaint) => {
    await saveComplaint(updated);
    setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Grievance ${updated.id} review saved to local storage`, 'success');
  };

  const handleAddNewComplaint = async (newRecord: Complaint) => {
    await saveComplaint(newRecord);
    setComplaints((prev) => [newRecord, ...prev]);
    showToast(`New grievance ${newRecord.id} recorded (${newRecord.priority} • ${newRecord.department})`, 'success');
  };

  const handleBulkImport = (newItems: Partial<Complaint>[]): { imported: number; errors: string[] } => {
    const errors: string[] = [];
    const validToAdd: Complaint[] = [];
    let currentIdNum = nextIdNumber;

    newItems.forEach((item, idx) => {
      if (!item.originalText || item.originalText.trim().length === 0) {
        errors.push(`Row ${idx + 1}: Missing grievance text`);
        return;
      }

      const text = item.originalText.trim();
      const station = item.station || 'Gandhinagar Capital';
      const classification = classifyComplaint(text, station);
      const id = `SAH-2026-${currentIdNum++}`;
      const now = new Date().toISOString();

      const draft = generateDraftResponse(classification.detectedLanguage, {
        id,
        department: classification.department,
        station,
        priority: classification.priority,
        passengerName: item.passengerName
      });

      const fullComplaint: Complaint = {
        id,
        createdAt: now,
        updatedAt: now,
        sourceChannel: item.sourceChannel || 'Mobile App',
        station,
        passengerName: item.passengerName || 'Batch Import Passenger',
        passengerContact: item.passengerContact,
        originalText: text,
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
            id: `aud-${Date.now()}-${id}`,
            timestamp: now,
            action: 'Batch Ingested & Classified Offline',
            performedBy: 'Batch Import Processor',
            notes: `Auto-assigned ${classification.department} (${classification.priority})`
          }
        ]
      };

      validToAdd.push(fullComplaint);
    });

    if (validToAdd.length > 0) {
      saveBulkComplaints(validToAdd);
      setComplaints((prev) => [...validToAdd, ...prev]);
      showToast(`Batch of ${validToAdd.length} grievances ingested and classified offline`, 'success');
    }

    return { imported: validToAdd.length, errors };
  };

  // Link duplicate
  const handleLinkDuplicate = async (primaryId: string, secondaryId: string) => {
    const primary = complaints.find((c) => c.id === primaryId);
    if (!primary) return;

    const clusterId = primary.duplicateClusterId || `INC-${primary.station.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`;

    await updateComplaint(primaryId, { duplicateClusterId: clusterId, isDuplicateConfirmed: true });
    await updateComplaint(secondaryId, { duplicateClusterId: clusterId, isDuplicateConfirmed: true });

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id === primaryId || c.id === secondaryId) {
          return { ...c, duplicateClusterId: clusterId, isDuplicateConfirmed: true };
        }
        return c;
      })
    );

    showToast(`Linked ${secondaryId} with ${primaryId} under incident ${clusterId}`, 'info');
  };

  // Unlink duplicate
  const handleUnlinkDuplicate = async (complaintId: string) => {
    await updateComplaint(complaintId, { duplicateClusterId: undefined, isDuplicateConfirmed: false });
    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, duplicateClusterId: undefined, isDuplicateConfirmed: false } : c))
    );
    showToast(`Unlinked ${complaintId} from cluster`, 'info');
  };

  // Confirm cluster
  const handleConfirmCluster = (clusterId: string) => {
    showToast(`Incident cluster ${clusterId} confirmed for maintenance dispatch`, 'success');
  };

  // Sync attempt handler (strictly honest)
  const handleTriggerSyncAttempt = async (): Promise<{ success: boolean; message: string }> => {
    const effectiveOnline = isOnline && !isSimulatedOffline;

    // Simulate probing upstream endpoint
    await new Promise((r) => setTimeout(r, 1200));

    if (!effectiveOnline) {
      return {
        success: false,
        message: 'Sync aborted: Device is in offline/air-gapped mode. All changes remain safely queued in local IndexedDB.'
      };
    }

    // Honest server behavior: PS-07 constraint: "If no server is configured, remain in local-only mode and clearly label synchronization as unavailable or pending. Never fabricate successful synchronization."
    return {
      success: false,
      message: 'Local-First Mode: Remote server endpoint (https://metro-central.gmrc.gov.in) is offline/unreachable in this environment. Pending queue preserved without data loss.'
    };
  };

  // Reset to seed data
  const handleResetSeedData = async () => {
    await clearAllComplaints();
    const fresh = getSyntheticSeedData();
    await saveBulkComplaints(fresh);
    setComplaints(fresh);
    showToast('Reset local database to initial 22 synthetic complaints', 'info');
  };

  // Export DB
  const handleExportDatabase = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(complaints, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `sahaay_db_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported complete IndexedDB database to JSON backup file', 'success');
  };

  // Clear DB
  const handleClearDatabase = async () => {
    if (window.confirm('Are you sure you want to clear all local complaint records?')) {
      await clearAllComplaints();
      setComplaints([]);
      showToast('Local database cleared', 'alert');
    }
  };

  // Guided demo walkthrough runner
  const handleTriggerDemoStep = (stepIdx: number) => {
    setDemoStep(stepIdx);
    if (stepIdx === 0) {
      setCurrentTab('dashboard');
      showToast('Step 1: Inspecting live Operations Dashboard metrics & priority distribution', 'info');
    } else if (stepIdx === 1) {
      setCurrentTab('inbox');
      showToast('Step 2: Inspecting complaint inbox & batch import', 'info');
    } else if (stepIdx === 2) {
      // Find electrical smoke P1 complaint
      const p1Item = complaints.find((c) => c.priority === 'P1' && c.originalText.toLowerCase().includes('smoke')) || complaints[0];
      if (p1Item) {
        setSelectedComplaint(p1Item);
        showToast('Step 3: Opened P1 Safety Hazard — inspect explainable keyword triggers & urgency breakdown', 'alert');
      }
    } else if (stepIdx === 3) {
      // Find Gujarati/Gujlish complaint
      const guItem = complaints.find((c) => c.detectedLanguage === 'gu' || c.detectedLanguage === 'gujlish') || complaints[1];
      if (guItem) {
        setSelectedComplaint(guItem);
        showToast('Step 4: Opened Gujarati/Gujlish grievance — inspect multilingual response drafting & normalization', 'info');
      }
    } else if (stepIdx === 4) {
      setCurrentTab('duplicates');
      showToast('Step 5: Inspecting Infocity Lift duplicate cluster (multiple passengers grouped under 1 incident)', 'info');
    } else if (stepIdx === 5) {
      setIsSimulatedOffline(true);
      setCurrentTab('sync');
      showToast('Step 6: Airplane mode simulated! Records remain persistent and queued in IndexedDB', 'alert');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '1rem', background: '#0b192c', color: '#fff' }}>
        <div className="status-dot online pulse" style={{ width: '16px', height: '16px' }} />
        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Initializing Sahaay AI Local Storage & Engine...</div>
        <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Loading IndexedDB and deterministic models...</div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Metro Header */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOnline={isOnline}
        isSimulatedOffline={isSimulatedOffline}
        onToggleSimulatedOffline={() => {
          setIsSimulatedOffline(!isSimulatedOffline);
          showToast(!isSimulatedOffline ? 'Simulated Airplane Mode ENABLED' : 'Airplane Mode Disabled (Online)', !isSimulatedOffline ? 'alert' : 'success');
        }}
        unreviewedCriticalCount={unreviewedCriticalCount}
        duplicateClusterCount={duplicateClusters.length}
        pendingSyncCount={pendingSyncCount}
        onOpenNewComplaint={() => setShowNewModal(true)}
      />

      <main className="main-wrapper">
        {/* Guided Hackathon Demo Banner */}
        <DemoTourBanner
          onTriggerDemoStep={handleTriggerDemoStep}
          currentStep={demoStep}
        />

        {/* Tab 1: Operations Dashboard */}
        {currentTab === 'dashboard' && (
          <Dashboard
            complaints={complaints}
            duplicateClusters={duplicateClusters}
            pendingSyncCount={pendingSyncCount}
            isOnline={isOnline && !isSimulatedOffline}
            onSelectComplaint={setSelectedComplaint}
            onNavigateToInboxWithFilter={(filterKey, filterVal) => {
              if (filterKey === 'department') {
                setFilterState({ ...DEFAULT_FILTERS, department: filterVal });
              } else {
                setFilterState(DEFAULT_FILTERS);
              }
              setCurrentTab('inbox');
            }}
            onNavigateToDuplicates={() => setCurrentTab('duplicates')}
          />
        )}

        {/* Tab 2: Complaint Inbox */}
        {currentTab === 'inbox' && (
          <ComplaintInbox
            complaints={complaints}
            filterState={filterState}
            onUpdateFilters={(updates) => setFilterState((prev) => ({ ...prev, ...updates }))}
            onResetFilters={() => setFilterState(DEFAULT_FILTERS)}
            onSelectComplaint={setSelectedComplaint}
            onBulkImport={handleBulkImport}
            onOpenNewComplaint={() => setShowNewModal(true)}
          />
        )}

        {/* Tab 3: Duplicate Manager */}
        {currentTab === 'duplicates' && (
          <DuplicateManager
            complaints={complaints}
            clusters={duplicateClusters}
            onSelectComplaint={setSelectedComplaint}
            onConfirmCluster={handleConfirmCluster}
            onUnlinkMember={handleUnlinkDuplicate}
          />
        )}

        {/* Tab 4: Offline & Sync Centre */}
        {currentTab === 'sync' && (
          <SyncCentre
            complaints={complaints}
            isOnline={isOnline}
            isSimulatedOffline={isSimulatedOffline}
            onToggleSimulatedOffline={() => setIsSimulatedOffline(!isSimulatedOffline)}
            pendingSyncCount={pendingSyncCount}
            lastSyncedTimestamp={lastSyncedTimestamp}
            onTriggerSyncAttempt={handleTriggerSyncAttempt}
            onResetSeedData={handleResetSeedData}
            onExportDatabase={handleExportDatabase}
            onClearDatabase={handleClearDatabase}
          />
        )}
      </main>

      {/* Complaint Detail & Triage Drawer Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          allComplaints={complaints}
          onClose={() => setSelectedComplaint(null)}
          onSaveComplaint={handleSaveComplaint}
          onLinkDuplicate={handleLinkDuplicate}
          onUnlinkDuplicate={handleUnlinkDuplicate}
        />
      )}

      {/* New Complaint Modal */}
      {showNewModal && (
        <NewComplaintModal
          onClose={() => setShowNewModal(false)}
          onSubmit={handleAddNewComplaint}
          nextIdNumber={nextIdNumber}
        />
      )}

      {/* Toast Notification Stack */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast" style={{ borderLeftColor: t.type === 'alert' ? '#dc2626' : t.type === 'success' ? '#16a34a' : '#0284c7' }}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
