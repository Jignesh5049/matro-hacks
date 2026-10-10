import { Complaint, DuplicateCluster } from '../types';

function tokenize(text: string): Set<string> {
  const clean = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(clean);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

// Cross-lingual canonical keys to detect multilingual duplicate concepts
const CANONICAL_CONCEPTS: { [key: string]: string[] } = {
  lift_broken: ['lift', 'લિફ્ટ', 'लिफ्ट', 'elevator', 'bandh', 'stuck', 'fasaya', 'broken', 'અટકી'],
  electrical_smoke: ['smoke', 'fire', 'spark', 'ધૂમાડો', 'ધુમાડો', 'ચિંગારી', 'ચિંગારી', 'wire', 'વાયર', 'કરંટ'],
  fare_charged_twice: ['charged twice', 'double charge', 'બે વાર', 'દો બાર', 'paisa kapaya', 'કપાઈ ગયા', 'પૈસા'],
  water_logging: ['water', 'paani', 'પાણી', 'पानी', 'leakage', 'લીકેજ', 'puddle']
};

export interface DuplicateMatchDetail {
  candidateId: string;
  similarityScore: number;
  reasons: string[];
}

export function findDuplicatesForComplaint(
  target: Complaint,
  allComplaints: Complaint[]
): DuplicateMatchDetail[] {
  const matches: DuplicateMatchDetail[] = [];
  const targetTokens = tokenize(target.originalText);
  const targetLower = target.originalText.toLowerCase();

  for (const candidate of allComplaints) {
    if (candidate.id === target.id) continue;

    const reasons: string[] = [];
    let score = 0;

    // 1. Same station match (strong indicator)
    const isSameStation =
      target.station &&
      candidate.station &&
      target.station.toLowerCase().trim() === candidate.station.toLowerCase().trim();

    if (isSameStation) {
      score += 35;
      reasons.push(`Identical station location: ${target.station}`);
    }

    // 2. Same department
    if (target.department === candidate.department) {
      score += 25;
      reasons.push(`Same department queue: ${target.department}`);
    }

    // 3. Jaccard token overlap
    const candidateTokens = tokenize(candidate.originalText);
    const textSim = jaccardSimilarity(targetTokens, candidateTokens);
    if (textSim > 0.15) {
      score += Math.round(textSim * 50);
      reasons.push(`Text token overlap (${Math.round(textSim * 100)}%)`);
    }

    // 4. Cross-lingual concept detection
    const candidateLower = candidate.originalText.toLowerCase();
    for (const [concept, keywords] of Object.entries(CANONICAL_CONCEPTS)) {
      const targetHas = keywords.some((kw) => targetLower.includes(kw));
      const candHas = keywords.some((kw) => candidateLower.includes(kw));
      if (targetHas && candHas) {
        score += 30;
        reasons.push(`Cross-lingual common issue pattern: "${concept.replace('_', ' ')}"`);
        break;
      }
    }

    // 5. Time proximity: within 48 hours
    const targetTime = new Date(target.createdAt).getTime();
    const candTime = new Date(candidate.createdAt).getTime();
    const hoursDiff = Math.abs(targetTime - candTime) / (1000 * 60 * 60);
    if (hoursDiff <= 48) {
      score += 15;
      reasons.push(`Reported in same operational window (~${Math.round(hoursDiff)} hrs apart)`);
    }

    // Normalized score cap at 100
    const finalScore = Math.min(100, score);

    // If score passes threshold (>= 60)
    if (finalScore >= 60) {
      matches.push({
        candidateId: candidate.id,
        similarityScore: finalScore,
        reasons
      });
    }
  }

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

export function detectAllClusters(complaints: Complaint[]): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const processed = new Set<string>();

  for (const c of complaints) {
    if (processed.has(c.id)) continue;

    // Find duplicates
    const dupes = findDuplicatesForComplaint(c, complaints);
    if (dupes.length > 0) {
      const clusterIds = [c.id, ...dupes.map((d) => d.candidateId)];
      clusterIds.forEach((id) => processed.add(id));

      clusters.push({
        clusterId: `INC-${c.station.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-4)}`,
        primaryComplaintId: c.id,
        memberIds: clusterIds,
        station: c.station,
        department: c.department,
        commonTopic: `${c.department} issue reported by ${clusterIds.length} passengers at ${c.station}`,
        createdAt: c.createdAt,
        confirmed: false
      });
    }
  }

  return clusters;
}
