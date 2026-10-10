import { classifyComplaint } from './services/classifier';
import { generateDraftResponse } from './services/templates';
import { findDuplicatesForComplaint } from './services/duplicates';
import { getSyntheticSeedData } from './data/seedData';

console.log('=== RUNNING SAHAAY AI OFFLINE ENGINE TEST ===');

// 1. Test Safety Override
const safetyCase = classifyComplaint('There is thick smoke and fire sparking near electrical distribution room');
console.log('1. Safety Case Priority:', safetyCase.priority, '(Expected P1)');
console.log('   Urgency Score:', safetyCase.urgencyScore, 'Safety Override:', safetyCase.explanation.safetyOverride);
if (safetyCase.priority !== 'P1' || !safetyCase.explanation.safetyOverride) {
  throw new Error('Safety override failed');
}

// 2. Test Gujarati Language & Department
const gujaratiCase = classifyComplaint('સ્ટેશનની લિફ્ટ બંધ છે, વ્હીલચેરમાં બેઠેલા મારા દાદાને મુશ્કેલી પડે છે.');
console.log('2. Gujarati Case Lang:', gujaratiCase.detectedLanguage, 'Dept:', gujaratiCase.department, 'Priority:', gujaratiCase.priority);
if (gujaratiCase.detectedLanguage !== 'gu' || gujaratiCase.department !== 'Lifts & Escalators') {
  throw new Error('Gujarati lift classification failed');
}

// 3. Test Gujlish Language & Normalization
const gujlishCase = classifyComplaint('Station ni lift bandh chhe bhai, elderly passengers stairs chadva ma hairan thay chhe.');
console.log('3. Gujlish Case Lang:', gujlishCase.detectedLanguage, 'Dept:', gujlishCase.department);
console.log('   Normalized:', gujlishCase.normalizedText);
if (gujlishCase.detectedLanguage !== 'gujlish' || gujlishCase.department !== 'Lifts & Escalators') {
  throw new Error('Gujlish lift classification failed');
}

// 4. Test Hindi Cleanliness Case
const hindiCase = classifyComplaint('प्लेटफॉर्म 2 पर भारी पानी जमा है और काई जम गई है, दो यात्री फिसलते हुए बाल-बाल बचे।');
console.log('4. Hindi Case Lang:', hindiCase.detectedLanguage, 'Dept:', hindiCase.department, 'Priority:', hindiCase.priority);
if (hindiCase.detectedLanguage !== 'hi') {
  throw new Error('Hindi language detection failed');
}

// 5. Test Multilingual Response Drafting
const gujDraft = generateDraftResponse('gu', {
  id: 'SAH-TEST-01',
  department: 'Lifts & Escalators',
  station: 'Infocity',
  priority: 'P2'
});
console.log('5. Gujarati Draft Response Generated:\n', gujDraft.response);
if (!gujDraft.response.includes('નમસ્તે') || !gujDraft.response.includes('Infocity')) {
  throw new Error('Gujarati response template failed');
}

// 6. Test Duplicate Clustering
const seeds = getSyntheticSeedData();
const infocityLift1 = seeds.find((c) => c.id === 'SAH-2026-1002')!;
const duplicates = findDuplicatesForComplaint(infocityLift1, seeds);
console.log('6. Duplicates Found for Infocity Lift (1002):', duplicates.map((d) => `${d.candidateId} (score: ${d.similarityScore})`));
if (duplicates.length < 2) {
  throw new Error('Duplicate detection failed for Infocity lift');
}

console.log('=== ALL OFFLINE ENGINE TESTS PASSED 100% SUCCESSFULLY! ===');
