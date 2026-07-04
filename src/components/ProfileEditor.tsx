import { useState } from 'react';
import type { StudentProfile, Specialization, Minor } from '../types';

interface Props {
  profile: StudentProfile;
  onSave: (profile: StudentProfile) => void;
  onClose: () => void;
}

const SPECS: Specialization[] = ['Marketing A', 'Marketing B', 'Finance', 'HR', 'Operations'];
const MINORS: Minor[] = ['Marketing', 'Finance', 'HR', 'Data Analytics', 'None'];

export function ProfileEditor({ profile, onSave, onClose }: Props) {
  const [name, setName] = useState(profile.name);
  const [rollNumber, setRollNumber] = useState(profile.rollNumber);
  const [specialization, setSpecialization] = useState<Specialization>(profile.specialization);
  const [minor, setMinor] = useState<Minor>(profile.minor);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Name cannot be empty'); return; }
    if (!rollNumber.trim()) { setError('Roll number cannot be empty'); return; }
    onSave({ name: name.trim(), rollNumber: rollNumber.trim(), specialization, minor });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-t-3xl pb-8 pt-6 px-5"
        style={{ background: '#0f1219', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}>

        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: 'rgba(255,255,255,0.15)' }} />

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Edit Profile</h2>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9ca3af' }}>Full Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Roll Number */}
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: '#9ca3af' }}>Roll Number</label>
            <input
              value={rollNumber}
              onChange={e => setRollNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: '#9ca3af' }}>Specialization</label>
            <div className="grid grid-cols-2 gap-2">
              {SPECS.map(s => (
                <button key={s} onClick={() => setSpecialization(s)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
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

          {/* Minor */}
          <div>
            <label className="text-xs font-medium mb-2 block" style={{ color: '#9ca3af' }}>Minor</label>
            <div className="grid grid-cols-2 gap-2">
              {MINORS.map(m => (
                <button key={m} onClick={() => setMinor(m)}
                  className="px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all"
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

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button onClick={handleSave}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm mt-2"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)' }}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
