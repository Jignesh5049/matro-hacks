export type Department = 
  | 'Safety'
  | 'Cleanliness'
  | 'Fare & Ticketing'
  | 'Lifts & Escalators'
  | 'Staff Behaviour'
  | 'General Feedback / Other';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export type Language = 'en' | 'hi' | 'gu' | 'gujlish' | 'unknown';

export type Channel = 'Mobile App' | 'Twitter / X' | 'Email' | 'Paper Form' | 'WhatsApp / SMS';

export type ComplaintStatus = 
  | 'Pending Review'
  | 'Approved'
  | 'Assigned to Field'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type SyncStatus = 'Saved Locally' | 'Pending Sync' | 'Synced' | 'Sync Failed';

export interface UrgencyExplanation {
  baseScore: number;
  safetyOverride: boolean;
  triggers: string[];
  reasons: string[];
  factorBreakdown: {
    safetyRisk: number;
    accessibilityImpact: number;
    passengerDisruption: number;
    publicHazard: number;
  };
}

export interface ClassificationResult {
  department: Department;
  confidence: number;
  detectedLanguage: Language;
  normalizedText?: string;
  departmentTriggers: string[];
  priority: Priority;
  urgencyScore: number;
  explanation: UrgencyExplanation;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  notes?: string;
}

export interface Complaint {
  id: string; // e.g. SAH-2026-1001
  createdAt: string;
  updatedAt: string;
  sourceChannel: Channel;
  station: string;
  specificLocation?: string;
  passengerName?: string;
  passengerContact?: string;
  
  // Content
  originalText: string;
  detectedLanguage: Language;
  normalizedText?: string;
  
  // Classification & Urgency
  department: Department;
  priority: Priority;
  urgencyScore: number;
  classificationExplanation: UrgencyExplanation;
  isManuallyOverridden?: boolean;
  
  // Response Draft
  suggestedResponse: string;
  responseLanguage: Language;
  editedResponse?: string;
  isResponseApproved: boolean;
  responseApprovedAt?: string;
  
  // Triage & Workflow
  status: ComplaintStatus;
  assignedUnit?: string;
  reviewerNotes?: string;
  auditTrail: AuditLogEntry[];
  
  // Duplicate Intelligence
  duplicateClusterId?: string; // ID of duplicate group if linked
  isDuplicateConfirmed?: boolean;
  suggestedDuplicateIds?: string[];
  duplicateReason?: string;
  
  // Offline & Sync
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
  syncAttempts?: number;
  syncError?: string;
  isSynthetic?: boolean;
}

export interface DuplicateCluster {
  clusterId: string;
  primaryComplaintId: string;
  memberIds: string[];
  station: string;
  department: Department;
  commonTopic: string;
  createdAt: string;
  confirmed: boolean;
}

export interface FilterState {
  searchQuery: string;
  department: string;
  priority: string;
  language: string;
  status: string;
  channel: string;
  station: string;
  duplicateOnly: boolean;
  syncStatus: string;
}
