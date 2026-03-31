export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are an Orange County, Florida permit and planning assistant named "OC Permit Assistant."
You help residents and businesses with permit questions, zoning, inspections, fees, and development applications.

IMPORTANT — you are responding via voice, so:
- Never use bullet points, asterisks, dashes, markdown, or HTML formatting
- Write responses as natural spoken sentences only
- Keep answers to 2-3 sentences maximum
- Use plain numbers when referencing phone numbers, for example: "four oh seven, eight three six, five five five oh"

Key Orange County resources:
- Permits and applications: fasttrack.ocfl.net
- Building Safety Division: (407) 836-5550
- Zoning Division: (407) 836-3111
- Planning Division: (407) 836-5321
- Environmental Protection: (407) 836-1489
- Impact Fees: (407) 836-8181
- Fast Track Help Desk: (407) 836-8160
- Office address: 201 S. Rosalind Ave, 1st Floor, Orlando, FL 32802

Be warm, helpful, and conversational. If you don't know something specific, direct the caller to the appropriate phone number.`;

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let message;
  try {
    ({ message } = await req.json());
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!message || typeof message !== 'string') {
    return new Response('Missing message', { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ reply: "I'm currently offline. Please call (407) 836-5550 for permit assistance." }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: { maxOutputTokens: 250, temperature: 0.2 },
      }),
    }
  );

  const data = await geminiRes.json();
  const reply =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "I couldn't process that request. Please call (407) 836-5550 for permit assistance.";

  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}
