import { Complaint } from '../types';
import { classifyComplaint } from '../services/classifier';
import { generateDraftResponse } from '../services/templates';

interface SeedSpec {
  id: string;
  originalText: string;
  station: string;
  sourceChannel: 'Mobile App' | 'Twitter / X' | 'Email' | 'Paper Form' | 'WhatsApp / SMS';
  passengerName: string;
  hoursAgo: number;
  duplicateClusterId?: string;
  isDuplicateConfirmed?: boolean;
}

const RAW_SEEDS: SeedSpec[] = [
  // 1. Safety Critical P1 - English
  {
    id: 'SAH-2026-1001',
    originalText: 'There is thick smoke and sparking wires near the electrical distribution room on Platform 1!',
    station: 'Gandhinagar Capital',
    sourceChannel: 'Mobile App',
    passengerName: 'Aarav Patel',
    hoursAgo: 1
  },
  // 2. Lifts & Escalators P2 - Gujarati
  {
    id: 'SAH-2026-1002',
    originalText: 'સ્ટેશનની લિફ્ટ બંધ છે, વ્હીલચેરમાં બેઠેલા મારા દાદાને ઉપર જવામાં ભારે મુશ્કેલી પડી રહી છે.',
    station: 'Infocity',
    sourceChannel: 'WhatsApp / SMS',
    passengerName: 'Jignesh Shah',
    hoursAgo: 3,
    duplicateClusterId: 'INC-INFOCITY-LIFT-01',
    isDuplicateConfirmed: true
  },
  // 3. Lifts & Escalators P2 - Gujlish (Duplicate candidate for 1002 & 1004)
  {
    id: 'SAH-2026-1003',
    originalText: 'Station ni lift bandh chhe bhai, elderly passengers stairs chadva ma hairan thay chhe.',
    station: 'Infocity',
    sourceChannel: 'Twitter / X',
    passengerName: 'Mehul Dave',
    hoursAgo: 2,
    duplicateClusterId: 'INC-INFOCITY-LIFT-01',
    isDuplicateConfirmed: true
  },
  // 4. Lifts & Escalators P2 - English (Duplicate candidate for Infocity lift)
  {
    id: 'SAH-2026-1004',
    originalText: 'Elevator at Infocity station is out of order and stuck between concourse and platform level.',
    station: 'Infocity',
    sourceChannel: 'Email',
    passengerName: 'Pooja Bhatt',
    hoursAgo: 3,
    duplicateClusterId: 'INC-INFOCITY-LIFT-01',
    isDuplicateConfirmed: true
  },
  // 5. Cleanliness P2 - Hindi
  {
    id: 'SAH-2026-1005',
    originalText: 'प्लेटफॉर्म 2 पर भारी पानी जमा है और काई जम गई है, दो यात्री फिसलते हुए बाल-बाल बचे।',
    station: 'Motera Stadium',
    sourceChannel: 'Mobile App',
    passengerName: 'Rajesh Verma',
    hoursAgo: 4
  },
  // 6. Fare & Ticketing P3 - English
  {
    id: 'SAH-2026-1006',
    originalText: 'My travel card was charged twice at the exit AFC gate turnstile (Txn ref: AFC-88219). Deducted Rs 40 extra.',
    station: 'Old High Court',
    sourceChannel: 'Mobile App',
    passengerName: 'Ananya Sharma',
    hoursAgo: 5
  },
  // 7. Safety Critical P1 - Hindi
  {
    id: 'SAH-2026-1007',
    originalText: 'एस्केलेटर अचानक तेज झटके से रुक गया और नीचे गिरने से एक महिला के सिर पर चोट और खून निकला है!',
    station: 'Sector 10',
    sourceChannel: 'Paper Form',
    passengerName: 'Manoj Kumar',
    hoursAgo: 1
  },
  // 8. Staff Behaviour P3 - Gujarati
  {
    id: 'SAH-2026-1008',
    originalText: 'ટિકિટ કાઉન્ટર પર બેઠેલા સ્ટાફ દ્વારા વરિષ્ઠ નાગરિક સાથે અત્યંત તોછડું વર્તન કરવામાં આવ્યું અને રાડારાડી કરી.',
    station: 'APMC',
    sourceChannel: 'Paper Form',
    passengerName: 'Hasmukhbhai Prajapati',
    hoursAgo: 6
  },
  // 9. Cleanliness P3 - Gujarati
  {
    id: 'SAH-2026-1009',
    originalText: 'પ્લેટફોર્મ પર કચરાપેટી ભરાઈ ગઈ છે, ચારેબાજુ પ્લાસ્ટિક બોટલ અને ગંદકી છે તેમજ દુર્ગંધ આવી રહી છે.',
    station: 'Gandhinagar Capital',
    sourceChannel: 'WhatsApp / SMS',
    passengerName: 'Bhavik Joshi',
    hoursAgo: 7
  },
  // 10. General Feedback P4 - Gujlish
  {
    id: 'SAH-2026-1010',
    originalText: 'Morning ma 8 to 10 am office rush ma train frequency vadharo, bahu bheed thay chhe.',
    station: 'GIFT City',
    sourceChannel: 'Twitter / X',
    passengerName: 'Kinjal Trivedi',
    hoursAgo: 8
  },
  // 11. Safety P1 - Gujarati
  {
    id: 'SAH-2026-1011',
    originalText: 'પ્લેટફોર્મ 1 પર ખુલ્લા ઇલેક્ટ્રિક વાયરમાંથી તણખા નીકળે છે અને કરંટ લાગવાનું ગંભીર જોખમ છે!',
    station: 'Mahatma Mandir',
    sourceChannel: 'Mobile App',
    passengerName: 'Jayesh Parmar',
    hoursAgo: 1
  },
  // 12. Fare & Ticketing P2 - Gujarati
  {
    id: 'SAH-2026-1012',
    originalText: 'ટિકિટ વેન્ડિંગ મશીન (TVM-3) પર UPI થી પેમેન્ટ કર્યું પણ ટિકિટ બહાર ના આવી અને પૈસા કપાઈ ગયા.',
    station: 'Sabarmati',
    sourceChannel: 'Mobile App',
    passengerName: 'Nirav Soni',
    hoursAgo: 9
  },
  // 13. Fare & Ticketing P2 - Gujlish (Duplicate of 1012 TVM-3 UPI failure)
  {
    id: 'SAH-2026-1013',
    originalText: 'Sabarmati TVM machine ma QR code scan karyu, Rs 30 account mathi cut pan token nathi aavyu.',
    station: 'Sabarmati',
    sourceChannel: 'WhatsApp / SMS',
    passengerName: 'Hardik Vora',
    hoursAgo: 9,
    duplicateClusterId: 'INC-SABARMATI-TVM-02'
  },
  // 14. Staff Behaviour P3 - English
  {
    id: 'SAH-2026-1014',
    originalText: 'Security personnel at baggage scanner was using abusive language and refused to assist with luggage inspection.',
    station: 'GIFT City',
    sourceChannel: 'Email',
    passengerName: 'Rohan Mehra',
    hoursAgo: 10
  },
  // 15. Cleanliness P3 - Hindi
  {
    id: 'SAH-2026-1015',
    originalText: 'स्टेशन के प्रथम तल वाले शौचालय में बहुत गंदा पानी भरा है और नल टूटा हुआ है।',
    station: 'Motera Stadium',
    sourceChannel: 'Paper Form',
    passengerName: 'Suresh Yadav',
    hoursAgo: 11
  },
  // 16. General Feedback P4 - English
  {
    id: 'SAH-2026-1016',
    originalText: 'Digital passenger information display at concourse area is showing black screen since yesterday.',
    station: 'Sector 10',
    sourceChannel: 'Mobile App',
    passengerName: 'Kavita Iyer',
    hoursAgo: 12
  },
  // 17. Safety Critical P1 - English
  {
    id: 'SAH-2026-1017',
    originalText: 'Emergency call button on platform column is broken and passenger glass is shattered.',
    station: 'Old High Court',
    sourceChannel: 'Mobile App',
    passengerName: 'Vikram Merchant',
    hoursAgo: 3
  },
  // 18. Lifts & Escalators P2 - Hindi
  {
    id: 'SAH-2026-1018',
    originalText: 'गेट नंबर 3 का एस्केलेटर बंद है, भारी बैग वाले मुसाफिरों को काफी कष्ट हो रहा है।',
    station: 'Gandhinagar Capital',
    sourceChannel: 'WhatsApp / SMS',
    passengerName: 'Deepak Shukla',
    hoursAgo: 14
  },
  // 19. Fare & Ticketing P3 - Hindi
  {
    id: 'SAH-2026-1019',
    originalText: 'स्मार्ट कार्ड ऑटो-टॉपअप ऐप में फेल दिखा रहा है लेकिन बैंक अकाउंट से 200 रुपये काट लिए गए।',
    station: 'APMC',
    sourceChannel: 'Mobile App',
    passengerName: 'Pankaj Mishra',
    hoursAgo: 15
  },
  // 20. Staff Behaviour P3 - Gujlish
  {
    id: 'SAH-2026-1020',
    originalText: 'Customer care executive at counter refused to give token and told to use app only in very rude tone.',
    station: 'Infocity',
    sourceChannel: 'Twitter / X',
    passengerName: 'Darshan Thakkar',
    hoursAgo: 16
  },
  // 21. General Feedback P4 - Gujarati
  {
    id: 'SAH-2026-1021',
    originalText: 'મેટ્રો કોચ નંબર 104 માં એર કન્ડીશનીંગ કુલિંગ બહુ ઓછું છે અને ગરમી લાગે છે.',
    station: 'Mahatma Mandir',
    sourceChannel: 'Mobile App',
    passengerName: 'Sneha Chawda',
    hoursAgo: 18
  },
  // 22. Cleanliness P3 - Gujlish
  {
    id: 'SAH-2026-1022',
    originalText: 'Pani na cooler pase kachro ane paani dholayelu chhe, cleaning staff ne bolo.',
    station: 'Sector 10',
    sourceChannel: 'WhatsApp / SMS',
    passengerName: 'Pratik Solanki',
    hoursAgo: 20
  }
];

export function getSyntheticSeedData(): Complaint[] {
  const now = new Date();

  return RAW_SEEDS.map((item) => {
    const classification = classifyComplaint(item.originalText, item.station);
    const draft = generateDraftResponse(classification.detectedLanguage, {
      id: item.id,
      department: classification.department,
      station: item.station,
      priority: classification.priority,
      passengerName: item.passengerName
    });

    const createdAt = new Date(now.getTime() - item.hoursAgo * 3600 * 1000).toISOString();

    return {
      id: item.id,
      createdAt,
      updatedAt: createdAt,
      sourceChannel: item.sourceChannel,
      station: item.station,
      passengerName: item.passengerName,
      originalText: item.originalText,
      detectedLanguage: classification.detectedLanguage,
      normalizedText: classification.normalizedText,
      department: classification.department,
      priority: classification.priority,
      urgencyScore: classification.urgencyScore,
      classificationExplanation: classification.explanation,
      suggestedResponse: draft.response,
      responseLanguage: draft.responseLanguage,
      isResponseApproved: false,
      status: item.id === 'SAH-2026-1002' ? 'In Progress' : 'Pending Review',
      assignedUnit: item.id === 'SAH-2026-1002' ? 'Elevator Maint Team Bravo' : undefined,
      duplicateClusterId: item.duplicateClusterId,
      isDuplicateConfirmed: item.isDuplicateConfirmed,
      syncStatus: 'Saved Locally',
      isSynthetic: true,
      auditTrail: [
        {
          id: `aud-${Date.now()}-${item.id}`,
          timestamp: createdAt,
          action: 'Complaint Ingested & Classified Offline',
          performedBy: 'Sahaay Deterministic AI Engine',
          notes: `Assigned ${classification.department} (${classification.priority}) with urgency score ${classification.urgencyScore}`
        }
      ]
    };
  });
}
