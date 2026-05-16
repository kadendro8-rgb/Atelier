"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BriefPage() {
  const [brief, setBrief] = useState('');
  const [state, setState] = useState<'idle' | 'parsing' | 'drafting' | 'sizing' | 'done'>('idle');
  const [showSave, setShowSave] = useState(false);
  const [email, setEmail] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const chips = [
    { label: 'Modern farmhouse', text: '4-bed single story modern farmhouse, vaulted great room, wraparound porch, 0.6-ac lot.' },
    { label: 'Lake home', text: '3-bed walkout lake home, dock-side massing, glass rear wall.' },
    { label: 'Craftsman bungalow', text: '2-bed craftsman bungalow, front porch, exposed rafter tails.' }
  ];

  async function handleGenerate() {
    setState('parsing');
    await fetch('/api/parse-brief', { method: 'POST', body: JSON.stringify({ brief }) });
    
    setTimeout(() => setState('drafting'), 1000);
    setTimeout(() => setState('sizing'), 4000);
    setTimeout(() => {
      setState('done');
      router.push('/builder/floor-plan');
    }, 6000);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/save-brief', { method: 'POST', body: JSON.stringify({ email, brief }) });
    alert('Saved. Check your inbox.');
    setShowSave(false);
  }

  const generateText = {
    idle: 'Generate 6 variants',
    parsing: 'Parsing brief...',
    drafting: 'Drafting floor plan...',
    sizing: 'Sizing rooms...',
    done: 'Done — opening step 2'
  };

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#F4F0E8] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Step 1: Brief</h1>
        <p className="text-[#8A857C] mb-8">Describe the home you want to build.</p>
        
        <div className="flex gap-2 mb-4">
          {chips.map(c => (
            <button 
              key={c.label} 
              onClick={() => setBrief(c.text)}
              className="text-xs border border-[#262626] rounded-full px-3 py-1 hover:border-[#C8956D] hover:bg-[#C8956D]/10"
            >
              {c.label}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={brief}
          onChange={e => setBrief(e.target.value)}
          placeholder="e.g. 3-bedroom modern farmhouse with a wraparound porch..."
          className="w-full min-h-[160px] bg-[#141414] border border-[#262626] p-4 rounded focus:outline-none focus:border-[#C8956D] focus:ring-1 focus:ring-[#C8956D] mb-4 text-[#F4F0E8] resize-y"
        />

        <div className="flex justify-between items-center">
          <button onClick={() => setShowSave(true)} className="text-[#8A857C] text-sm hover:text-[#F4F0E8] underline">
            Save brief and come back later
          </button>
          
          <div className="flex items-center gap-4">
            <span className="text-[#8A857C] text-sm" title="This is a demo disclaimer">ℹ️</span>
            <button 
              onClick={handleGenerate}
              disabled={state !== 'idle' || !brief}
              className="bg-[#C8956D] text-[#0b0a09] font-bold px-8 py-3 rounded hover:bg-[#E0B89A] disabled:opacity-50 disabled:cursor-not-allowed w-64"
            >
              {generateText[state]}
            </button>
          </div>
        </div>
      </div>

      {showSave && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-[#141414] p-8 rounded-xl border border-[#262626] w-[400px]">
            <h3 className="font-bold mb-4">Save for later</h3>
            <form onSubmit={handleSave}>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Email address" 
                className="w-full bg-[#0b0a09] border border-[#262626] p-3 rounded mb-4"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSave(false)} className="px-4 py-2 text-sm text-[#8A857C]">Cancel</button>
                <button type="submit" className="bg-[#C8956D] text-[#0b0a09] px-4 py-2 rounded text-sm font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
