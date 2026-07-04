import { useState } from 'react';
import type { StudentProfile, Specialization, Minor } from '../types';

interface Props {
  onComplete: (profile: StudentProfile) => void;
}

const SPECS: Specialization[] = ['Marketing A', 'Marketing B', 'Finance', 'HR', 'Operations'];
const MINORS: Minor[] = ['Marketing', 'Finance', 'HR', 'Data Analytics', 'None'];

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [specialization, setSpecialization] = useState<Specialization | ''>('');
  const [minor, setMinor] = useState<Minor | ''>('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim() || !rollNumber.trim()) {
        setError('Please fill in all fields');
        return;
      }
      setError('');
      setStep(1);
    } else if (step === 1) {
      if (!specialization) {
        setError('Please select your specialization');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!minor) {
        setError('Please select your minor (choose None if not applicable)');
        return;
      }
      setError('');
      onComplete({
        name: name.trim(),
        rollNumber: rollNumber.trim(),
        specialization: specialization as Specialization,
        minor: minor as Minor,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
            <span className="text-2xl font-black text-white">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SIBM Connect</h1>
          <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>Your MBA timetable, simplified</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 justify-center mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === step ? '32px' : '8px',
                background: i <= step ? 'linear-gradient(90deg, #6366f1, #a78bfa)' : '#374151',
              }} />
          ))}
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-6">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Welcome!</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Let's set up your profile once</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9ca3af' }}>Full Name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9ca3af' }}>Roll Number</label>
                  <input
                    value={rollNumber}
                    onChange={e => setRollNumber(e.target.value)}
                    placeholder="e.g. MBA2023001"
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Specialization</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Your primary MBA specialization</p>
              <div className="space-y-2">
                {SPECS.map(s => (
                  <button
                    key={s}
                    onClick={() => setSpecialization(s)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                    style={{
                      background: specialization === s
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      border: specialization === s
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: specialization === s ? '#a78bfa' : '#e5e7eb',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Minor</h2>
              <p className="text-sm mb-6" style={{ color: '#9ca3af' }}>Your minor specialization</p>
              <div className="space-y-2">
                {MINORS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMinor(m)}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left"
                    style={{
                      background: minor === m
                        ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(167,139,250,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      border: minor === m
                        ? '1px solid rgba(99,102,241,0.5)'
                        : '1px solid rgba(255,255,255,0.08)',
                      color: minor === m ? '#a78bfa' : '#e5e7eb',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-xs mt-3 text-red-400">{error}</p>
          )}

          <button
            onClick={handleNext}
            className="w-full mt-6 py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}
          >
            {step < 2 ? 'Continue' : "Let's go →"}
          </button>
        </div>
      </div>
    </div>
  );
}
