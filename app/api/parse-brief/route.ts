import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ATELIER_API_KEY || 'mock-key', 
});

export async function POST(req: Request) {
  try {
    const { brief } = await req.json();
    
    if (process.env.ATELIER_API_KEY) {
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: "You are Atelier's design engine. Parse the brief into structured JSON: { sqft, beds, baths, style, story_count, lot_size, must_haves[], optional_features[], code_jurisdiction_hint }. Return JSON only, no prose.",
        messages: [{ role: "user", content: brief }]
      });
      console.log("Parsed JSON:", msg.content);
      return NextResponse.json({ success: true, result: msg.content });
    } else {
      // Mock parsing
      return NextResponse.json({ success: true, mock: true });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
