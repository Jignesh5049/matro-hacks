import { Department, Language, Priority } from '../types';

interface TemplateParams {
  id: string;
  department: Department;
  station: string;
  priority: Priority;
  passengerName?: string;
}

export function generateDraftResponse(
  lang: Language,
  params: TemplateParams
): { response: string; responseLanguage: Language } {
  const { id, department, station, priority, passengerName } = params;
  const greetingEn = passengerName ? `Dear ${passengerName}` : 'Dear Metro Passenger';
  const greetingHi = passengerName ? `प्रिय ${passengerName}` : 'प्रिय मेट्रो यात्री';
  const greetingGu = passengerName ? `આદરણીય ${passengerName}` : 'આદરણીય મેટ્રો મુસાફર';

  // For Gujlish, we default to Gujarati or English professional formal response, but tag it clearly
  let effectiveLang: Language = lang;
  if (lang === 'gujlish') {
    // Metro passengers who write Gujlish appreciate clear Gujarati or English; provide Gujarati by default
    effectiveLang = 'gu';
  } else if (lang === 'unknown') {
    effectiveLang = 'en';
  }

  if (effectiveLang === 'gu') {
    let deptText = 'આપની ફરિયાદ';
    if (department === 'Safety') deptText = 'સુરક્ષા અને સલામતી સંબંધિત બાબત';
    else if (department === 'Lifts & Escalators') deptText = 'લિફ્ટ / એસ્કેલેટર સંબંધિત સમસ્યા';
    else if (department === 'Cleanliness') deptText = 'સ્વચ્છતા સંબંધિત બાબત';
    else if (department === 'Fare & Ticketing') deptText = 'ટિકિટિંગ અને ભાડા સંબંધિત વિગત';
    else if (department === 'Staff Behaviour') deptText = 'મેટ્રો સ્ટાફ સેવા સંબંધિત બાબત';

    let urgencyNote = '';
    if (priority === 'P1') {
      urgencyNote = ' આ ફરિયાદને સર્વોચ્ચ અગ્રતા (P1) આપી સ્ટેશન કંટ્રોલર અને સુરક્ષા ટીમને ત્વરિત કાર્યવાહી માટે મોકલવામાં આવી છે.';
    }

    const text = `${greetingGu}, 

નમસ્તે. ${station} સ્ટેશન પર ${deptText} અંગે આપનો સંદેશ (ફરિયાદ નં. ${id}) નોંધવામાં આવ્યો છે.${urgencyNote} 

અમારી ઓપરેશન્સ ટીમ દ્વારા આ બાબતની ચકાસણી કરવામાં આવી રહી છે. આપના સહકાર બદલ ધન્યવાદ.

- મેટ્રો ઓપરેશન્સ કંટ્રોલ રૂમ (સહાય AI)`;

    return { response: text, responseLanguage: 'gu' };
  }

  if (effectiveLang === 'hi') {
    let deptText = 'आपकी शिकायत';
    if (department === 'Safety') deptText = 'सुरक्षा एवं आपातकालीन मामला';
    else if (department === 'Lifts & Escalators') deptText = 'लिफ्ट अथवा एस्केलेटर संबंधी समस्या';
    else if (department === 'Cleanliness') deptText = 'स्वच्छता एवं रख-रखाव';
    else if (department === 'Fare & Ticketing') deptText = 'किराया एवं टिकट प्रणाली संबंधी विषय';
    else if (department === 'Staff Behaviour') deptText = 'स्टाफ व्यवहार संबंधी विषय';

    let urgencyNote = '';
    if (priority === 'P1') {
      urgencyNote = ' इसे उच्च प्राथमिकता (P1) के तहत स्टेशन कंट्रोलर एवं सुरक्षा दल को तत्काल निरीक्षण हेतु प्रेषित किया गया है।';
    }

    const text = `${greetingHi}, 

नमस्कार। ${station} स्टेशन पर ${deptText} संबंधी आपकी रिपोर्ट (शिकायत क्रमांक: ${id}) सिस्टम में दर्ज कर ली गई है।${urgencyNote} 

हमारी संबंधित टीम द्वारा आवश्यक जांच की जा रही है। धैर्य बनाए रखने हेतु धन्यवाद।

- मेट्रो ऑपरेशंस कंट्रोल सेंटर (सहाय AI)`;

    return { response: text, responseLanguage: 'hi' };
  }

  // Default: English
  let deptText = 'your grievance';
  if (department === 'Safety') deptText = 'safety-critical report';
  else if (department === 'Lifts & Escalators') deptText = 'lift / escalator service issue';
  else if (department === 'Cleanliness') deptText = 'cleanliness and upkeep matter';
  else if (department === 'Fare & Ticketing') deptText = 'fare and ticketing query';
  else if (department === 'Staff Behaviour') deptText = 'staff conduct report';

  let urgencyNote = '';
  if (priority === 'P1') {
    urgencyNote = ' This has been escalated with highest priority (P1) directly to the Station Controller and rapid maintenance unit.';
  }

  const text = `${greetingEn},

Thank you for reaching out. Your report regarding ${deptText} at ${station} station has been formally recorded under reference ID: ${id}.${urgencyNote}

Our field operations team has been notified to investigate. We appreciate your vigilance in keeping our metro safe and reliable.

- Metro Operations Control Centre (Sahaay AI)`;

  return { response: text, responseLanguage: 'en' };
}
