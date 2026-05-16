"use client";

import { useEffect, useState } from 'react';

type ParsedRequirements = {
  sqft: number;
  beds: number;
  baths: number;
  style: string;
  story_count: number;
  lot_size: string;
  must_haves: string[];
  optional_features: string[];
  code_jurisdiction_hint: string;
};

export default function FloorPlanPage() {
  const [data, setData] = useState<ParsedRequirements | null>(null);

  useEffect(() => {
    // In a real app we'd fetch the parsed JSON from context or a database
    setData({
      sqft: 2400,
      beds: 3,
      baths: 2.5,
      style: "modern farmhouse",
      story_count: 1,
      lot_size: "0.6 acres",
      must_haves: ["vaulted great room", "wraparound porch"],
      optional_features: [],
      code_jurisdiction_hint: "IRC 2021"
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0a09] text-[#F4F0E8] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Step 2: Floor plan</h1>
        
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 border border-[#262626] p-6 rounded bg-[#141414]">
            <h2 className="font-bold mb-4 text-[#8A857C]">Parsed Requirements</h2>
            <pre className="text-xs overflow-auto text-[#C8956D]">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          
          <div className="col-span-2 border border-[#262626] rounded flex flex-col items-center justify-center p-12 bg-[#141414]">
            <div className="w-full aspect-video border border-dashed border-[#262626] flex items-center justify-center mb-8">
              <span className="text-[#8A857C]">Floor Plan Canvas (v1.6)</span>
            </div>
            <button className="bg-[#C8956D] text-[#0b0a09] font-bold px-8 py-3 rounded hover:bg-[#E0B89A]">
              Approve & Continue to Site Fit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
