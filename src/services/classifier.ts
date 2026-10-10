import { ClassificationResult, Department, Language, Priority, UrgencyExplanation } from '../types';

// Multilingual dictionaries for Departments
interface KeywordRule {
  department: Department;
  keywords: {
    en: string[];
    hi: string[];
    gu: string[];
    gujlish: string[];
  };
  baseUrgency: number;
}

const DEPARTMENT_RULES: KeywordRule[] = [
  {
    department: 'Safety',
    keywords: {
      en: ['smoke', 'fire', 'spark', 'shock', 'electric', 'short circuit', 'wire', 'danger', 'hazard', 'blood', 'injury', 'fight', 'knife', 'emergency', 'fall', 'slip', 'stampede', 'crowd crush', 'collapsed', 'gas leak', 'smell of burning'],
      hi: ['धुआं', 'धुआँ', 'आग', 'चिंगारी', 'करंट', 'बिजली', 'शॉर्ट सर्किट', 'खतरा', 'खून', 'चोट', 'लड़ाई', 'झगड़ा', 'फिसल', 'गिर', 'भगदड़', 'आपातकाल', 'तार'],
      gu: ['ધુમાડો', 'આગ', 'તણખા', 'કરંટ', 'વીજળી', 'શોર્ટ સર્કિટ', 'જોખમ', 'લોહી', 'ઇજા', 'અકસ્માત', 'પડી ગયા', 'લપસી', 'વાયર', 'બળી ગયું'],
      gujlish: ['dhumado', 'aag', 'karnt', 'current', 'wire', 'chokhim', 'short circuit', 'padi gaya', 'danger', 'hazard', 'electric', 'lohi', 'tanka', 'chhelo']
    },
    baseUrgency: 85
  },
  {
    department: 'Lifts & Escalators',
    keywords: {
      en: ['lift', 'elevator', 'escalator', 'stairs', 'moving walkway', 'stuck', 'trapped in lift', 'jerk', 'not working', 'breakdown', 'wheelchair', 'ramp'],
      hi: ['लिफ्ट', 'एस्केलेटर', 'सीढ़ी', 'अटक', 'फंस', 'बंद है', 'काम नहीं कर रहा', 'व्हीलचेयर', 'झटका'],
      gu: ['લિફ્ટ', 'એસ્કેલેટર', 'પગથિયા', 'બંધ છે', 'કામ નથી કરતું', 'ફસાયા', 'વ્હીલચેર', 'બગડી ગઈ'],
      gujlish: ['lift', 'escalator', 'bandh', 'bandh chhe', 'chaltu nathi', 'stuck', 'fasaya', 'bagadi gai', 'wheelchair', 'pagathiya']
    },
    baseUrgency: 60
  },
  {
    department: 'Cleanliness',
    keywords: {
      en: ['clean', 'dirty', 'trash', 'garbage', 'dustbin', 'smell', 'stink', 'vomit', 'spit', 'pan masala', 'gutkha', 'water logging', 'puddle', 'leakage', 'toilet', 'washroom', 'urinal', 'mud'],
      hi: ['सफाई', 'गंदा', 'कचरा', 'कूड़ा', 'डस्टबिन', 'बदबू', 'उल्टी', 'थूक', 'गुटखा', 'पान', 'पानी जमा', 'कीचड़', 'शौचालय', 'टॉयलेट', 'लीकेज'],
      gu: ['સ્વચ્છતા', 'ગંદકી', 'કચરો', 'કચરાપેટી', 'દુર્ગંધ', 'વાસ', 'થૂંક', 'ગુટખા', 'પાણી ભરાયું', 'કીચડ', 'શૌચાલય', 'ટોયલેટ', 'લીકેજ'],
      gujlish: ['gandki', 'kachro', 'kachrapeti', 'durgandh', 'vaas', 'saaf nathi', 'paani bharayu', 'toilet', 'washroom', 'dirty', 'spit', 'dustbin']
    },
    baseUrgency: 35
  },
  {
    department: 'Fare & Ticketing',
    keywords: {
      en: ['ticket', 'fare', 'token', 'card', 'smart card', 'metro card', 'recharge', 'refund', 'charged twice', 'double charge', 'upi', 'qr code', 'payment failed', 'afc gate', 'turnstile', 'deducted', 'balance'],
      hi: ['टिकट', 'किराया', 'टोकन', 'कार्ड', 'स्मार्ट कार्ड', 'रिचार्ज', 'रिफंड', 'दो बार कट गए', 'पैसे कट गए', 'यूपीआई', 'क्यूआर', 'गेट नहीं खुला', 'बैलेंस'],
      gu: ['ટિકિટ', 'ભાડું', 'ટોકન', 'કાર્ડ', 'રિચાર્જ', 'રીફંડ', 'બે વાર કપાયા', 'પૈસા કપાઈ ગયા', 'પેમેન્ટ ફેલ', 'યુપીઆઈ', 'ક્યુઆર કોડ', 'ગેટ', 'બેલેન્સ'],
      gujlish: ['ticket', 'bhadu', 'token', 'card', 'recharge', 'refund', 'paisa kapaya', 'double cut', 'upi', 'qr code', 'payment fail', 'gate open nathi']
    },
    baseUrgency: 45
  },
  {
    department: 'Staff Behaviour',
    keywords: {
      en: ['staff', 'officer', 'guard', 'security', 'controller', 'rude', 'misbehaved', 'argument', 'bribe', 'unhelpful', 'arrogant', 'shouting', 'abuse', 'refused'],
      hi: ['कर्मचारी', 'गार्ड', 'सिक्योरिटी', 'अधिकारी', 'बदतमीज', 'दुर्व्यवहार', 'झगड़ा', 'चिल्लाया', 'मदद नहीं की', 'घमंडी', 'गाली', 'रिश्वत'],
      gu: ['સ્ટાફ', 'ગાર્ડ', 'સુરક્ષા', 'અધિકારી', 'તોછડું', 'દુર્વ્યવહાર', 'ઝઘડો', 'રાડારાડી', 'મદદ ના કરી', 'ગેરવર્તણૂક', 'અપમાન'],
      gujlish: ['staff', 'guard', 'security', 'officer', 'rude', 'tochdu', 'durvyavhar', 'shouted', 'madad nathi kari', 'jhagdo', 'badtamiz']
    },
    baseUrgency: 40
  },
  {
    department: 'General Feedback / Other',
    keywords: {
      en: ['frequency', 'schedule', 'timing', 'announcement', 'display', 'signage', 'app', 'ac cooling', 'temperature', 'suggestion', 'seat', 'coach', 'crowded', 'increase train'],
      hi: ['समय', 'शेड्यूल', 'समय सारणी', 'घोषणा', 'डिस्प्ले', 'साइन बोर्ड', 'ऐसी', 'ठंडक', 'सुझाव', 'सीट', 'भीड़', 'ट्रेन बढ़ाओ', 'फ्रीक्वेंसी'],
      gu: ['સમય', 'ટાઈમિંગ', 'શેડ્યૂલ', 'જાહેરાત', 'ડિસ્પ્લે', 'સૂચન', 'એસી', 'ઠંડક', 'બેઠક', 'ભીડ', 'ટ્રેન વધારો'],
      gujlish: ['timing', 'schedule', 'ferfar', 'suchan', 'ac bandh', 'crowd', 'train vadharo', 'seat', 'suggestion', 'frequency']
    },
    baseUrgency: 20
  }
];

// Safety-critical triggers that force P1 override
const SAFETY_OVERRIDE_KEYWORDS = [
  'smoke', 'fire', 'spark', 'electric shock', 'short circuit', 'wire sparking', 'gas leak', 'burning smell',
  'trapped in lift', 'lift free fall', 'escalator sudden stop fall', 'blood', 'head injury', 'stampede', 'collapsed',
  'धुआं', 'धुआँ', 'आग', 'चिंगारी', 'करंट', 'शॉर्ट सर्किट', 'तार से चिंगारी', 'लिफ्ट में फंसा', 'खून', 'सिर पर चोट', 'भगदड़',
  'ધુમાડો', 'આગ', 'તણખા', 'વીજળી કરંટ', 'શોર્ટ સર્કિટ', 'લિફ્ટમાં ફસાયેલા', 'લોહી', 'ઇજા', 'તણખા નીકળે છે',
  'dhumado', 'aag', 'chokhim', 'spark', 'electric wire', 'trapped'
];

export function detectLanguage(text: string): Language {
  if (!text || text.trim() === '') return 'unknown';

  const gujaratiRegex = /[\u0A80-\u0AFF]/;
  const hindiRegex = /[\u0900-\u097F]/;

  let gujaratiCount = 0;
  let hindiCount = 0;
  let latinCount = 0;

  for (const char of text) {
    if (gujaratiRegex.test(char)) gujaratiCount++;
    else if (hindiRegex.test(char)) hindiCount++;
    else if (/[a-zA-Z]/.test(char)) latinCount++;
  }

  const total = gujaratiCount + hindiCount + latinCount;
  if (total === 0) return 'unknown';

  if (gujaratiCount > total * 0.3) return 'gu';
  if (hindiCount > total * 0.3) return 'hi';

  if (latinCount > 0) {
    // Check for Gujlish markers
    const lower = text.toLowerCase();
    const gujlishMarkers = [
      ' chhe', ' nathi', ' bandh', ' che', ' kem ', ' su ', ' thayu', ' karyu',
      ' ma ', ' ni ', ' no ', ' na ', ' nu ', ' ane ', ' pan ', ' kaho',
      ' vadharo', ' aapo', ' aavjo', ' gayo', ' gai', ' gaya', ' thodu', ' bheed'
    ];

    const isGujlish = gujlishMarkers.some((marker) => lower.includes(marker));
    if (isGujlish) return 'gujlish';

    return 'en';
  }

  return 'en';
}

export function normalizeGujlish(text: string): string {
  // Helpful English translation hint for metro operators for Gujlish / Gujarati phrases
  const lower = text.toLowerCase();
  const translations: { match: RegExp; note: string }[] = [
    { match: /station ni lift bandh chhe/i, note: 'Station elevator is not working / shut down' },
    { match: /lift bandh chhe/i, note: 'Elevator is not functional' },
    { match: /paisa kapai gaya/i, note: 'Money deducted from bank / wallet' },
    { match: /payment fail/i, note: 'Payment failed at vending machine / AFC' },
    { match: /gandki/i, note: 'Cleanliness issue / dirty surroundings' },
    { match: /kachro/i, note: 'Garbage accumulation' },
    { match: /dhumado/i, note: 'Smoke observed' },
    { match: /aag/i, note: 'Fire danger reported' },
    { match: /madad nathi kari/i, note: 'Staff refused help' },
    { match: /train vadharo/i, note: 'Request to increase train frequency' }
  ];

  for (const t of translations) {
    if (t.match.test(lower)) {
      return `Operator Assist (Gujlish Normalized): ${t.note}`;
    }
  }

  return `Original Text Preserved (No destructive translation applied)`;
}

export function classifyComplaint(text: string, location?: string): ClassificationResult {
  const detectedLang = detectLanguage(text);
  const lower = text.toLowerCase();
  
  // Track department keyword hits
  const departmentScores: { department: Department; hits: string[]; score: number }[] = [];

  for (const rule of DEPARTMENT_RULES) {
    const hits: string[] = [];
    const keywords = [
      ...rule.keywords.en,
      ...rule.keywords.hi,
      ...rule.keywords.gu,
      ...rule.keywords.gujlish
    ];

    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        hits.push(kw);
      }
    }

    if (hits.length > 0) {
      departmentScores.push({
        department: rule.department,
        hits,
        score: rule.baseUrgency + hits.length * 10
      });
    }
  }

  // Sort department by highest match
  departmentScores.sort((a, b) => b.score - a.score);

  const selectedDepartment: Department = departmentScores.length > 0 
    ? departmentScores[0].department 
    : 'General Feedback / Other';

  const departmentTriggers = departmentScores.length > 0 ? departmentScores[0].hits : [];

  // Urgency Factors
  let safetyRisk = 0;
  let accessibilityImpact = 0;
  let passengerDisruption = 0;
  let publicHazard = 0;
  const reasons: string[] = [];
  const triggerWords: string[] = [];

  // Check safety override keywords
  let safetyOverride = false;
  for (const skw of SAFETY_OVERRIDE_KEYWORDS) {
    if (lower.includes(skw.toLowerCase())) {
      safetyOverride = true;
      triggerWords.push(skw);
    }
  }

  if (safetyOverride) {
    safetyRisk = 40;
    publicHazard = 20;
    reasons.push('Direct safety-critical hazard identified (Electrical / Smoke / Injury / Entrapment)');
  } else if (selectedDepartment === 'Safety') {
    safetyRisk = 25;
    reasons.push('Safety-related matter reported requiring inspection');
  }

  // Check accessibility impact (e.g. lift, escalator, elderly, wheelchair)
  if (
    selectedDepartment === 'Lifts & Escalators' ||
    lower.includes('lift') ||
    lower.includes('લિફ્ટ') ||
    lower.includes('लिफ्ट') ||
    lower.includes('wheelchair') ||
    lower.includes('elderly') ||
    lower.includes('વૃદ્ધ') ||
    lower.includes('बुजुर्ग')
  ) {
    accessibilityImpact = 25;
    reasons.push('Impacts station accessibility for passengers with reduced mobility or elderly');
  }

  // Check passenger disruption (e.g. AFC gates jammed, payment double charge, crowding)
  if (
    selectedDepartment === 'Fare & Ticketing' ||
    lower.includes('gate') ||
    lower.includes('rush') ||
    lower.includes('crowd') ||
    lower.includes('stuck')
  ) {
    passengerDisruption = 15;
    reasons.push('Causes passenger friction or potential bottleneck at entry/exit points');
  }

  // Check public hazard (spills, water logging, broken glass, wet floor)
  if (
    lower.includes('water') ||
    lower.includes('pani') ||
    lower.includes('પાણી') ||
    lower.includes('slip') ||
    lower.includes('leak')
  ) {
    publicHazard = Math.max(publicHazard, 15);
    reasons.push('Physical hazard detected (Slippery floor, spill, or water logging)');
  }

  // Calculate base score
  let urgencyScore = safetyRisk + accessibilityImpact + passengerDisruption + publicHazard;

  // Department base baseline if score is low
  if (urgencyScore < 20 && selectedDepartment !== 'General Feedback / Other') {
    urgencyScore = 30;
  }

  if (safetyOverride) {
    urgencyScore = Math.max(urgencyScore, 88); // Guaranteed P1
  }

  // Cap at 100
  urgencyScore = Math.min(100, Math.max(10, urgencyScore));

  // Determine priority
  let priority: Priority = 'P3';
  if (safetyOverride || urgencyScore >= 80) {
    priority = 'P1';
  } else if (urgencyScore >= 50) {
    priority = 'P2';
  } else if (urgencyScore >= 25) {
    priority = 'P3';
  } else {
    priority = 'P4';
  }

  if (reasons.length === 0) {
    reasons.push(`Standard ${selectedDepartment} classification based on passenger query`);
  }

  const explanation: UrgencyExplanation = {
    baseScore: urgencyScore,
    safetyOverride,
    triggers: Array.from(new Set([...departmentTriggers, ...triggerWords])),
    reasons,
    factorBreakdown: {
      safetyRisk,
      accessibilityImpact,
      passengerDisruption,
      publicHazard
    }
  };

  const confidence = departmentScores.length > 0 ? Math.min(0.95, 0.65 + departmentScores[0].hits.length * 0.1) : 0.50;

  return {
    department: selectedDepartment,
    confidence,
    detectedLanguage: detectedLang,
    normalizedText: detectedLang === 'gujlish' ? normalizeGujlish(text) : undefined,
    departmentTriggers,
    priority,
    urgencyScore,
    explanation
  };
}
