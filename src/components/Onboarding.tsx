import { useState } from 'react';
import type { StudentProfile, Specialization, Minor, Elective, Year } from '../types';

interface Props {
  onComplete: (profile: StudentProfile) => void;
}

const SPECS: Specialization[] = ['Marketing A', 'Marketing B', 'Finance', 'HR', 'Operations'];
const MINORS: Minor[] = ['Marketing', 'Finance', 'HR', 'Data Analytics', 'None'];
const ELECTIVES: Elective[] = ['Doing Business in India', 'Indian Film Industry', 'Governance and Corporate Sustainability'];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [year, setYear] = useState<Year | ''>('');
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [specialization, setSpecialization] = useState<Specialization | ''>('');
  const [minor, setMinor] = useState<Minor | ''>('');
  const [elective, setElective] = useState<Elective | ''>('');
  const [error, setError] = useState('');

  const totalSteps = year === 'Y1' ? 4 : 4;

  const handleNext = () => {
    setError('');
    if (step === 0) {
      if (!year) { setError('Please select your year'); return; }
      setStep(1);
    } else if (step === 1) {
      if (!name.trim() || !rollNumber.trim()) { setError('Please fill in all fields'); return; }
      setStep(2);
    } else if (step === 2) {
      if (!specialization) { setError('Please select your specialization'); return; }
      setStep(3);
    } else if (step === 3) {
      if (year === 'Y2' && !minor) { setError('Please select your minor'); return; }
      if (year === 'Y1' && !elective) { setError('Please select your elective'); return; }
      onComplete({
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        specialization: specialization as Specialization,
        minor: year === 'Y2' ? minor as Minor : 'None',
        elective: year === 'Y1' ? elective as Elective : 'None',
        year: year as Year,
      });
    }
  };

  const stepLabels = year === 'Y1'
    ? ['Year', 'Details', 'Specialization', 'Elective']
    : ['Year', 'Details', 'Specialization', 'Minor'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
            <span className="text-2xl font-black text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SIBM Connect</h1>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Your MBA timetable, simplified</p>
        </div>

        {/* Step indicators */}
        <div className="flex gap-2 justify-center mb-8">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '32px' : '8px',
                background: i <= step ? 'linear-gradient(90deg, #6366f1, #a78bfa)' : '#374151',
              }} />
          ))}
        </div>

        <div className="glass-strong rounded-3xl p-6">

          {/* Step 0 — Year selection */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Welcome!</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Select your MBA year</p>
              <div className="space-y-3">
                {[
{ value: 'Y1', label: 'MBA Year 1', sub: 'Batch 2026-28', icon: '1️⃣' },
{ value: 'Y2', label: 'MBA Year 2', sub: 'Batch 2025-27', icon: '2️⃣' },
                ].map(({ value, label, sub, icon }) => (
                  <button key={value} onClick={() => setYear(value as Year)}
                    className="w-full px-4 py-4 rounded-xl text-left transition-all"
                    style={{
                      background: year === value
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      border: year === value
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                    }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: year === value ? '#a78bfa' : '#e5e7eb' }}>{label}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Name & Roll */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Your Details</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>
                {year === 'Y1' ? 'MBA Year 1' : 'MBA Year 2'} · Set up your profile once
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9ca3af' }}>Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onKeyDown={e => e.key === 'Enter' && handleNext()} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9ca3af' }}>Roll Number</label>
                  <input value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                    placeholder="e.g. MBA2024001"
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onKeyDown={e => e.key === 'Enter' && handleNext()} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Specialization */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Specialization</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Your primary MBA specialization</p>
              <div className="space-y-2">
                {SPECS.map(s => (
                  <button key={s} onClick={() => setSpecialization(s)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{
                      background: specialization === s
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      border: specialization === s
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: specialization === s ? '#a78bfa' : '#e5e7eb',
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Minor (Y2) or Elective (Y1) */}
          {step === 3 && year === 'Y2' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Minor</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Your minor specialization</p>
              <div className="space-y-2">
                {MINORS.map(m => (
                  <button key={m} onClick={() => setMinor(m)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{
                      background: minor === m
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      border: minor === m
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: minor === m ? '#a78bfa' : '#e5e7eb',
                    }}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && year === 'Y1' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Elective</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Your chosen internal elective</p>
              <div className="space-y-2">
                {ELECTIVES.map(e => (
                  <button key={e} onClick={() => setElective(e)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left"
                    style={{
                      background: elective === e
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      border: elective === e
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: elective === e ? '#a78bfa' : '#e5e7eb',
                    }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs mt-3 text-red-400">{error}</p>}

          <div className="flex gap-2 mt-6">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="px-4 py-3.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
                ← Back
              </button>
            )}
            <button onClick={handleNext}
              className="flex-1 py-3.5 rounded-xl font-semibold text-white text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
              {step < 3 ? 'Continue' : "Let's go →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
