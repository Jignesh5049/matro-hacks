import React from 'react';
import { Sparkles } from 'lucide-react';

interface DemoTourProps {
  onTriggerDemoStep: (step: number) => void;
  currentStep: number;
}

export const DemoTourBanner: React.FC<DemoTourProps> = ({ onTriggerDemoStep, currentStep }) => {
  const steps = [
    { title: '1. Seed Data', desc: 'Inspect synthetic complaints across Gujarati, Hindi, English, and Gujlish' },
    { title: '2. Batch Import', desc: 'Import mixed-language CSV file with offline validation' },
    { title: '3. Safety P1 Escalation', desc: 'Inspect electrical hazard escalated to P1 with explainability reasons' },
    { title: '4. Multilingual Reply', desc: 'Review Gujarati/Gujlish response draft and approve it' },
    { title: '5. Duplicates', desc: 'Inspect Infocity lift duplicate cluster grouping multiple passengers' },
    { title: '6. Offline Mode', desc: 'Switch to offline mode, create complaint, refresh page to verify persistence' }
  ];

  return (
    <div className="demo-banner">
      <div className="banner-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>
          <Sparkles size={16} />
          <span>Demo Guide:</span>
        </div>
        <div style={{ fontSize: '0.825rem', color: '#334155' }}>
          <strong style={{ color: '#0f172a' }}>{steps[currentStep % steps.length].title}</strong> — {steps[currentStep % steps.length].desc}
        </div>
      </div>

      <div className="banner-actions">
        {steps.map((st, idx) => (
          <button
            key={idx}
            className={`btn-demo-quick ${currentStep === idx ? 'active' : ''}`}
            onClick={() => onTriggerDemoStep(idx)}
          >
            Step {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
