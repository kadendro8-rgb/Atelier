"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LotPicker() {
  const [address, setAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const router = useRouter();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    // Mock geocoding search
    setTimeout(() => {
      setSearching(false);
      setFound(true);
    }, 1000);
  }

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#F4F0E8] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">Step 0: Pick a lot</h1>
        <p className="text-[#8A857C] mb-8">Enter the address of the lot you are building on.</p>
        
        <form onSubmit={handleSearch} className="flex gap-4 mb-8">
          <input 
            type="text" 
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="Address or APN" 
            className="flex-1 bg-[#141414] border border-[#262626] p-4 rounded text-[#F4F0E8] focus:outline-none focus:border-[#C8956D]"
          />
          <button type="submit" className="bg-[#C8956D] text-[#0b0a09] font-bold px-8 rounded hover:bg-[#E0B89A]">
            {searching ? 'Locating...' : 'Search'}
          </button>
        </form>

        {found && (
          <div className="border border-[#262626] rounded bg-[#141414] p-4 mb-8">
            <div className="h-64 bg-[#262626] rounded flex items-center justify-center mb-4">
              <span className="text-[#8A857C]">[MapLibre GL Map Satellite View]</span>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('lotAddress', address);
                router.push('/builder/brief');
              }}
              className="w-full bg-[#C8956D] text-[#0b0a09] font-bold py-3 rounded hover:bg-[#E0B89A]"
            >
              Confirm Parcel & Continue
            </button>
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={() => router.push('/builder/brief')}
            className="text-[#8A857C] hover:text-[#C8956D] text-sm"
          >
            Skip — design without a lot
          </button>
        </div>
      </div>
    </div>
  );
}
